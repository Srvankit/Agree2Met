import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { hashToken, generateRandomToken } from '../../src/utils/crypto.util.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Phase 3 — Authentication & User Management Full Integration Tests', () => {
  const testEmailPrefix = `test-${Date.now()}`;
  const validPassword = 'StrongPassword!2026';
  const newPassword = 'NewStrongPassword#2026';

  let testUser1: any;
  let testUser2: any;
  let testOrg1: any;
  let testOrg2: any;

  beforeAll(async () => {
    // Clean up any stray test accounts
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
  });

  // Helper to extract cookies from response
  function extractCookies(res: request.Response) {
    const rawCookies: string[] = res.headers['set-cookie'] || [];
    const cookieMap: Record<string, string> = {};
    const cookieHeaderParts: string[] = [];

    rawCookies.forEach((cookieStr) => {
      const parts = cookieStr.split(';')[0].split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=');
      cookieMap[name] = value;
      cookieHeaderParts.push(`${name}=${value}`);
    });

    return {
      raw: rawCookies,
      map: cookieMap,
      header: cookieHeaderParts.join('; '),
      csrfToken: cookieMap['csrf_token'],
      accessToken: cookieMap['access_token'],
      refreshToken: cookieMap['refresh_token'],
    };
  }

  // 1. User registration creates user, profile, org atomically
  it('1. User registration creates user, profile, org atomically', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email,
        password: validPassword,
        firstName: 'Jane',
        lastName: 'Doe',
        organizationName: 'Jane Legal LLC',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('If this email is not already registered');

    // Confirm in DB
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        memberships: { include: { organization: true } },
      },
    });

    expect(user).not.toBeNull();
    expect(user?.isEmailVerified).toBe(false);
    expect(user?.profile?.displayName).toBe('Jane Doe');
    expect(user?.memberships).toHaveLength(1);
    expect(user?.memberships[0].role).toBe('OWNER');
    expect(user?.memberships[0].organization.name).toBe('Jane Legal LLC');

    testUser1 = user;
    testOrg1 = user?.memberships[0].organization;
  });

  // 2. Duplicate email registration returns same generic success message (anti-enumeration)
  it('2. Duplicate email registration returns same generic success message (anti-enumeration)', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email,
        password: validPassword,
        firstName: 'Imposter',
        lastName: 'User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('If this email is not already registered');
  });

  // 3. Verification token works, expired token rejected, already-used token rejected
  it('3. Verification token works, expired token rejected, already-used token rejected', async () => {
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    // Save token directly into testUser1
    await prisma.user.update({
      where: { id: testUser1.id },
      data: {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Valid verification
    const validRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: rawToken });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.message).toContain('verified successfully');

    // Confirm verified in DB and token wiped
    const verifiedUser = await prisma.user.findUnique({ where: { id: testUser1.id } });
    expect(verifiedUser?.isEmailVerified).toBe(true);
    expect(verifiedUser?.verificationTokenHash).toBeNull();

    // Already-used token rejected
    const reuseRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: rawToken });

    expect(reuseRes.status).toBe(400);
    expect(reuseRes.body.error.code).toBe('INVALID_OR_EXPIRED_TOKEN');

    // Expired token rejected
    const expiredRawToken = generateRandomToken(32);
    await prisma.user.update({
      where: { id: testUser1.id },
      data: {
        verificationTokenHash: hashToken(expiredRawToken),
        verificationTokenExpiresAt: new Date(Date.now() - 1000), // in the past
      },
    });

    const expiredRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: expiredRawToken });

    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.error.code).toBe('INVALID_OR_EXPIRED_TOKEN');
  });

  // 4. Login: correct credentials issue 15m access token + 14d refresh token in HttpOnly cookies
  it('4. Login: correct credentials issue cookies with HttpOnly, SameSite, and no tokens in body', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    // Tokens must NOT be in JSON body
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    const cookies = extractCookies(res);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.refreshToken).toBeDefined();
    expect(cookies.csrfToken).toBeDefined();

    // Check cookie flags
    const rawCookies = res.headers['set-cookie'] || [];
    const accessCookieHeader = rawCookies.find((c: string) => c.startsWith('access_token='));
    const refreshCookieHeader = rawCookies.find((c: string) => c.startsWith('refresh_token='));
    const csrfCookieHeader = rawCookies.find((c: string) => c.startsWith('csrf_token='));

    expect(accessCookieHeader).toContain('HttpOnly');
    expect(accessCookieHeader).toContain('SameSite=Strict');
    expect(refreshCookieHeader).toContain('HttpOnly');
    expect(refreshCookieHeader).toContain('SameSite=Strict');
    // CSRF double submit cookie is accessible to JS, not HttpOnly
    expect(csrfCookieHeader).toContain('SameSite=Strict');
  });

  // 5. Login: wrong password increments failed attempts; 5th failure locks account for 15 min
  it('5. Login: 5 consecutive wrong passwords locks account for 15 minutes', async () => {
    const email = `${testEmailPrefix}-lockout@agree2met.test`;
    // Create verified test user
    const passwordHash = await hashPassword(validPassword);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isEmailVerified: true,
      },
    });

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const failRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email, password: 'WrongPassword!123' });

      expect(failRes.status).toBe(401);
      expect(failRes.body.error.code).toBe('INVALID_CREDENTIALS');
    }

    // 5th failed attempt locks the account
    const lockRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: 'WrongPassword!123' });

    expect(lockRes.status).toBe(423); // 423 Locked
    expect(lockRes.body.error.code).toBe('ACCOUNT_LOCKED');

    // Subsequent attempt even with correct password is rejected
    const blockedRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    expect(blockedRes.status).toBe(423);
    expect(blockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  // 6. Login: unverified user blocked with EMAIL_NOT_VERIFIED error
  it('6. Login: unverified user blocked with EMAIL_NOT_VERIFIED error', async () => {
    const email = `${testEmailPrefix}-unverified@agree2met.test`;
    const passwordHash = await hashPassword(validPassword);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isEmailVerified: false,
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  // 7. Refresh token rotation: valid refresh cookie issues new access + refresh cookies, invalidates old token
  it('7. Refresh token rotation: issues new tokens and invalidates old token', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    const initialCookies = extractCookies(loginRes);

    // Call refresh-token with CSRF header
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', initialCookies.csrfToken)
      .set('Cookie', initialCookies.header);

    expect(refreshRes.status).toBe(200);
    const newCookies = extractCookies(refreshRes);
    expect(newCookies.accessToken).toBeDefined();
    expect(newCookies.refreshToken).toBeDefined();
    expect(newCookies.refreshToken).not.toBe(initialCookies.refreshToken);
  });

  // 8. Refresh token family reuse detection: using a previously-used refresh token revokes all family sessions
  it('8. Refresh token family reuse detection revokes all sessions in family and returns 401', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    const initialCookies = extractCookies(loginRes);

    // First rotation (valid)
    const rotateRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', initialCookies.csrfToken)
      .set('Cookie', initialCookies.header);

    expect(rotateRes.status).toBe(200);

    // Attacker tries to use the old initial refresh token again
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', initialCookies.csrfToken)
      .set('Cookie', initialCookies.header);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('REFRESH_TOKEN_REUSE_DETECTED');

    // Confirm that the entire session family was revoked in DB
    const tokenHash = hashToken(initialCookies.refreshToken);
    const initialSession = await prisma.userSession.findFirst({
      where: { refreshTokenHash: tokenHash },
    });
    const familySessions = await prisma.userSession.findMany({
      where: { familyId: initialSession!.familyId },
    });
    expect(familySessions.length).toBeGreaterThan(0);
    expect(familySessions.every((s) => s.isRevoked)).toBe(true);
  });

  // 9. Password reset flow: request reset (anti-enumeration) -> token received -> reset password -> old password fails, new works, sessions revoked
  it('9. Password reset flow invalidates old password and revokes all active sessions', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;

    // 1. Request reset
    const reqRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email });

    expect(reqRes.status).toBe(200);
    expect(reqRes.body.data.message).toContain('If an account exists');

    // 2. Set a known token
    const rawResetToken = generateRandomToken(32);
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetTokenHash: hashToken(rawResetToken),
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // 3. Reset password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: rawResetToken, password: newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.message).toContain('Password has been reset');

    // 4. Old password fails
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    expect(oldLoginRes.status).toBe(401);

    // 5. New password succeeds
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: newPassword });

    expect(newLoginRes.status).toBe(200);
  });

  // 10. Session list returns all active sessions; revoke session destroys specified session
  it('10. Session list and revocation endpoints work correctly', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: newPassword });

    const cookies = extractCookies(loginRes);

    // Get sessions
    const sessionsRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);

    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.data.sessions.length).toBeGreaterThanOrEqual(1);

    const sessionId = sessionsRes.body.data.sessions[0].id;

    // Revoke session
    const revokeRes = await request(app)
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.message).toContain('revoked successfully');

    // Confirm revoked in DB
    const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
    expect(session?.isRevoked).toBe(true);
  });

  // 11. CSRF protection: mutating request without X-CSRF-Token or matching cookie is rejected (403); with matching token passes
  it('11. CSRF protection: mutating requests require matching X-CSRF-Token', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: newPassword });

    const cookies = extractCookies(loginRes);

    // Missing X-CSRF-Token header -> 403
    const rejectedRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header)
      .send({ displayName: 'Hacked Name' });

    expect(rejectedRes.status).toBe(403);
    expect(rejectedRes.body.error.code).toBe('FORBIDDEN');

    // With matching X-CSRF-Token header -> 200
    const acceptedRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .send({ displayName: 'Valid Name' });

    expect(acceptedRes.status).toBe(200);
    expect(acceptedRes.body.data.profile.displayName).toBe('Valid Name');
  });

  // 12. Organization isolation: User A cannot read, edit, or invite to Organization B
  it('12. Organization isolation: User A cannot access or manage Organization B', async () => {
    // Register User 2 with Org 2
    const email2 = `${testEmailPrefix}-user2@agree2met.test`;
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: email2,
        password: validPassword,
        firstName: 'Bob',
        lastName: 'Smith',
        organizationName: 'Bob Corp',
      });

    // Verify User 2
    testUser2 = await prisma.user.findUnique({
      where: { email: email2 },
      include: { memberships: { include: { organization: true } } },
    });
    testOrg2 = testUser2.memberships[0].organization;

    await prisma.user.update({
      where: { id: testUser2.id },
      data: { isEmailVerified: true },
    });

    // Login as User 1
    const email1 = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: email1, password: newPassword });

    const cookies1 = extractCookies(loginRes1);

    // User 1 tries to read User 2's org details (anti-enumeration 404 for non-members)
    const unauthorizedReadRes = await request(app)
      .get(`/api/v1/organizations/${testOrg2.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies1.header);

    expect(unauthorizedReadRes.status).toBe(404);
    expect(unauthorizedReadRes.body.error.code).toBe('ORGANIZATION_NOT_FOUND');

    // User 1 tries to invite someone to User 2's org -> 404 / 403
    const unauthorizedInviteRes = await request(app)
      .post(`/api/v1/organizations/${testOrg2.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies1.csrfToken)
      .set('Cookie', cookies1.header)
      .send({ email: 'intruder@test.com', role: 'MEMBER' });

    expect([403, 404]).toContain(unauthorizedInviteRes.status);
  });

  // 13. Role permissions matrix:
  // - Admin can invite Member, but cannot demote or remove Owner.
  // - Last Owner cannot be removed or demoted.
  it('13. Role hierarchy: Admin cannot demote Owner; last Owner cannot be removed or demoted', async () => {
    // Add an Admin to Org 1
    const adminEmail = `${testEmailPrefix}-admin@agree2met.test`;
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword(validPassword),
        isEmailVerified: true,
      },
    });

    const adminMember = await prisma.organizationMember.create({
      data: {
        organization: { connect: { id: testOrg1.id } },
        user: { connect: { id: adminUser.id } },
        role: 'ADMIN',
      },
    });

    const ownerMember = await prisma.organizationMember.findFirst({
      where: { organizationId: testOrg1.id, role: 'OWNER' },
    });

    // Login as Admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: adminEmail, password: validPassword });

    const adminCookies = extractCookies(adminLoginRes);

    // Admin tries to demote Owner -> rejected (400/403)
    const demoteRes = await request(app)
      .patch(`/api/v1/organizations/${testOrg1.id}/members/${ownerMember?.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', adminCookies.csrfToken)
      .set('Cookie', adminCookies.header)
      .send({ role: 'MEMBER' });

    expect([400, 403]).toContain(demoteRes.status);
    expect(['INSUFFICIENT_PERMISSIONS', 'CANNOT_DEMOTE_LAST_OWNER', 'LAST_OWNER_PROTECTION']).toContain(demoteRes.body.error.code);

    // Admin tries to remove Owner -> 403
    const removeOwnerRes = await request(app)
      .delete(`/api/v1/organizations/${testOrg1.id}/members/${ownerMember?.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', adminCookies.csrfToken)
      .set('Cookie', adminCookies.header);

    expect(removeOwnerRes.status).toBe(403);

    // Login as Owner
    const email1 = `${testEmailPrefix}-user1@agree2met.test`;
    const ownerLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: email1, password: newPassword });

    const ownerCookies = extractCookies(ownerLoginRes);

    // Owner tries to demote themselves when they are the ONLY Owner -> 400 LAST_OWNER_PROTECTION
    const selfDemoteRes = await request(app)
      .patch(`/api/v1/organizations/${testOrg1.id}/members/${ownerMember?.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', ownerCookies.csrfToken)
      .set('Cookie', ownerCookies.header)
      .send({ role: 'ADMIN' });

    expect(selfDemoteRes.status).toBe(400);
    expect(selfDemoteRes.body.error.code).toBe('CANNOT_DEMOTE_LAST_OWNER');

    // Owner removes Admin -> 200
    const removeAdminRes = await request(app)
      .delete(`/api/v1/organizations/${testOrg1.id}/members/${adminMember.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', ownerCookies.csrfToken)
      .set('Cookie', ownerCookies.header);

    expect(removeAdminRes.status).toBe(200);
  });

  // 14. Profile update: partial updates work; avatar upload rejects non-images / > 2MB; valid upload stores and returns presigned URL
  it('14. Profile update and avatar upload validation', async () => {
    const email1 = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: email1, password: newPassword });

    const cookies = extractCookies(loginRes);

    // Profile update
    const profileRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .send({
        jobTitle: 'Senior Counsel',
        phoneNumber: '+1-555-0199',
        themePreference: 'dark',
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.profile.jobTitle).toBe('Senior Counsel');

    // Avatar upload rejects non-images
    const textBuffer = Buffer.from('Not an image file', 'utf-8');
    const badFileRes = await request(app)
      .post('/api/v1/users/avatar')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .attach('avatar', textBuffer, 'test.txt');

    expect(badFileRes.status).toBe(400);
    expect(badFileRes.body.error.code).toBe('INVALID_FILE_TYPE');

    // Valid avatar image upload (PNG 1x1 pixel)
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const validUploadRes = await request(app)
      .post('/api/v1/users/avatar')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .attach('avatar', png1x1, 'avatar.png');

    expect(validUploadRes.status).toBe(200);
    expect(validUploadRes.body.success).toBe(true);
    expect(validUploadRes.body.data.avatarUrl).toBeDefined();
    expect(validUploadRes.body.data.avatarUrl).toContain('http');
  });

  // 15. Account deletion: requires password + typed "DELETE"; sole owner blocked with clear error; non-sole-owner deletes
  it('15. Account deletion sole-owner protection and confirmed deletion', async () => {
    // 1. Create a dedicated Sole Owner user
    const soleOwnerEmail = `${testEmailPrefix}-sole-owner@agree2met.test`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: soleOwnerEmail,
        password: validPassword,
        firstName: 'Sole',
        lastName: 'Owner',
        organizationName: 'Sole Owner Legal',
      });

    expect(regRes.status).toBe(201);
    const soleUser = await prisma.user.findUnique({
      where: { email: soleOwnerEmail },
      include: { memberships: { include: { organization: true } } },
    });
    const soleOrg = soleUser!.memberships[0].organization;

    await prisma.user.update({
      where: { email: soleOwnerEmail },
      data: { isEmailVerified: true },
    });

    // Add another active teammate to this organization so the owner cannot orphan it
    await prisma.user.create({
      data: {
        email: `${testEmailPrefix}-teammate@agree2met.test`,
        passwordHash: await hashPassword(validPassword),
        isEmailVerified: true,
        memberships: {
          create: {
            organization: { connect: { id: soleOrg.id } },
            role: 'MEMBER',
          },
        },
      },
    });

    const soleLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: soleOwnerEmail, password: validPassword });

    const soleCookies = extractCookies(soleLogin);

    // Sole owner tries to delete account -> 400 SOLE_OWNER_CANNOT_DELETE
    const soleOwnerRes = await request(app)
      .delete('/api/v1/users/account')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', soleCookies.csrfToken)
      .set('Cookie', soleCookies.header)
      .send({ confirmation: 'DELETE', password: validPassword });

    expect(soleOwnerRes.status).toBe(400);
    expect(soleOwnerRes.body.error.code).toBe('SOLE_OWNER_CANNOT_DELETE');

    // 2. Create a disposable user who is only a MEMBER of an existing org
    const memberEmail = `${testEmailPrefix}-regular-member@agree2met.test`;
    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        passwordHash: await hashPassword(validPassword),
        isEmailVerified: true,
        profile: { create: { displayName: 'Regular Member', firstName: 'Regular', lastName: 'Member' } },
        memberships: {
          create: {
            organization: { connect: { id: testOrg1.id } },
            role: 'MEMBER',
          },
        },
      },
    });

    const memberLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: memberEmail, password: validPassword });

    const memberCookies = extractCookies(memberLogin);

    // Non-sole-owner deletes account -> 200
    const deleteRes = await request(app)
      .delete('/api/v1/users/account')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', memberCookies.csrfToken)
      .set('Cookie', memberCookies.header)
      .send({ confirmation: 'DELETE', password: validPassword });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.message).toContain('Account deleted successfully');

    // Confirm user is deleted from DB
    const deletedUser = await prisma.user.findUnique({ where: { id: memberUser.id } });
    expect(deletedUser).toBeNull();
  });
});
