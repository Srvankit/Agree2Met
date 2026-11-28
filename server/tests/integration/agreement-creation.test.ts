import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Phase 5 — Agreement Creation Engine Integration Tests', () => {
  let acmeCookies: { header: string; csrfToken: string };
  let globexCookies: { header: string; csrfToken: string };
  let acmeOrgId: string;
  let testAgreementId: string;
  let defaultCategoryId: string;

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
    // 1. Authenticate Acme Owner (alex@agree2met.com)
    const acmeLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex@agree2met.com', password: 'Demo@1234' });
    expect(acmeLoginRes.status).toBe(200);
    acmeCookies = extractCookies(acmeLoginRes);

    const acmeOrg = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } });
    acmeOrgId = acmeOrg!.id;

    // 2. Authenticate Globex Owner (hank@globex.com)
    const globexLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'hank@globex.com', password: 'Demo@1234' });
    expect(globexLoginRes.status).toBe(200);
    globexCookies = extractCookies(globexLoginRes);

    // Get an existing category
    const cat = await prisma.agreementCategory.findFirst({
      where: { slug: 'nda' },
    });
    defaultCategoryId = cat!.id;
  });

  async function cleanupAgreement(id: string) {
    if (!id) return;
    await prisma.auditEvent.deleteMany({ where: { agreementId: id } });
    await prisma.agreementVersion.deleteMany({ where: { agreementId: id } });
    await prisma.agreementClause.deleteMany({ where: { agreementId: id } });
    await prisma.agreementParty.deleteMany({ where: { agreementId: id } });
    await prisma.agreementPaymentTerm.deleteMany({ where: { agreementId: id } });
    await prisma.agreement.deleteMany({ where: { id } });
  }

  afterAll(async () => {
    // Clean up created test agreement if present
    if (testAgreementId) {
      await cleanupAgreement(testAgreementId);
    }
    const lingering = await prisma.agreement.findMany({
      where: { organizationId: acmeOrgId, referenceNumber: { startsWith: 'A2M-' } },
      select: { id: true },
    });
    for (const a of lingering) {
      await cleanupAgreement(a.id);
    }
  });

  describe('1. Agreement Creation (POST /api/v1/agreements)', () => {
    it('creates a new draft with sequential reference number, row_version=1, and v1 snapshot', async () => {
      const year = new Date().getFullYear();
      const payload = {
        title: 'Integration Test Master Services Agreement',
        description: 'Test MSA created during integration suite execution',
        categoryId: defaultCategoryId,
        signingOrder: 'PARALLEL',
        effectiveDate: '2026-12-01',
        expirationDate: '2027-12-01',
        parties: [
          {
            name: 'Alex Morgan',
            companyName: 'Acme Corporation',
            email: 'alex@agree2met.com',
            role: 'SIGNER',
            partyType: 'INTERNAL',
            signingSequence: 1,
          },
          {
            name: 'Clark Kent',
            companyName: 'Daily Planet Inc.',
            email: 'clark@dailyplanet.com',
            role: 'SIGNER',
            partyType: 'COUNTERPARTY',
            signingSequence: 2,
          },
        ],
        clauses: [
          {
            sectionNumber: '1.0',
            title: 'Scope of Services',
            content: '<p>The Provider agrees to deliver software engineering services.</p>',
            isMandatory: true,
            displayOrder: 1,
          },
          {
            sectionNumber: '2.0',
            title: 'Confidentiality',
            content: '<p>Standard strict non-disclosure obligations apply.</p>',
            isMandatory: true,
            displayOrder: 2,
          },
        ],
        paymentTerms: {
          totalAmount: 15000,
          currency: 'USD',
          paymentSchedule: 'MILESTONE',
          billingNotes: 'Net 30 terms upon milestone completion',
        },
      };

      const res = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      testAgreementId = res.body.data.id;

      expect(res.body.data.referenceNumber).toMatch(new RegExp(`^A2M-${year}-\\d{4}$`));
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.rowVersion).toBe(1);
      expect(res.body.data.parties).toHaveLength(2);
      expect(res.body.data.clauses).toHaveLength(2);
      expect(Number(res.body.data.paymentTerms.totalAmount)).toBe(15000);

      // Verify v1 snapshot was stored
      const versions = await prisma.agreementVersion.findMany({
        where: { agreementId: testAgreementId },
      });
      expect(versions).toHaveLength(1);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[0].contentHash).toHaveLength(64);

      // Verify audit event was created
      const auditEvents = await prisma.auditEvent.findMany({
        where: { agreementId: testAgreementId },
      });
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].eventType).toBe('AGREEMENT_CREATED');
      expect(auditEvents[0].seq).toBe(1);
    });

    it('sanitizes malicious script and event handler tags from clause contents', async () => {
      const payload = {
        title: 'XSS Test Agreement',
        categoryId: defaultCategoryId,
        clauses: [
          {
            sectionNumber: '1.0',
            title: 'Malicious Clause',
            content: '<p>Legitimate text</p><script>alert("hacked")</script><img src="x" onerror="steal()" />',
            displayOrder: 1,
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(payload);

      expect(res.status).toBe(201);
      const createdId = res.body.data.id;
      const clause = res.body.data.clauses[0];
      expect(clause.content).not.toContain('<script>');
      expect(clause.content).not.toContain('alert');
      expect(clause.content).not.toContain('onerror');
      expect(clause.content).toContain('<p>Legitimate text</p>');

      // Cleanup
      await cleanupAgreement(createdId);
    });

    it('rejects creation when expiration date is not after effective date', async () => {
      const payload = {
        title: 'Date Order Test Agreement',
        categoryId: defaultCategoryId,
        effectiveDate: '2026-12-01',
        expirationDate: '2026-11-01', // Before effective date
      };

      const res = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(payload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error.details)).toContain('Expiration date must be strictly after the effective date');
    });

    it('handles Idempotency-Key: replays on identical payload, rejects 422 on payload mismatch', async () => {
      const idempotencyKey = `test-key-${Date.now()}`;
      const payload = {
        title: 'Idempotent Draft Test',
        categoryId: defaultCategoryId,
      };

      // 1. First execution
      const res1 = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res1.status).toBe(201);
      const createdId = res1.body.data.id;
      expect(res1.headers['idempotent-replay']).toBeUndefined();

      // 2. Replay with identical payload -> 201 with Idempotent-Replay: true
      const res2 = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res2.status).toBe(201);
      expect(res2.headers['idempotent-replay']).toBe('true');
      expect(res2.body.data.id).toBe(createdId);

      // 3. Same idempotency key with DIFFERENT payload -> 422 Conflict
      const res3 = await request(app)
        .post('/api/v1/agreements')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Idempotency-Key', idempotencyKey)
        .send({ ...payload, title: 'Completely Different Title' });

      expect(res3.status).toBe(422);
      expect(res3.body.error.code).toBe('IDEMPOTENCY_CONFLICT');

      // Cleanup
      await prisma.idempotencyKey.deleteMany({ where: { key: idempotencyKey } });
      await cleanupAgreement(createdId);
    });
  });

  describe('2. Agreement Updates & Optimistic Locking (PUT /api/v1/agreements/:id)', () => {
    it('updates agreement successfully when expectedRowVersion matches', async () => {
      const updatePayload = {
        expectedRowVersion: 1,
        title: 'Updated Master Services Agreement',
        categoryId: defaultCategoryId,
        signingOrder: 'PARALLEL',
        clauses: [
          {
            sectionNumber: '1.0',
            title: 'Scope of Services Updated',
            content: '<p>Updated services scope with enhanced deliverables.</p>',
            displayOrder: 1,
          },
        ],
        changeSummary: 'Updated scope clause and title',
      };

      const res = await request(app)
        .put(`/api/v1/agreements/${testAgreementId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Master Services Agreement');
      expect(res.body.data.rowVersion).toBe(2);

      // Verify v2 snapshot was created
      const versions = await prisma.agreementVersion.findMany({
        where: { agreementId: testAgreementId },
        orderBy: { versionNumber: 'asc' },
      });
      expect(versions).toHaveLength(2);
      expect(versions[1].versionNumber).toBe(2);
      expect(versions[1].changeSummary).toBe('Updated scope clause and title');
    });

    it('returns 409 VERSION_CONFLICT when expectedRowVersion is stale', async () => {
      // Trying to update with rowVersion: 1 when the DB is now at rowVersion: 2
      const stalePayload = {
        expectedRowVersion: 1,
        title: 'Conflicting Title Update',
        categoryId: defaultCategoryId,
      };

      const res = await request(app)
        .put(`/api/v1/agreements/${testAgreementId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(stalePayload);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('VERSION_CONFLICT');
      expect(res.body.error.details[0].currentVersion).toBe(2);
    });
  });

  describe('3. Lightweight Autosave (PATCH /api/v1/agreements/:id/autosave)', () => {
    it('autosaves draft fields and increments rowVersion WITHOUT creating a version snapshot', async () => {
      const autosavePayload = {
        expectedRowVersion: 2,
        title: 'Autosaved In-Progress Title',
      };

      const res = await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/autosave`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(autosavePayload);

      expect(res.status).toBe(200);
      expect(res.body.data.rowVersion).toBe(3);

      // Verify version count remained 2 (autosave does NOT pollute version history)
      const versionCount = await prisma.agreementVersion.count({
        where: { agreementId: testAgreementId },
      });
      expect(versionCount).toBe(2);
    });

    it('returns 409 on version conflict during autosave', async () => {
      const res = await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/autosave`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ expectedRowVersion: 2, title: 'Stale Autosave' }); // current is 3

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('VERSION_CONFLICT');
    });
  });

  describe('4. Lifecycle State Machine Transitions (PATCH /api/v1/agreements/:id/status)', () => {
    it('rejects transition to PENDING_REVIEW if agreement is missing signers or clauses', async () => {
      // Create empty draft with no parties
      const emptyDraft = await prisma.agreement.create({
        data: {
          referenceNumber: `A2M-TEST-${Date.now()}`,
          organizationId: acmeOrgId,
          creatorId: (await prisma.user.findUnique({ where: { email: 'alex@agree2met.com' } }))!.id,
          categoryId: defaultCategoryId,
          title: 'Empty Draft',
          status: 'DRAFT',
          rowVersion: 1,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/agreements/${emptyDraft.id}/status`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ status: 'PENDING_REVIEW' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('AGREEMENT_NOT_FINALIZABLE');

      // Cleanup
      await prisma.agreement.delete({ where: { id: emptyDraft.id } });
    });

    it('successfully transitions DRAFT -> PENDING_REVIEW when legal criteria are met', async () => {
      // Add a signer party and clause to testAgreementId so it is finalizable
      await prisma.agreementParty.create({
        data: {
          agreementId: testAgreementId,
          name: 'Authorized Signer',
          email: 'signer@counterparty.com',
          role: 'SIGNER',
          partyType: 'COUNTERPARTY',
        },
      });

      const res = await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/status`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ status: 'PENDING_REVIEW' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PENDING_REVIEW');
      expect(res.body.data.rowVersion).toBe(4);

      // Verify status transition snapshot was recorded
      const versions = await prisma.agreementVersion.findMany({
        where: { agreementId: testAgreementId },
        orderBy: { versionNumber: 'desc' },
      });
      expect(versions[0].versionNumber).toBe(3);
      expect(versions[0].changeSummary).toContain('PENDING_REVIEW');
    });

    it('transitions PENDING_REVIEW back to DRAFT', async () => {
      const res = await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/status`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ status: 'DRAFT', reason: 'Reopened for edits' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('returns 409 TRANSITION_NOT_AVAILABLE_YET when attempting to send for signature (deferred to Phase 6)', async () => {
      // Transition to PENDING_REVIEW first so transition to SENT is blueprint-valid
      await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/status`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ status: 'PENDING_REVIEW' });

      const res = await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/status`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ status: 'SENT' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('TRANSITION_NOT_AVAILABLE_YET');
      expect(res.body.error.message).toContain('Phase 6');
    });

    it('transitions DRAFT -> CANCELLED with audit logging', async () => {
      const res = await request(app)
        .patch(`/api/v1/agreements/${testAgreementId}/status`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ status: 'CANCELLED', reason: 'Project abandoned by mutual agreement' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.cancellationReason).toBe('Project abandoned by mutual agreement');
      expect(res.body.data.cancelledAt).toBeDefined();
    });
  });

  describe('5. Agreement Duplication (POST /api/v1/agreements/:id/duplicate)', () => {
    it('creates a fresh DRAFT copy with new reference number and resets rowVersion', async () => {
      const res = await request(app)
        .post(`/api/v1/agreements/${testAgreementId}/duplicate`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(201);
      expect(res.body.data.id).not.toBe(testAgreementId);
      expect(res.body.data.title).toContain('Copy of');
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.rowVersion).toBe(1);
      expect(res.body.data.parties).toHaveLength(1); // Signer copied with reset status
      expect(res.body.data.clauses).toHaveLength(1);

      // Cleanup duplicated agreement
      await cleanupAgreement(res.body.data.id);
    });
  });

  describe('6. Archiving & Soft Delete', () => {
    it('archives CANCELLED agreement successfully (POST /archive)', async () => {
      const res = await request(app)
        .post(`/api/v1/agreements/${testAgreementId}/archive`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.data.isArchived).toBe(true);
      expect(res.body.data.archivedAt).toBeDefined();

      // Unarchive
      const unarchiveRes = await request(app)
        .post(`/api/v1/agreements/${testAgreementId}/unarchive`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(unarchiveRes.status).toBe(200);
      expect(unarchiveRes.body.data.isArchived).toBe(false);
    });

    it('soft-deletes a DRAFT agreement (DELETE /:id)', async () => {
      // Create temporary draft to delete
      const tempDraft = await prisma.agreement.create({
        data: {
          referenceNumber: `A2M-DEL-${Date.now()}`,
          organizationId: acmeOrgId,
          creatorId: (await prisma.user.findUnique({ where: { email: 'alex@agree2met.com' } }))!.id,
          categoryId: defaultCategoryId,
          title: 'Draft To Be Deleted',
          status: 'DRAFT',
          rowVersion: 1,
        },
      });

      const res = await request(app)
        .delete(`/api/v1/agreements/${tempDraft.id}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);

      // Check that it no longer appears in GET list
      const listRes = await request(app)
        .get(`/api/v1/agreements`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');
      const found = listRes.body.data.find((a: any) => a.id === tempDraft.id);
      expect(found).toBeUndefined();

      // Check in DB that deleted_at is set
      const dbRecord = await prisma.agreement.findUnique({ where: { id: tempDraft.id } });
      expect(dbRecord?.deletedAt).not.toBeNull();

      // Cleanup
      await prisma.agreement.delete({ where: { id: tempDraft.id } });
    });

    it('rejects soft deletion of non-draft agreement (returns 400)', async () => {
      // testAgreementId is currently CANCELLED
      const res = await request(app)
        .delete(`/api/v1/agreements/${testAgreementId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Use Archive instead');
    });
  });

  describe('7. Agreement Versions History (GET /:id/versions)', () => {
    it('lists all historical version snapshots with creator information', async () => {
      const res = await request(app)
        .get(`/api/v1/agreements/${testAgreementId}/versions`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3); // v1 create, v2 update, v3 status
      expect(res.body.data[0].versionNumber).toBeGreaterThan(res.body.data[1].versionNumber); // ordered desc
      expect(res.body.data[0].creator.email).toBe('alex@agree2met.com');
    });

    it('retrieves full snapshot content of version 1', async () => {
      const res = await request(app)
        .get(`/api/v1/agreements/${testAgreementId}/versions/1`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.data.versionNumber).toBe(1);
      expect(res.body.data.content.title).toBe('Integration Test Master Services Agreement');
      expect(res.body.data.content.parties).toHaveLength(2);
    });
  });

  describe('8. Agreement Categories & Template Clauses CRUD', () => {
    let customCatId: string;

    it('admin can create an organization-scoped category', async () => {
      const slug = `custom-cat-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          name: 'Custom Enterprise NDA',
          slug,
          description: 'Customized NDA for enterprise clients',
          iconName: 'Shield',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Custom Enterprise NDA');
      expect(res.body.data.isSystemDefault).toBe(false);
      customCatId = res.body.data.id;
    });

    it('can retrieve template clauses for system category', async () => {
      const res = await request(app)
        .get(`/api/v1/categories/${defaultCategoryId}/template-clauses`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].sectionNumber).toBe('1.0');
    });

    it('forbids modifying or deleting system default categories', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/categories/${defaultCategoryId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ name: 'Hacked Category' });

      expect(updateRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/v1/categories/${defaultCategoryId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(deleteRes.status).toBe(403);
    });

    it('deletes custom category when not in use', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${customCatId}`)
        .set('Cookie', acmeCookies.header)
        .set('X-CSRF-Token', acmeCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
    });
  });

  describe('9. Multi-Tenant Isolation for Agreement Writes', () => {
    it('forbids Globex user from modifying or viewing Acme agreement', async () => {
      // Globex user trying to update Acme agreement
      const res = await request(app)
        .put(`/api/v1/agreements/${testAgreementId}`)
        .set('Cookie', globexCookies.header)
        .set('X-CSRF-Token', globexCookies.csrfToken)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          expectedRowVersion: 1,
          title: 'Unauthorized Cross-Tenant Update',
        });

      expect(res.status).toBe(404); // Returns 404 to avoid leaking existence
    });
  });
});
