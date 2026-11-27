import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  hashToken,
  generateRandomToken,
  generateCsrfToken,
  signAccessToken,
} from '../utils/crypto.util.js';
import {
  hashPassword,
  verifyPassword,
  dummyPasswordVerify,
} from '../utils/password.util.js';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from '../validators/auth.validator.js';
import { enqueueTransactionalEmail } from '../queues/index.js';
import { loginLockoutService } from './lockout.service.js';

export class AuthService {
  /**
   * Register a new user with profile and default organization in a single transaction.
   * Dispatches a verification email via BullMQ.
   */
  public async register(input: RegisterInput, requestId?: string) {
    const email = input.email.toLowerCase().trim();

    // Check if user already exists (anti-enumeration check)
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      logger.info({ email, requestId }, 'Registration attempted for already registered email (anti-enumeration)');
      return {
        message: 'If this email is not already registered, a verification link has been sent.',
      };
    }

    const passwordHash = await hashPassword(input.password);
    const rawVerificationToken = generateRandomToken(32);
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const orgName = input.organizationName?.trim() || `${input.firstName}'s Organization`;
    const baseSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          isEmailVerified: false,
          verificationTokenHash,
          verificationTokenExpiresAt,
          authProvider: 'LOCAL',
        },
      });

      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          displayName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          billingEmail: email,
          subscriptionTier: 'FREE',
          defaultCurrency: 'USD',
          defaultTimezone: 'UTC',
        },
      });

      const member = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'OWNER',
          isActive: true,
        },
      });

      return { user, profile, organization, member };
    });

    // Enqueue verification email via BullMQ
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
    await enqueueTransactionalEmail({
      to: email,
      subject: 'Verify your Agree2Met account',
      html: `
        <h2>Welcome to Agree2Met, ${input.firstName}!</h2>
        <p>Please click the button below to verify your email address and activate your account. This link expires in 24 hours.</p>
        <p><a href="${verificationUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email Address</a></p>
        <p>If you did not create an Agree2Met account, you can safely ignore this email.</p>
      `,
      text: `Welcome to Agree2Met, ${input.firstName}!\n\nPlease verify your email by opening the following link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    });

    logger.info({ userId: result.user.id, email, requestId }, 'User registered successfully');

    return {
      message: 'If this email is not already registered, a verification link has been sent.',
    };
  }

  /**
   * Log in user, enforce brute-force lockouts, verify password, and establish rolling session.
   */
  public async login(
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const email = input.email.toLowerCase().trim();
    const effectiveIp = (ipAddress || '127.0.0.1').trim();

    // 1. Check if (IP + email) pair or IP is currently locked
    const lockoutStatus = await loginLockoutService.isLocked(effectiveIp, email);
    if (lockoutStatus.locked) {
      logger.warn({ email, ipAddress: effectiveIp, requestId }, 'Login blocked: IP/email lockout active');
      const err = new Error('Too many login attempts. Please try again later.');
      (err as any).code = 'TOO_MANY_ATTEMPTS';
      (err as any).statusCode = 429;
      (err as any).retryAfter = lockoutStatus.retryAfter || 900;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      await dummyPasswordVerify();
      const failRecord = await loginLockoutService.recordFailedAttempt(effectiveIp, email);
      logger.warn({ email, ipAddress: effectiveIp, requestId }, 'Login failed: Unknown user');

      if (failRecord.locked) {
        const err = new Error('Too many login attempts. Please try again later.');
        (err as any).code = 'TOO_MANY_ATTEMPTS';
        (err as any).statusCode = 429;
        (err as any).retryAfter = failRecord.retryAfter || 900;
        throw err;
      }

      const err = new Error('Invalid email or password.');
      (err as any).code = 'INVALID_CREDENTIALS';
      (err as any).statusCode = 401;
      throw err;
    }

    const isValidPassword = await verifyPassword(user.passwordHash, input.password);

    if (!isValidPassword) {
      const failRecord = await loginLockoutService.recordFailedAttempt(effectiveIp, email);
      logger.warn({ userId: user.id, email, ipAddress: effectiveIp, requestId }, 'Login failed: Incorrect password');

      if (failRecord.locked) {
        const err = new Error('Too many login attempts. Please try again later.');
        (err as any).code = 'TOO_MANY_ATTEMPTS';
        (err as any).statusCode = 429;
        (err as any).retryAfter = failRecord.retryAfter || 900;
        throw err;
      }

      const err = new Error('Invalid email or password.');
      (err as any).code = 'INVALID_CREDENTIALS';
      (err as any).statusCode = 401;
      throw err;
    }

    // Reset failed attempt counts upon valid credentials
    await loginLockoutService.resetAttempts(effectiveIp, email);

    // Check email verification
    if (!user.isEmailVerified) {
      logger.warn({ userId: user.id, email, ipAddress, requestId }, 'Login blocked: Email unverified');
      const err = new Error('Please verify your email address before logging in.');
      (err as any).code = 'EMAIL_NOT_VERIFIED';
      (err as any).statusCode = 403;
      throw err;
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session with new token family
    const rawRefreshToken = generateRandomToken(32);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        familyId,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
        isRevoked: false,
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    const csrfToken = generateCsrfToken();

    logger.info({ userId: user.id, sessionId: session.id, requestId }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profile: user.profile,
      },
      accessToken,
      refreshToken: rawRefreshToken,
      csrfToken,
    };
  }

  /**
   * Rotate refresh token and issue new access token.
   * Enforces token family reuse detection (revoking family on reuse).
   */
  public async refreshToken(
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
    requestId?: string
  ) {
    if (!rawRefreshToken) {
      const err = new Error('Refresh token is required.');
      (err as any).code = 'UNAUTHORIZED';
      (err as any).statusCode = 401;
      throw err;
    }

    const tokenHash = hashToken(rawRefreshToken);

    const session = await prisma.userSession.findFirst({
      where: { refreshTokenHash: tokenHash },
      include: { user: { include: { profile: true } } },
    });

    if (!session) {
      logger.warn({ ipAddress, requestId }, 'Refresh token rejected: Token not found');
      const err = new Error('Invalid or expired refresh token.');
      (err as any).code = 'UNAUTHORIZED';
      (err as any).statusCode = 401;
      throw err;
    }

    // Reuse detection: If session was already revoked, an attacker or compromised client is reusing it
    if (session.isRevoked) {
      logger.error(
        { familyId: session.familyId, userId: session.userId, ipAddress, requestId },
        'SECURITY ALERT: Refresh token reuse detected! Revoking entire token family.'
      );

      // Revoke all sessions in the family
      await prisma.userSession.updateMany({
        where: { familyId: session.familyId },
        data: { isRevoked: true },
      });

      const err = new Error('Token reuse detected. All sessions in this family have been revoked. Please log in again.');
      (err as any).code = 'REFRESH_TOKEN_REUSE_DETECTED';
      (err as any).statusCode = 401;
      throw err;
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      logger.warn({ sessionId: session.id, userId: session.userId, requestId }, 'Refresh token expired');
      const err = new Error('Refresh token has expired. Please log in again.');
      (err as any).code = 'UNAUTHORIZED';
      (err as any).statusCode = 401;
      throw err;
    }

    // Check if user is locked
    if (session.user.lockedUntil && session.user.lockedUntil > new Date()) {
      const err = new Error('Account is temporarily locked.');
      (err as any).code = 'ACCOUNT_LOCKED';
      (err as any).statusCode = 423;
      throw err;
    }

    // Revoke old session and issue new one in the SAME family
    const newRawRefreshToken = generateRandomToken(32);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const [newSession] = await prisma.$transaction([
      prisma.userSession.create({
        data: {
          userId: session.userId,
          refreshTokenHash: newRefreshTokenHash,
          familyId: session.familyId,
          userAgent: userAgent || session.userAgent,
          ipAddress: ipAddress || session.ipAddress,
          expiresAt,
          isRevoked: false,
        },
      }),
      prisma.userSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      }),
    ]);

    const accessToken = signAccessToken({
      userId: session.userId,
      email: session.user.email,
      sessionId: newSession.id,
    });

    const csrfToken = generateCsrfToken();

    logger.info({ userId: session.userId, oldSessionId: session.id, newSessionId: newSession.id, requestId }, 'Refresh token rotated successfully');

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      csrfToken,
    };
  }

  /**
   * Log out and revoke active session.
   */
  public async logout(userId: string, sessionId: string, requestId?: string) {
    await prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { isRevoked: true },
    });

    logger.info({ userId, sessionId, requestId }, 'User logged out and session revoked');
  }

  /**
   * Verify email using one-time token.
   */
  public async verifyEmail(token: string, requestId?: string) {
    const tokenHash = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn({ requestId }, 'Email verification failed: Token invalid or expired');
      const err = new Error('Verification link is invalid or has expired.');
      (err as any).code = 'INVALID_OR_EXPIRED_TOKEN';
      (err as any).statusCode = 400;
      throw err;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      },
    });

    logger.info({ userId: user.id, requestId }, 'Email verified successfully');

    return {
      message: 'Email verified successfully. You may now log in.',
    };
  }

  /**
   * Resend verification email with a fresh 24h token.
   */
  public async resendVerification(email: string, requestId?: string) {
    const normalized = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalized },
      include: { profile: true },
    });

    if (user && !user.isEmailVerified) {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationTokenHash: tokenHash,
          verificationTokenExpiresAt: expiresAt,
        },
      });

      const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`;
      await enqueueTransactionalEmail({
        to: user.email,
        subject: 'Verify your Agree2Met account',
        html: `
          <h2>Hello ${user.profile?.firstName || 'there'}!</h2>
          <p>You requested a new verification link. Please click below to verify your email address:</p>
          <p><a href="${verificationUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email Address</a></p>
          <p>This link expires in 24 hours.</p>
        `,
        text: `Please verify your email address:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
      });

      logger.info({ userId: user.id, requestId }, 'Verification email resent');
    } else {
      logger.info({ email: normalized, requestId }, 'Resend verification skipped (user not found or already verified)');
    }

    return {
      message: 'If an unverified account exists with this email, a new verification link has been sent.',
    };
  }

  /**
   * Request password reset token.
   */
  public async forgotPassword(email: string, requestId?: string) {
    const normalized = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalized },
      include: { profile: true },
    });

    if (user) {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
      await enqueueTransactionalEmail({
        to: user.email,
        subject: 'Reset your Agree2Met password',
        html: `
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your Agree2Met password. Click the link below to choose a new password:</p>
          <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
          <p>This link expires in 1 hour. If you did not make this request, please ignore this email.</p>
        `,
        text: `Reset your Agree2Met password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
      });

      logger.info({ userId: user.id, requestId }, 'Password reset instructions dispatched');
    } else {
      await dummyPasswordVerify();
      logger.info({ email: normalized, requestId }, 'Forgot password requested for non-existent email (anti-enumeration)');
    }

    return {
      message: 'If an account exists with this email, password reset instructions have been sent.',
    };
  }

  /**
   * Reset password using token, revoking all active sessions.
   */
  public async resetPassword(input: ResetPasswordInput, requestId?: string) {
    const tokenHash = hashToken(input.token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn({ requestId }, 'Password reset failed: Invalid or expired token');
      const err = new Error('Password reset token is invalid or has expired.');
      (err as any).code = 'INVALID_OR_EXPIRED_TOKEN';
      (err as any).statusCode = 400;
      throw err;
    }

    const newPasswordHash = await hashPassword(input.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      // Revoke all sessions across all devices
      prisma.userSession.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    await enqueueTransactionalEmail({
      to: user.email,
      subject: 'Your Agree2Met password has been changed',
      html: `
        <h2>Security Notice</h2>
        <p>Your Agree2Met account password was recently changed. All active sessions have been revoked.</p>
        <p>If you did not perform this change, please contact support immediately.</p>
      `,
      text: 'Security Notice: Your Agree2Met account password was recently changed. All active sessions have been revoked.',
    });

    logger.info({ userId: user.id, requestId }, 'Password reset completed and all sessions revoked');

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Get all active sessions for a user.
   */
  public async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  /**
   * Revoke a specific session owned by the user.
   */
  public async revokeSession(userId: string, sessionId: string, requestId?: string) {
    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      const err = new Error('Session not found.');
      (err as any).code = 'SESSION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    logger.info({ userId, sessionId, requestId }, 'Session revoked by user');

    return {
      message: 'Session revoked successfully.',
    };
  }

  /**
   * Get current authenticated user profile and organizations.
   */
  public async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      const err = new Error('User not found.');
      (err as any).code = 'USER_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
        subscriptionTier: m.organization.subscriptionTier,
        isActive: m.organization.isActive,
      })),
    };
  }
}

export const authService = new AuthService();
