import path from 'path';
import { prisma } from '../config/db.js';
import { storageService } from './storage.service.js';
import { logger } from '../utils/logger.js';
import { hashPassword, verifyPassword } from '../utils/password.util.js';
import { UpdateProfileInput, ChangePasswordInput, DeleteAccountInput } from '../validators/user.validator.js';
import { enqueueTransactionalEmail } from '../queues/index.js';

export class UserService {
  /**
   * Get user profile with presigned avatar URL if available.
   */
  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      const err = new Error('User not found.');
      (err as any).code = 'USER_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    let presignedAvatarUrl: string | null = null;
    if (user.profile?.avatarUrl) {
      try {
        presignedAvatarUrl = await storageService.getPresignedUrl(user.profile.avatarUrl, 300);
      } catch (error) {
        logger.warn({ error, avatarUrl: user.profile.avatarUrl }, 'Failed to presign avatar URL');
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      profile: user.profile
        ? {
            ...user.profile,
            avatarUrl: presignedAvatarUrl || user.profile.avatarUrl,
          }
        : null,
    };
  }

  /**
   * Update personal profile information.
   */
  public async updateProfile(userId: string, input: UpdateProfileInput, requestId?: string) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {}),
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
        ...(input.themePreference !== undefined ? { themePreference: input.themePreference } : {}),
        ...(input.emailNotificationPreferences !== undefined
          ? { emailNotificationPreferences: input.emailNotificationPreferences as any }
          : {}),
      },
      create: {
        userId,
        firstName: input.firstName || 'User',
        lastName: input.lastName || '',
        displayName: input.displayName || `${input.firstName || 'User'} ${input.lastName || ''}`.trim(),
        phoneNumber: input.phoneNumber || null,
        jobTitle: input.jobTitle || null,
        themePreference: input.themePreference || 'system',
      },
    });

    logger.info({ userId, requestId }, 'User profile updated');
    return profile;
  }

  /**
   * Upload user avatar to private S3 bucket and return presigned URL.
   */
  public async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
    requestId?: string
  ) {
    if (!file) {
      const err = new Error('No image file provided.');
      (err as any).code = 'VALIDATION_ERROR';
      (err as any).statusCode = 400;
      throw err;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const err = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      (err as any).code = 'INVALID_FILE_TYPE';
      (err as any).statusCode = 400;
      throw err;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      const err = new Error('File size exceeds the 2MB limit.');
      (err as any).code = 'FILE_TOO_LARGE';
      (err as any).statusCode = 400;
      throw err;
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const storageKey = `avatars/${userId}-${Date.now()}${ext}`;

    await storageService.putObject(storageKey, file.buffer, file.mimetype);

    await prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: storageKey },
    });

    const presignedUrl = await storageService.getPresignedUrl(storageKey, 300);

    logger.info({ userId, storageKey, requestId }, 'User avatar uploaded and presigned');

    return {
      avatarUrl: presignedUrl,
      storageKey,
    };
  }

  /**
   * Change user password and revoke other sessions.
   */
  public async changePassword(
    userId: string,
    input: ChangePasswordInput,
    currentSessionId?: string,
    requestId?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      const err = new Error('User account not found.');
      (err as any).code = 'USER_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const isValidCurrent = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!isValidCurrent) {
      const err = new Error('Incorrect current password.');
      (err as any).code = 'INVALID_CURRENT_PASSWORD';
      (err as any).statusCode = 400;
      throw err;
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Revoke all OTHER sessions
      prisma.userSession.updateMany({
        where: {
          userId,
          id: currentSessionId ? { not: currentSessionId } : undefined,
          isRevoked: false,
        },
        data: { isRevoked: true },
      }),
    ]);

    logger.info({ userId, currentSessionId, requestId }, 'Password changed; other sessions revoked');

    return {
      message: 'Password updated successfully. Other active sessions have been signed out.',
    };
  }

  /**
   * Export all user profile, organization, and session data (GDPR portability).
   */
  public async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        memberships: {
          include: { organization: true },
        },
        sessions: {
          where: { isRevoked: false },
          select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            expiresAt: true,
          },
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
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      profile: user.profile,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      activeSessions: user.sessions,
    };
  }

  /**
   * Delete account with sole-owner check and cascading deletions.
   */
  public async deleteAccount(
    userId: string,
    input: DeleteAccountInput,
    requestId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { role: 'OWNER', isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      const err = new Error('User account not found.');
      (err as any).code = 'USER_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      const err = new Error('Incorrect password. Account deletion aborted.');
      (err as any).code = 'INVALID_PASSWORD';
      (err as any).statusCode = 400;
      throw err;
    }

    // Check if user is sole OWNER of any org that has other active members
    for (const membership of user.memberships) {
      const orgId = membership.organizationId;
      const otherMembersCount = await prisma.organizationMember.count({
        where: {
          organizationId: orgId,
          userId: { not: userId },
          isActive: true,
        },
      });

      if (otherMembersCount > 0) {
        // Check if there are other OWNERs in that org
        const otherOwnersCount = await prisma.organizationMember.count({
          where: {
            organizationId: orgId,
            userId: { not: userId },
            role: 'OWNER',
            isActive: true,
          },
        });

        if (otherOwnersCount === 0) {
          logger.warn(
            { userId, organizationId: orgId, otherMembersCount, requestId },
            'Account deletion blocked: User is sole owner of an organization with active members'
          );
          const err = new Error(
            `You are the sole Owner of "${membership.organization.name}" which has other active team members. Please transfer organization ownership before deleting your account.`
          );
          (err as any).code = 'SOLE_OWNER_CANNOT_DELETE';
          (err as any).statusCode = 400;
          throw err;
        }
      }
    }

    // Delete organizations where user was the sole member
    for (const membership of user.memberships) {
      const memberCount = await prisma.organizationMember.count({
        where: { organizationId: membership.organizationId },
      });
      if (memberCount <= 1) {
        await prisma.organization.delete({
          where: { id: membership.organizationId },
        });
      }
    }

    // Cascade deletes user record (which cascades userProfile, sessions, memberships)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Enqueue confirmation email
    await enqueueTransactionalEmail({
      to: user.email,
      subject: 'Agree2Met Account Deleted',
      html: `
        <h2>Account Deleted</h2>
        <p>Your Agree2Met account and associated personal data have been permanently removed.</p>
        <p>Thank you for using Agree2Met.</p>
      `,
      text: 'Your Agree2Met account and associated personal data have been permanently removed.',
    });

    logger.info({ userId, email: user.email, requestId }, 'Account deleted successfully');

    return {
      message: 'Account deleted successfully.',
    };
  }
}

export const userService = new UserService();
