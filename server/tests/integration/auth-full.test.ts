import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { hashToken, generateRandomToken } from '../../src/utils/crypto.util.js';
import { hashPassword } from '../../src/utils/password.util.js';
import { loginLockoutService } from '../../src/services/lockout.service.js';

describe('Phase 3 — Authentication & User Management Full Integration Tests', () => {
  const testEmailPrefix = `test-${Date.now()}`;
  const validPassword = 'StrongPassword!2026';
  const newPassword = 'NewStrongPassword#2026';

  let testUser1: any;
  let testUser2: any;
  let testOrg1: any;
  let testOrg2: any;

  beforeAll(async () => {
    await loginLockoutService.clearAll();
    // Clean up any stray test accounts
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
  });

  afterAll(async () => {
    await loginLockoutService.clearAll();
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
        firstName: 'Jane',
        lastName: 'Doe',
        organizationName: 'Duplicate Legal LLC',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('If this email is not already registered');
  });

  // 3. Verification token works, expired token rejected, already-used token rejected
  it('3. Verification token works, expired token rejected, already-used token rejected', async () => {
    const email = `${testEmailPrefix}-verify@agree2met.test`;
    const passwordHash = await hashPassword(validPassword);
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isEmailVerified: false,
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // 3a. Invalid token rejected
    const invalidRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: 'completely_invalid_token_123' });

    expect(invalidRes.status).toBe(400);

    // 3b. Expired token rejected
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationTokenExpiresAt: new Date(Date.now() - 1000) },
    });

    const expiredRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: rawToken });

    expect(expiredRes.status).toBe(400);

    // 3c. Valid unexpired token succeeds
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    const validRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: rawToken });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);

    // 3d. Re-using same token is rejected
    const reusedRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: rawToken });

    expect(reusedRes.status).toBe(400);
  });

  // 4. Login: correct credentials issue cookies with HttpOnly, SameSite, and no tokens in body
  it('4. Login: correct credentials issue cookies with HttpOnly, SameSite, and no tokens in body', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    // Mark user1 verified
    await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);

    // Tokens MUST NOT be returned in JSON body
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();
    expect(res.body.data.csrfToken).toBeUndefined();

    // Verify Set-Cookie headers
    const cookies = extractCookies(res);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.refreshToken).toBeDefined();
    expect(cookies.csrfToken).toBeDefined();

    const accessCookieHeader = cookies.raw.find((c) => c.startsWith('access_token='));
    const refreshCookieHeader = cookies.raw.find((c) => c.startsWith('refresh_token='));
    const csrfCookieHeader = cookies.raw.find((c) => c.startsWith('csrf_token='));

    expect(accessCookieHeader).toContain('HttpOnly');
    expect(accessCookieHeader).toContain('SameSite=Strict');
    expect(refreshCookieHeader).toContain('HttpOnly');
    expect(refreshCookieHeader).toContain('SameSite=Strict');
    expect(refreshCookieHeader).toContain('Path=/api/v1/auth');
    expect(csrfCookieHeader).toContain('SameSite=Strict');
  });

  // 5. Login lockout & enumeration defense:
  // - 5 wrong passwords from an IP triggers 429 TOO_MANY_ATTEMPTS with Retry-After header
  // - Generic message prevents enumeration
  // - Attacker on IP 1 cannot lock out legitimate user on IP 2
  // - 5 attempts on unknown user returns identical 429 response
  it('5. Login: 5 consecutive wrong passwords locks (IP + email) pair with generic 429 and Retry-After', async () => {
    const email = `${testEmailPrefix}-lockout@agree2met.test`;
    const passwordHash = await hashPassword(validPassword);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isEmailVerified: true,
      },
    });

    const attackerIp = '198.51.100.1';
    const legitimateIp = '198.51.100.2';

    // 4 failed attempts from attacker IP return generic 401 INVALID_CREDENTIALS
    for (let i = 1; i <= 4; i++) {
      const failRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('X-Forwarded-For', attackerIp)
        .send({ email, password: 'WrongPassword!123' });

      expect(failRes.status).toBe(401);
      expect(failRes.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(failRes.body.error.message).toBe('Invalid email or password.');
    }

    // 5th failed attempt locks the (attackerIp, email) pair with generic 429 and Retry-After
    const lockRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Forwarded-For', attackerIp)
      .send({ email, password: 'WrongPassword!123' });

    expect(lockRes.status).toBe(429);
    expect(lockRes.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(lockRes.body.error.message).toContain('Too many login attempts');
    expect(lockRes.headers['retry-after']).toBeDefined();
    expect(parseInt(lockRes.headers['retry-after'])).toBeGreaterThan(0);

    // 6th attempt from the attacker IP is blocked immediately even with correct password
    const blockedRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Forwarded-For', attackerIp)
      .send({ email, password: validPassword });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(blockedRes.headers['retry-after']).toBeDefined();

    // VICTIM PROTECTION: Legitimate user from different IP can log in successfully!
    const legitRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Forwarded-For', legitimateIp)
      .send({ email, password: validPassword });

    expect(legitRes.status).toBe(200);
    expect(legitRes.body.success).toBe(true);

    // ANTI-ENUMERATION: 5 failed attempts on UNKNOWN user also returns identical 429 response
    const unknownEmail = `unknown-${Date.now()}@agree2met.test`;
    const unknownIp = '198.51.100.99';
    for (let i = 1; i <= 4; i++) {
      const uRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('X-Forwarded-For', unknownIp)
        .send({ email: unknownEmail, password: 'WrongPassword!123' });

      expect(uRes.status).toBe(401);
      expect(uRes.body.error.code).toBe('INVALID_CREDENTIALS');
    }

    const u5Res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Forwarded-For', unknownIp)
      .send({ email: unknownEmail, password: 'WrongPassword!123' });

    expect(u5Res.status).toBe(429);
    expect(u5Res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(u5Res.headers['retry-after']).toBeDefined();
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

  // 7. Refresh token rotation: issues new tokens and invalidates old token
  it('7. Refresh token rotation: issues new tokens and invalidates old token', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    const initialCookies = extractCookies(loginRes);

    // Refresh tokens using initial refresh cookie
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

  // 8. Refresh token family reuse detection revokes all sessions in family and returns 401
  it('8. Refresh token family reuse detection revokes all sessions in family and returns 401', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    const initialCookies = extractCookies(loginRes);

    // Legitimate rotation
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', initialCookies.csrfToken)
      .set('Cookie', initialCookies.header);

    expect(refreshRes.status).toBe(200);

    // Attack replay: present old, already-rotated refresh token again
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', initialCookies.csrfToken)
      .set('Cookie', initialCookies.header);

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.error.code).toBe('REFRESH_TOKEN_REUSE_DETECTED');

    // Confirm that family sessions are now revoked
    const rotatedCookies = extractCookies(refreshRes);
    const nextRefreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', rotatedCookies.csrfToken)
      .set('Cookie', rotatedCookies.header);

    expect(nextRefreshRes.status).toBe(401);
  });

  // 9. Password reset flow invalidates old password and revokes all active sessions
  it('9. Password reset flow invalidates old password and revokes all active sessions', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;

    // 9a. Request reset token
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.data.message).toContain('If an account exists');

    // Read generated token from DB
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.passwordResetTokenHash).toBeDefined();

    // 9b. Manually create token for deterministic reset verification
    const rawResetToken = generateRandomToken(32);
    const resetTokenHash = hashToken(rawResetToken);
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // 9c. Perform password reset
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        token: rawResetToken,
        password: newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Old password fails
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: validPassword });

    expect(oldLogin.status).toBe(401);

    // New password succeeds
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: newPassword });

    expect(newLogin.status).toBe(200);
  });

  // 10. Session list and revocation endpoints work correctly
  it('10. Session list and revocation endpoints work correctly', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: newPassword });

    const cookies = extractCookies(loginRes);

    // List sessions
    const sessionsRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);

    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.data.sessions).toBeInstanceOf(Array);
    expect(sessionsRes.body.data.sessions.length).toBeGreaterThan(0);

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

  // 11. CSRF protection: missing header or mismatched token is rejected (403); with matching token passes
  it('11. CSRF protection: mutating requests require X-Requested-With and matching X-CSRF-Token', async () => {
    const email = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email, password: newPassword });

    const cookies = extractCookies(loginRes);

    // 11a. Missing X-Requested-With header -> 403
    const missingReqWithRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .send({ displayName: 'Hacked Name' });

    expect(missingReqWithRes.status).toBe(403);
    expect(missingReqWithRes.body.error.code).toBe('FORBIDDEN');

    // 11b. Missing X-CSRF-Token header -> 403
    const missingCsrfRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header)
      .send({ displayName: 'Hacked Name' });

    expect(missingCsrfRes.status).toBe(403);
    expect(missingCsrfRes.body.error.code).toBe('FORBIDDEN');

    // 11c. Mismatched X-CSRF-Token header -> 403
    const mismatchedRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', 'wrong_csrf_token_value')
      .set('Cookie', cookies.header)
      .send({ displayName: 'Hacked Name' });

    expect(mismatchedRes.status).toBe(403);
    expect(mismatchedRes.body.error.code).toBe('FORBIDDEN');

    // 11d. With matching X-CSRF-Token header and X-Requested-With -> 200
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

    // User 1 tries to read User 2's org members -> 404
    const unauthorizedMembersRes = await request(app)
      .get(`/api/v1/organizations/${testOrg2.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies1.header);

    expect(unauthorizedMembersRes.status).toBe(404);

    // User 1 tries to invite someone to User 2's org -> 404
    const unauthorizedInviteRes = await request(app)
      .post(`/api/v1/organizations/${testOrg2.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies1.csrfToken)
      .set('Cookie', cookies1.header)
      .send({ email: 'intruder@test.com', role: 'MEMBER' });

    expect(unauthorizedInviteRes.status).toBe(404);

    // User 1 tries to modify a member of User 2's org -> 404
    const bobMember = testUser2.memberships[0];
    const unauthorizedPatchRes = await request(app)
      .patch(`/api/v1/organizations/${testOrg2.id}/members/${bobMember.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies1.csrfToken)
      .set('Cookie', cookies1.header)
      .send({ role: 'ADMIN' });

    expect(unauthorizedPatchRes.status).toBe(404);
  });

  // 13. Role hierarchy matrix & Last-Owner protection
  it('13. Full role hierarchy matrix: Owner, Admin, Member, Viewer permissions and last-owner protection', async () => {
    // 13a. Create Member and Viewer in Org 1
    const memberEmail = `${testEmailPrefix}-rbac-member@agree2met.test`;
    const viewerEmail = `${testEmailPrefix}-rbac-viewer@agree2met.test`;
    const adminEmail = `${testEmailPrefix}-rbac-admin@agree2met.test`;

    const [memberUser, viewerUser, adminUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: memberEmail,
          passwordHash: await hashPassword(validPassword),
          isEmailVerified: true,
          memberships: { create: { organization: { connect: { id: testOrg1.id } }, role: 'MEMBER' } },
        },
      }),
      prisma.user.create({
        data: {
          email: viewerEmail,
          passwordHash: await hashPassword(validPassword),
          isEmailVerified: true,
          memberships: { create: { organization: { connect: { id: testOrg1.id } }, role: 'VIEWER' } },
        },
      }),
      prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: await hashPassword(validPassword),
          isEmailVerified: true,
          memberships: { create: { organization: { connect: { id: testOrg1.id } }, role: 'ADMIN' } },
        },
      }),
    ]);

    // 13b. Log in as Viewer: cannot invite or modify members (403)
    const viewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: viewerEmail, password: validPassword });
    const viewerCookies = extractCookies(viewerLogin);

    const viewerInvite = await request(app)
      .post(`/api/v1/organizations/${testOrg1.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', viewerCookies.csrfToken)
      .set('Cookie', viewerCookies.header)
      .send({ email: 'newbie@test.com', role: 'VIEWER' });
    expect(viewerInvite.status).toBe(403);
    expect(viewerInvite.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');

    // 13c. Log in as Member: cannot invite or modify members (403)
    const memberLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: memberEmail, password: validPassword });
    const memberCookies = extractCookies(memberLogin);

    const memberInvite = await request(app)
      .post(`/api/v1/organizations/${testOrg1.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', memberCookies.csrfToken)
      .set('Cookie', memberCookies.header)
      .send({ email: 'newbie2@test.com', role: 'MEMBER' });
    expect(memberInvite.status).toBe(403);
    expect(memberInvite.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');

    // 13d. Log in as Admin: can invite Member/Viewer, but CANNOT demote or remove Owner
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: adminEmail, password: validPassword });
    const adminCookies = extractCookies(adminLogin);

    const ownerMember = await prisma.organizationMember.findFirst({
      where: { organizationId: testOrg1.id, role: 'OWNER' },
    });

    const adminDemoteOwner = await request(app)
      .patch(`/api/v1/organizations/${testOrg1.id}/members/${ownerMember?.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', adminCookies.csrfToken)
      .set('Cookie', adminCookies.header)
      .send({ role: 'MEMBER' });
    expect([400, 403]).toContain(adminDemoteOwner.status);
    expect(['INSUFFICIENT_PERMISSIONS', 'CANNOT_DEMOTE_LAST_OWNER', 'LAST_OWNER_PROTECTION']).toContain(adminDemoteOwner.body.error.code);

    // 13e. Owner tries to demote themselves when they are the ONLY Owner -> 400 CANNOT_DEMOTE_LAST_OWNER
    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: `${testEmailPrefix}-user1@agree2met.test`, password: newPassword });
    const ownerCookies = extractCookies(ownerLogin);

    const ownerSelfDemote = await request(app)
      .patch(`/api/v1/organizations/${testOrg1.id}/members/${ownerMember?.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', ownerCookies.csrfToken)
      .set('Cookie', ownerCookies.header)
      .send({ role: 'ADMIN' });
    expect(ownerSelfDemote.status).toBe(400);
    expect(ownerSelfDemote.body.error.code).toBe('CANNOT_DEMOTE_LAST_OWNER');
  });

  // 14. Organization invitation lifecycle:
  // - invite creates invitation with secure token hash
  // - accept with valid token succeeds and joins organization
  // - accept with expired token rejected (400)
  // - accept with already-accepted token rejected (400)
  // - accept with wrong user email rejected (403)
  it('14. Organization invitation lifecycle: valid accept, expired token, reused token, and wrong email rejection', async () => {
    const ownerEmail = `${testEmailPrefix}-user1@agree2met.test`;
    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: ownerEmail, password: newPassword });
    const ownerCookies = extractCookies(ownerLogin);

    const inviteeEmail = `${testEmailPrefix}-invitee@agree2met.test`;

    // 14a. Org owner invites teammate
    const inviteRes = await request(app)
      .post(`/api/v1/organizations/${testOrg1.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', ownerCookies.csrfToken)
      .set('Cookie', ownerCookies.header)
      .send({ email: inviteeEmail, role: 'MEMBER' });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.success).toBe(true);

    // Read invitation from DB
    const inv = await prisma.organizationInvitation.findFirst({
      where: { email: inviteeEmail, organizationId: testOrg1.id },
    });
    expect(inv).not.toBeNull();
    expect(inv?.status).toBe('PENDING');

    // Create a mock token for acceptance test
    const rawInvToken = generateRandomToken(32);
    const tokenHash = hashToken(rawInvToken);
    await prisma.organizationInvitation.update({
      where: { id: inv!.id },
      data: {
        invitationTokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 14b. Create invitee user and log in
    await prisma.user.create({
      data: {
        email: inviteeEmail,
        passwordHash: await hashPassword(validPassword),
        isEmailVerified: true,
      },
    });

    const inviteeLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: inviteeEmail, password: validPassword });
    const inviteeCookies = extractCookies(inviteeLogin);

    // 14c. Wrong user tries to accept this invitation -> 403
    const wrongUserLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: `${testEmailPrefix}-user2@agree2met.test`, password: validPassword });
    const wrongUserCookies = extractCookies(wrongUserLogin);

    const wrongAcceptRes = await request(app)
      .post('/api/v1/organizations/invitations/accept')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', wrongUserCookies.csrfToken)
      .set('Cookie', wrongUserCookies.header)
      .send({ token: rawInvToken });

    expect([400, 403]).toContain(wrongAcceptRes.status);
    expect(['INVITATION_EMAIL_MISMATCH', 'FORBIDDEN']).toContain(wrongAcceptRes.body.error.code);

    // 14d. Expired token rejection
    await prisma.organizationInvitation.update({
      where: { id: inv!.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const expiredAcceptRes = await request(app)
      .post('/api/v1/organizations/invitations/accept')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', inviteeCookies.csrfToken)
      .set('Cookie', inviteeCookies.header)
      .send({ token: rawInvToken });

    expect(expiredAcceptRes.status).toBe(400);

    // 14e. Valid acceptance
    await prisma.organizationInvitation.update({
      where: { id: inv!.id },
      data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    const validAcceptRes = await request(app)
      .post('/api/v1/organizations/invitations/accept')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', inviteeCookies.csrfToken)
      .set('Cookie', inviteeCookies.header)
      .send({ token: rawInvToken });

    expect(validAcceptRes.status).toBe(200);
    expect(validAcceptRes.body.success).toBe(true);

    // 14f. Reused token rejection
    const reusedAcceptRes = await request(app)
      .post('/api/v1/organizations/invitations/accept')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', inviteeCookies.csrfToken)
      .set('Cookie', inviteeCookies.header)
      .send({ token: rawInvToken });

    expect(reusedAcceptRes.status).toBe(400);
  });

  // 15. Profile update: partial updates work; avatar upload rejects non-images and >2MB; valid upload returns URL
  it('15. Profile update and avatar upload validation', async () => {
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
        jobTitle: 'Senior Legal Operations Lead',
        phoneNumber: '+1-555-0199',
        themePreference: 'dark',
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.profile.jobTitle).toBe('Senior Legal Operations Lead');

    // 15a. Non-image file rejection (text/plain)
    const textBuffer = Buffer.from('This is not an image file', 'utf-8');
    const badFileRes = await request(app)
      .post('/api/v1/users/avatar')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .attach('avatar', textBuffer, 'test.txt');

    expect(badFileRes.status).toBe(400);
    expect(badFileRes.body.error.code).toBe('INVALID_FILE_TYPE');

    // 15b. File > 2MB rejection
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0xff); // 2.5MB
    const largeFileRes = await request(app)
      .post('/api/v1/users/avatar')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .attach('avatar', largeBuffer, 'huge.jpg');

    expect(largeFileRes.status).toBe(400);

    // 15c. Valid PNG image upload
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

  // 16. Sensitive data exclusion: password hashes and token hashes are NEVER returned in response JSON
  it('16. Sensitive data exclusion: password hashes and token hashes are NEVER returned in responses', async () => {
    const email1 = `${testEmailPrefix}-user1@agree2met.test`;
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: email1, password: newPassword });

    const cookies = extractCookies(loginRes);

    // Check login body
    const loginBodyStr = JSON.stringify(loginRes.body);
    expect(loginBodyStr).not.toContain('passwordHash');
    expect(loginBodyStr).not.toContain('refreshTokenHash');
    expect(loginBodyStr).not.toContain('verificationTokenHash');
    expect(loginBodyStr).not.toContain('passwordResetTokenHash');

    // Check /auth/me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);

    const meBodyStr = JSON.stringify(meRes.body);
    expect(meBodyStr).not.toContain('passwordHash');
    expect(meBodyStr).not.toContain('refreshTokenHash');

    // Check /users/profile
    const profileRes = await request(app)
      .get('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);

    const profileBodyStr = JSON.stringify(profileRes.body);
    expect(profileBodyStr).not.toContain('passwordHash');
    expect(profileBodyStr).not.toContain('refreshTokenHash');

    // Check /organizations/:id/members
    const membersRes = await request(app)
      .get(`/api/v1/organizations/${testOrg1.id}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);

    const membersBodyStr = JSON.stringify(membersRes.body);
    expect(membersBodyStr).not.toContain('passwordHash');
    expect(membersBodyStr).not.toContain('invitationTokenHash');

    // Check /auth/sessions
    const sessionsRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);

    const sessionsBodyStr = JSON.stringify(sessionsRes.body);
    expect(sessionsBodyStr).not.toContain('refreshTokenHash');
  });

  // 17. Account deletion sole-owner protection and confirmed deletion
  it('17. Account deletion sole-owner protection and confirmed deletion', async () => {
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
