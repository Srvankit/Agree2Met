import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { createEmailWorker } from '../../src/workers/email.worker.js';

describe('Phase 3 Manual Walkthrough Automation', () => {
  let worker: any;

  beforeAll(() => {
    worker = createEmailWorker();
  });

  afterAll(async () => {
    if (worker) await worker.close();
  });
  it('executes full 12-step end-to-end user lifecycle against live services', async () => {
    console.log('=== PHASE 3 END-TO-END WALKTHROUGH VERIFICATION ===\n');
    const timestamp = Date.now();
    const ownerEmail = `walkthrough-owner-${timestamp}@agree2met.test`;
    const initialPassword = 'InitialPassword!2026';
    const changedPassword = 'ChangedPassword!2026';
    const resetPassword = 'ResetPassword!2026';
    const teammateEmail = `walkthrough-mate-${timestamp}@agree2met.test`;

    function extractCookies(res: any) {
      const rawCookies: string[] = res.headers['set-cookie'] || [];
      const cookieMap: Record<string, string> = {};
      const cookieParts: string[] = [];

      rawCookies.forEach((c) => {
        const parts = c.split(';')[0].split('=');
        const name = parts[0].trim();
        const val = parts.slice(1).join('=');
        cookieMap[name] = val;
        cookieParts.push(`${name}=${val}`);
      });

      return {
        raw: rawCookies,
        map: cookieMap,
        header: cookieParts.join('; '),
        csrfToken: cookieMap['csrf_token'],
        accessToken: cookieMap['access_token'],
        refreshToken: cookieMap['refresh_token'],
      };
    }

    // 1. REGISTER
    console.log('Step 1: Registering owner account...');
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: ownerEmail,
        password: initialPassword,
        firstName: 'Taylor',
        lastName: 'Swift',
        organizationName: 'Swift Legal Group',
      });
    console.log(`  -> Register status: ${regRes.status} (expected 201), message: "${regRes.body.data.message}"`);
    expect(regRes.status).toBe(201);

    // 2. MAILPIT VERIFY
    console.log('Step 2: Checking Mailpit for verification email...');
    let verifyMsg: any = null;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const mailpitRes = await fetch('http://localhost:8025/api/v1/messages');
      const mailpitData = (await mailpitRes.json()) as any;
      const messages = mailpitData.messages || [];
      verifyMsg = messages.find((m: any) => m.To && m.To.some((to: any) => to.Address === ownerEmail));
      if (verifyMsg) break;
    }
    expect(verifyMsg).toBeDefined();

    const msgDetailRes = await fetch(`http://localhost:8025/api/v1/message/${verifyMsg.ID}`);
    const msgDetail = (await msgDetailRes.json()) as any;
    const emailText = msgDetail.Text || '';
    const tokenMatch = emailText.match(/token=([a-f0-9]+)/i);
    expect(tokenMatch).not.toBeNull();
    const verifyToken = tokenMatch![1];
    console.log(`  -> Found verification token in Mailpit: ${verifyToken.substring(0, 16)}...`);

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: verifyToken });
    console.log(`  -> Email verify status: ${verifyRes.status} (expected 200), message: "${verifyRes.body.message}"`);
    expect(verifyRes.status).toBe(200);

    // 3. LOGIN
    console.log('Step 3: Logging in with valid credentials...');
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: ownerEmail, password: initialPassword });
    console.log(`  -> Login status: ${loginRes.status} (expected 200)`);
    expect(loginRes.status).toBe(200);
    const cookies = extractCookies(loginRes);
    console.log(`  -> Cookies received: access_token=${Boolean(cookies.accessToken)}, refresh_token=${Boolean(cookies.refreshToken)}, csrf_token=${Boolean(cookies.csrfToken)}`);
    console.log(`  -> Tokens in body: ${loginRes.body.data.accessToken || 'NONE (Correct)'}`);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.csrfToken).toBeDefined();

    // 4. REFRESH PAGE / PERSIST SESSION
    console.log('Step 4: Hydrating session on page reload (GET /auth/me)...');
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookies.header);
    expect(meRes.status).toBe(200);
    const org = meRes.body.data.organizations?.[0];
    expect(org).toBeDefined();
    console.log(`  -> Session status: ${meRes.status} (expected 200), user: ${meRes.body.data.email}, role: ${org.role}`);
    const orgId = org.id;

    // 5. PROFILE + AVATAR
    console.log('Step 5: Updating profile and uploading avatar to S3...');
    const profileRes = await request(app)
      .put('/api/v1/users/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .send({
        displayName: 'Taylor Swift, Esq.',
        jobTitle: 'Managing Partner',
        timezone: 'America/New_York',
      });
    console.log(`  -> Profile update status: ${profileRes.status} (expected 200), displayName: "${profileRes.body.data.profile.displayName}"`);
    expect(profileRes.status).toBe(200);

    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const avatarRes = await request(app)
      .post('/api/v1/users/avatar')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .attach('avatar', png1x1, 'avatar.png');
    console.log(`  -> Avatar upload status: ${avatarRes.status} (expected 200), S3 URL: ${avatarRes.body.data.avatarUrl.substring(0, 45)}...`);
    expect(avatarRes.status).toBe(200);

    // 6. CHANGE PASSWORD
    console.log('Step 6: Changing password...');
    const pwdRes = await request(app)
      .put('/api/v1/users/password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', cookies.csrfToken)
      .set('Cookie', cookies.header)
      .send({
        currentPassword: initialPassword,
        newPassword: changedPassword,
      });
    console.log(`  -> Password change status: ${pwdRes.status} (expected 200), message: "${pwdRes.body.message}"`);
    expect(pwdRes.status).toBe(200);

    // 7. RESET PASSWORD VIA MAILPIT
    console.log('Step 7: Requesting password reset via Mailpit...');
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: ownerEmail });
    console.log(`  -> Forgot password status: ${forgotRes.status} (expected 200)`);
    expect(forgotRes.status).toBe(200);

    let resetMsg: any = null;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const mailpitResetRes = await fetch('http://localhost:8025/api/v1/messages');
      const mailpitReset = (await mailpitResetRes.json()) as any;
      resetMsg = mailpitReset.messages.find((m: any) =>
        m.To && m.To.some((to: any) => to.Address === ownerEmail) && m.Subject.toLowerCase().includes('password')
      );
      if (resetMsg) break;
    }
    expect(resetMsg).toBeDefined();

    const resetDetailRes = await fetch(`http://localhost:8025/api/v1/message/${resetMsg.ID}`);
    const resetDetail = (await resetDetailRes.json()) as any;
    const resetText = resetDetail.Text || '';
    const resetTokenMatch = resetText.match(/token=([a-f0-9]+)/i);
    expect(resetTokenMatch).not.toBeNull();
    const resetToken = resetTokenMatch![1];
    console.log(`  -> Found reset token in Mailpit: ${resetToken.substring(0, 16)}...`);

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ token: resetToken, password: resetPassword });
    console.log(`  -> Reset password status: ${resetRes.status} (expected 200), message: "${resetRes.body.message}"`);
    expect(resetRes.status).toBe(200);

    // Re-login with reset password
    console.log('  -> Logging in with newly reset password...');
    const reLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: ownerEmail, password: resetPassword });
    console.log(`  -> Re-login status: ${reLoginRes.status} (expected 200)`);
    expect(reLoginRes.status).toBe(200);
    const activeCookies = extractCookies(reLoginRes);

    // 8. INVITE TEAMMATE & ACCEPT IN SECOND PROFILE
    console.log('Step 8: Inviting teammate to organization...');
    const inviteRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', activeCookies.csrfToken)
      .set('Cookie', activeCookies.header)
      .send({ email: teammateEmail, role: 'MEMBER' });
    console.log(`  -> Teammate invite status: ${inviteRes.status} (expected 201)`);
    expect(inviteRes.status).toBe(201);

    let inviteMsg: any = null;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const mailpitInviteRes = await fetch('http://localhost:8025/api/v1/messages');
      const mailpitInvite = (await mailpitInviteRes.json()) as any;
      inviteMsg = mailpitInvite.messages.find((m: any) =>
        m.To && m.To.some((to: any) => to.Address === teammateEmail)
      );
      if (inviteMsg) break;
    }
    expect(inviteMsg).toBeDefined();

    const inviteDetailRes = await fetch(`http://localhost:8025/api/v1/message/${inviteMsg.ID}`);
    const inviteDetail = (await inviteDetailRes.json()) as any;
    const inviteTokenMatch = (inviteDetail.Text || '').match(/token=([a-f0-9]+)/i);
    expect(inviteTokenMatch).not.toBeNull();
    const inviteToken = inviteTokenMatch![1];
    console.log(`  -> Found teammate invitation token in Mailpit: ${inviteToken.substring(0, 16)}...`);

    // Register & verify teammate
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: teammateEmail,
        password: 'ValidTeammatePassword!2026',
        firstName: 'Chris',
        lastName: 'Martin',
        organizationName: 'Coldplay Legal',
      });
    await prisma.user.update({
      where: { email: teammateEmail },
      data: { isEmailVerified: true },
    });

    const mateLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: teammateEmail, password: 'ValidTeammatePassword!2026' });
    const mateCookies = extractCookies(mateLogin);

    // Accept invitation as teammate
    const acceptRes = await request(app)
      .post('/api/v1/organizations/invitations/accept')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', mateCookies.csrfToken)
      .set('Cookie', mateCookies.header)
      .send({ token: inviteToken });
    console.log(`  -> Teammate accept status: ${acceptRes.status} (expected 200), message: "${acceptRes.body.data.message}"`);
    expect(acceptRes.status).toBe(200);

    // 9. ROLE CHANGE
    console.log('Step 9: Owner changes teammate role to ADMIN...');
    const membersRes = await request(app)
      .get(`/api/v1/organizations/${orgId}/members`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', activeCookies.header);

    const mateMember = membersRes.body.data.members.find((m: any) => m.email === teammateEmail);
    expect(mateMember).toBeDefined();

    const rolePatchRes = await request(app)
      .patch(`/api/v1/organizations/${orgId}/members/${mateMember.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', activeCookies.csrfToken)
      .set('Cookie', activeCookies.header)
      .send({ role: 'ADMIN' });
    console.log(`  -> Role change status: ${rolePatchRes.status} (expected 200), new role: ${rolePatchRes.body.data.member.role}`);
    expect(rolePatchRes.status).toBe(200);

    // 10. REVOKE SESSION
    console.log('Step 10: Logging in on second device, listing and revoking that session...');
    const secondLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('User-Agent', 'Mobile Safari / iOS')
      .send({ email: ownerEmail, password: resetPassword });
    const secondCookies = extractCookies(secondLoginRes);

    const sessListRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', activeCookies.header);
    console.log(`  -> Active sessions count: ${sessListRes.body.data.sessions.length}`);
    expect(sessListRes.status).toBe(200);
    expect(sessListRes.body.data.sessions.length).toBeGreaterThanOrEqual(2);

    // Find the other session (not the current active one)
    const otherSession = sessListRes.body.data.sessions.find((s: any) => !s.isCurrentSession);
    expect(otherSession).toBeDefined();

    const revokeRes = await request(app)
      .delete(`/api/v1/auth/sessions/${otherSession.id}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', activeCookies.csrfToken)
      .set('Cookie', activeCookies.header);
    console.log(`  -> Session revoke status: ${revokeRes.status} (expected 200), message: "${revokeRes.body.data.message}"`);
    expect(revokeRes.status).toBe(200);

    // Verify revoked session is rejected
    const revokedCheck = await request(app)
      .get('/api/v1/auth/me')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', secondCookies.header);
    expect(revokedCheck.status).toBe(401);

    // 11. LOGOUT
    console.log('Step 11: Logging out...');
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-CSRF-Token', activeCookies.csrfToken)
      .set('Cookie', activeCookies.header);
    console.log(`  -> Logout status: ${logoutRes.status} (expected 200)`);
    expect(logoutRes.status).toBe(200);
    const clearedCookies = logoutRes.headers['set-cookie'] || [];
    const hasClearedAccess = clearedCookies.some((c: string) => c.includes('access_token=;') || c.includes('Max-Age=0'));
    console.log(`  -> Auth cookies cleared: ${hasClearedAccess}`);
    expect(hasClearedAccess).toBe(true);

    // 12. PROTECTED ROUTE REDIRECT / 401
    console.log('Step 12: Accessing protected route after logout...');
    const unauthRes = await request(app)
      .get('/api/v1/auth/me')
      .set('X-Requested-With', 'XMLHttpRequest');
    console.log(`  -> Unauthenticated /auth/me status: ${unauthRes.status} (expected 401)`);
    expect(unauthRes.status).toBe(401);

    // CLEANUP
    console.log('\nCleaning up walkthrough test accounts from DB...');
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, teammateEmail] } },
    });
    console.log('=== WALKTHROUGH COMPLETED SUCCESSFULLY (12/12 STEPS VERIFIED) ===');
  }, 35000);
});
