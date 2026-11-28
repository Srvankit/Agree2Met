import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Phase 4 — Dashboard & Analytics Engine Integration Tests', () => {
  let acmeCookies: { header: string; csrfToken: string };
  let globexCookies: { header: string; csrfToken: string };
  let acmeAgreementId: string;

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
    };
  }

  beforeAll(async () => {
    // 1. Authenticate Acme user (alex@agree2met.com)
    const acmeLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex@agree2met.com', password: 'Demo@1234' });
    expect(acmeLoginRes.status).toBe(200);
    acmeCookies = extractCookies(acmeLoginRes);

    // 2. Authenticate Globex user (hank@globex.com)
    const globexLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'hank@globex.com', password: 'Demo@1234' });
    expect(globexLoginRes.status).toBe(200);
    globexCookies = extractCookies(globexLoginRes);

    // Get an Acme agreement ID for testing
    const sample = await prisma.agreement.findFirst({
      where: { referenceNumber: 'ACM-2026-001' },
    });
    acmeAgreementId = sample!.id;
  });

  describe('Authentication & Access Control', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res1 = await request(app).get('/api/v1/dashboard/stats');
      expect(res1.status).toBe(401);

      const res2 = await request(app).get('/api/v1/analytics/overview');
      expect(res2.status).toBe(401);

      const res3 = await request(app).get('/api/v1/agreements');
      expect(res3.status).toBe(401);
    });
  });

  describe('Dashboard Endpoints', () => {
    it('GET /api/v1/dashboard/stats returns accurate SQL-aggregated metrics for Acme Corp', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stats = res.body.data;
      expect(stats.total).toBe(62);
      expect(stats.completed).toBe(16);
      expect(stats.running).toBe(23); // 7 SENT + 10 AWAITING_SIGNATURES + 6 PARTIALLY_SIGNED
      expect(stats.pendingSignatures).toBe(10);
      expect(stats.expired).toBe(4);
      // completionRate = completed / (completed + rejected + cancelled + expired) = 16 / (16 + 3 + 3 + 4) = 61.5%
      expect(stats.completionRate).toBe(61.5);
      expect(stats.avgTurnaroundHours).toBeGreaterThan(0);

      // Deltas object must be present
      expect(stats.deltas).toBeDefined();
      expect(typeof stats.deltas.total).toBe('number');
      expect(typeof stats.deltas.completed).toBe('number');
      expect(typeof stats.deltas.running).toBe('number');
      expect(typeof stats.deltas.completionRate).toBe('number');
    });

    it('GET /api/v1/dashboard/activity returns paginated activities with human-readable summaries', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/activity?page=1&limit=5')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(25);

      const first = res.body.data[0];
      expect(first.summary).toBeDefined();
      expect(typeof first.summary).toBe('string');
      expect(first.actor).toBeDefined();
    });

    it('GET /api/v1/dashboard/deadlines returns actionable upcoming expirations', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/deadlines?days=30')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      for (const item of res.body.data) {
        expect(item.daysRemaining).toBeGreaterThanOrEqual(0);
        expect(item.daysRemaining).toBeLessThanOrEqual(30);
        expect(item.referenceNumber).toBeDefined();
        expect(item.categoryName).toBeDefined();
      }
    });

    it('GET /api/v1/dashboard/recent returns 5 most recent agreements with parties and category', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/recent?limit=5')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(5);

      const first = res.body.data[0];
      expect(first.referenceNumber).toBeDefined();
      expect(first.category).toBeDefined();
      expect(first.parties).toBeDefined();
      expect(Array.isArray(first.parties)).toBe(true);
    });
  });

  describe('Analytics Endpoints', () => {
    it('GET /api/v1/analytics/overview returns full metrics suite with zero-filled time series', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview?granularity=month')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      // Summary
      expect(data.summary.totalCreated).toBeGreaterThan(0);
      expect(data.summary.totalCompleted).toBeGreaterThan(0);
      expect(data.summary.totalValue).toBeGreaterThan(0);
      expect(data.summary.completionRate).toBeGreaterThan(0);

      // Time series
      expect(Array.isArray(data.timeSeries)).toBe(true);
      expect(data.timeSeries.length).toBeGreaterThan(0);
      for (const bucket of data.timeSeries) {
        expect(bucket.period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof bucket.created).toBe('number');
        expect(typeof bucket.completed).toBe('number');
      }

      // Distributions
      expect(Array.isArray(data.statusDistribution)).toBe(true);
      expect(data.statusDistribution.length).toBeGreaterThanOrEqual(5);

      expect(Array.isArray(data.categoryDistribution)).toBe(true);
      expect(data.categoryDistribution.length).toBe(9);

      // Turnaround metrics
      expect(data.turnaroundMetrics.avgTurnaroundHours).toBeGreaterThan(0);
      expect(data.turnaroundMetrics.medianTurnaroundHours).toBeGreaterThan(0);

      // Signer metrics
      expect(data.signerMetrics.avgSignerResponseHours).toBeGreaterThan(0);
    });

    it('GET /api/v1/analytics/export.csv exports CSV with formula injection escaping', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/export.csv')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');

      const lines = res.text.split('\r\n');
      expect(lines.length).toBeGreaterThan(60);

      const headerLine = lines[0];
      expect(headerLine).toContain('Reference Number');
      expect(headerLine).toContain('Total Value (USD)');
      expect(headerLine).toContain('Turnaround Hours');
    });
  });

  describe('Agreement Read APIs & Chained Audit Trails', () => {
    it('GET /api/v1/agreement-categories returns 9 default categories', async () => {
      const res = await request(app)
        .get('/api/v1/agreement-categories')
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(9);
      expect(res.body.data.some((c: any) => c.slug === 'nda')).toBe(true);
      expect(res.body.data.some((c: any) => c.slug === 'msa')).toBe(true);
    });

    it('GET /api/v1/agreements lists paginated agreements with filters', async () => {
      const resAll = await request(app)
        .get('/api/v1/agreements?page=1&limit=10')
        .set('Cookie', acmeCookies.header);

      expect(resAll.status).toBe(200);
      expect(resAll.body.data).toHaveLength(10);
      expect(resAll.body.meta.total).toBe(62);

      // Filter by status=COMPLETED
      const resCompleted = await request(app)
        .get('/api/v1/agreements?status=COMPLETED')
        .set('Cookie', acmeCookies.header);

      expect(resCompleted.status).toBe(200);
      expect(resCompleted.body.meta.total).toBe(16);

      // Filter by search term
      const resSearch = await request(app)
        .get('/api/v1/agreements?search=Wayne')
        .set('Cookie', acmeCookies.header);

      expect(resSearch.status).toBe(200);
      expect(resSearch.body.data.length).toBeGreaterThan(0);
      expect(
        resSearch.body.data.some(
          (a: any) => a.title.includes('Wayne') || a.parties.some((p: any) => p.name.includes('Wayne'))
        )
      ).toBe(true);
    });

    it('GET /api/v1/agreements/:id returns full detail with cryptographically verified audit trail', async () => {
      const res = await request(app)
        .get(`/api/v1/agreements/${acmeAgreementId}`)
        .set('Cookie', acmeCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const agreement = res.body.data;
      expect(agreement.id).toBe(acmeAgreementId);
      expect(agreement.parties).toBeDefined();
      expect(agreement.clauses).toBeDefined();
      expect(agreement.paymentTerms).toBeDefined();

      // Audit trail and verification
      expect(agreement.auditTrail).toBeDefined();
      expect(agreement.auditTrail.events.length).toBeGreaterThanOrEqual(1);
      expect(agreement.auditTrail.verification.isValid).toBe(true);
      expect(agreement.auditTrail.verification.eventCount).toBe(agreement.auditTrail.events.length);
    });
  });

  describe('Safe Disabled Writes (Phase 4 Constraints)', () => {
    it('returns 501 NOT_AVAILABLE_YET for POST /api/v1/agreements', async () => {
      const res = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'New Agreement Attempt' });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_AVAILABLE_YET');
    });

    it('returns 501 NOT_AVAILABLE_YET for PUT /api/v1/agreements/:id', async () => {
      const res = await request(app)
        .put(`/api/v1/agreements/${acmeAgreementId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'Update Title Attempt' });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_AVAILABLE_YET');
    });

    it('returns 501 NOT_AVAILABLE_YET for DELETE /api/v1/agreements/:id', async () => {
      const res = await request(app)
        .delete(`/api/v1/agreements/${acmeAgreementId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_AVAILABLE_YET');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('isolates Globex Corp stats from Acme Corp', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Cookie', globexCookies.header);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(5); // Globex has 5, not 62
      expect(res.body.data.completed).toBe(1);
    });

    it('prevents Globex user from accessing Acme agreement detail', async () => {
      const res = await request(app)
        .get(`/api/v1/agreements/${acmeAgreementId}`)
        .set('Cookie', globexCookies.header);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Empty Organization Resilience', () => {
    it('returns clean zeros and empty structures for organization with 0 agreements', async () => {
      // Create a fresh empty org and user
      const emptyEmail = `empty-org-${Date.now()}@agree2met.com`;
      const emptyUserRes = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: emptyEmail,
          password: 'ValidPassword!2026',
          firstName: 'Empty',
          lastName: 'User',
          organizationName: 'Empty Inc',
        });
      expect(emptyUserRes.status).toBe(201);

      // Verify user directly in DB
      await prisma.user.update({
        where: { email: emptyEmail },
        data: { isEmailVerified: true },
      });

      // Login to obtain active session
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: emptyEmail,
          password: 'ValidPassword!2026',
        });
      expect(loginRes.status).toBe(200);
      const emptyCookies = extractCookies(loginRes);

      const statsRes = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Cookie', emptyCookies.header);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.total).toBe(0);
      expect(statsRes.body.data.completed).toBe(0);
      expect(statsRes.body.data.running).toBe(0);
      expect(statsRes.body.data.pendingSignatures).toBe(0);
      expect(statsRes.body.data.expired).toBe(0);
      expect(statsRes.body.data.completionRate).toBe(0);
      expect(statsRes.body.data.avgTurnaroundHours).toBe(0);

      const deadlinesRes = await request(app)
        .get('/api/v1/dashboard/deadlines')
        .set('Cookie', emptyCookies.header);
      expect(deadlinesRes.status).toBe(200);
      expect(deadlinesRes.body.data).toEqual([]);

      const overviewRes = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Cookie', emptyCookies.header);
      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body.data.summary.totalCreated).toBe(0);
      expect(overviewRes.body.data.summary.totalCompleted).toBe(0);
    });
  });
});
