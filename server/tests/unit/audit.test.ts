import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/db.js';
import {
  auditService,
  canonicalStringify,
  computeEventHash,
  GENESIS_HASH,
} from '../../src/services/audit.service.js';

describe('Audit Service & Cryptographic Hash Chaining', () => {
  let testOrgId: string;
  let testUserId: string;
  let testCategoryId: string;
  let testAgreementId: string;

  beforeAll(async () => {
    // Clean up or prepare test prerequisites
    const org = await prisma.organization.upsert({
      where: { slug: 'audit-test-org' },
      update: {},
      create: {
        name: 'Audit Test Org',
        slug: 'audit-test-org',
        billingEmail: 'billing@audit-test.com',
      },
    });
    testOrgId = org.id;

    const user = await prisma.user.upsert({
      where: { email: 'audit-test@agree2met.com' },
      update: {},
      create: {
        email: 'audit-test@agree2met.com',
        passwordHash: 'dummy-hash',
        isEmailVerified: true,
      },
    });
    testUserId = user.id;

    const category = await prisma.agreementCategory.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Standard NDA',
        slug: 'standard-nda',
        isSystemDefault: true,
      },
    });
    testCategoryId = category.id;

    const agreement = await prisma.agreement.create({
      data: {
        referenceNumber: `AUDIT-TEST-${Date.now()}`,
        organizationId: testOrgId,
        creatorId: testUserId,
        categoryId: testCategoryId,
        title: 'Audit Test Agreement',
        status: 'DRAFT',
      },
    });
    testAgreementId = agreement.id;
  });

  afterAll(async () => {
    // Clean up test records
    await prisma.auditEvent.deleteMany({ where: { agreementId: testAgreementId } });
    await prisma.agreement.deleteMany({ where: { id: testAgreementId } });
    await prisma.organization.deleteMany({ where: { id: testOrgId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('produces deterministic canonical JSON regardless of key ordering', () => {
    const objA = { z: 1, a: 2, m: { nestedB: true, nestedA: 'hello' } };
    const objB = { a: 2, m: { nestedA: 'hello', nestedB: true }, z: 1 };

    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalStringify(objA)).toBe('{"a":2,"m":{"nestedA":"hello","nestedB":true},"z":1}');
  });

  it('correctly creates initial event with GENESIS_HASH and seq = 1', async () => {
    const event1 = await auditService.createEvent({
      agreementId: testAgreementId,
      eventType: 'AGREEMENT_CREATED',
      actorType: 'USER',
      actorId: testUserId,
      actorName: 'Audit Tester',
      actorEmail: 'audit-test@agree2met.com',
      payload: { title: 'Audit Test Agreement', initialStatus: 'DRAFT' },
    });

    expect(event1.seq).toBe(1);
    expect(event1.previousEventHash).toBe(GENESIS_HASH);
    expect(event1.eventHash).toHaveLength(64);

    const recomputed = computeEventHash({
      agreementId: testAgreementId,
      seq: event1.seq,
      createdAt: event1.createdAt.toISOString(),
      eventType: 'AGREEMENT_CREATED',
      actorType: 'USER',
      actorId: testUserId,
      actorEmail: 'audit-test@agree2met.com',
      payload: { title: 'Audit Test Agreement', initialStatus: 'DRAFT' },
      previousHash: GENESIS_HASH,
    });

    expect(event1.eventHash).toBe(recomputed);
  });

  it('chains second and third events sequentially with strict seq increments', async () => {
    const trailBefore = await auditService.getAuditTrail(testAgreementId);
    const prevHash = trailBefore.events[trailBefore.events.length - 1].eventHash;

    const event2 = await auditService.createEvent({
      agreementId: testAgreementId,
      eventType: 'AGREEMENT_SENT',
      actorType: 'USER',
      actorId: testUserId,
      actorName: 'Audit Tester',
      actorEmail: 'audit-test@agree2met.com',
      payload: { recipient: 'partner@example.com' },
    });

    expect(event2.seq).toBe(2);
    expect(event2.previousEventHash).toBe(prevHash);

    const event3 = await auditService.createEvent({
      agreementId: testAgreementId,
      eventType: 'AGREEMENT_VIEWED',
      actorType: 'COUNTERPARTY',
      actorName: 'Counterparty Rep',
      actorEmail: 'partner@example.com',
      payload: { ip: '1.2.3.4' },
    });

    expect(event3.seq).toBe(3);
    expect(event3.previousEventHash).toBe(event2.eventHash);

    const verification = await auditService.verifyChain(testAgreementId);
    expect(verification.isValid).toBe(true);
    expect(verification.eventCount).toBe(3);
  });

  it('detects sequence number discontinuity if seq is altered', async () => {
    const events = await prisma.auditEvent.findMany({
      where: { agreementId: testAgreementId },
      orderBy: { seq: 'asc' },
    });
    const targetEvent = events[2]; // third event (seq: 3)

    // Alter seq directly in database (e.g. gap: 1, 2, 5)
    await prisma.$executeRaw`UPDATE audit_events SET seq = 5 WHERE id = ${targetEvent.id}::uuid`;

    const verification = await auditService.verifyChain(testAgreementId);
    expect(verification.isValid).toBe(false);
    expect(verification.reason).toContain('Sequence discontinuity');

    // Restore seq
    await prisma.$executeRaw`UPDATE audit_events SET seq = 3 WHERE id = ${targetEvent.id}::uuid`;

    const restored = await auditService.verifyChain(testAgreementId);
    expect(restored.isValid).toBe(true);
  });

  it('detects tampering when an event payload is modified', async () => {
    const events = await prisma.auditEvent.findMany({
      where: { agreementId: testAgreementId },
      orderBy: { seq: 'asc' },
    });
    const targetEvent = events[1]; // second event

    // Tamper with payload directly in database
    await prisma.auditEvent.update({
      where: { id: targetEvent.id },
      data: { payload: { recipient: 'hacker@malicious.com' } },
    });

    const verification = await auditService.verifyChain(testAgreementId);
    expect(verification.isValid).toBe(false);
    expect(verification.tamperedEventId).toBe(targetEvent.id);
    expect(verification.reason).toContain('Payload or metadata hash mismatch');

    // Restore original payload
    await prisma.auditEvent.update({
      where: { id: targetEvent.id },
      data: { payload: targetEvent.payload as any },
    });

    const restoredVerification = await auditService.verifyChain(testAgreementId);
    expect(restoredVerification.isValid).toBe(true);
  });

  it('detects tampering when a previous_event_hash link is broken', async () => {
    const events = await prisma.auditEvent.findMany({
      where: { agreementId: testAgreementId },
      orderBy: { seq: 'asc' },
    });
    const targetEvent = events[2]; // third event
    const originalHash = targetEvent.previousEventHash;

    // Tamper with previousEventHash link
    await prisma.auditEvent.update({
      where: { id: targetEvent.id },
      data: { previousEventHash: 'a'.repeat(64) },
    });

    const verification = await auditService.verifyChain(testAgreementId);
    expect(verification.isValid).toBe(false);
    expect(verification.tamperedEventId).toBe(targetEvent.id);

    // Restore original previousEventHash
    await prisma.auditEvent.update({
      where: { id: targetEvent.id },
      data: { previousEventHash: originalHash },
    });

    const restored = await auditService.verifyChain(testAgreementId);
    expect(restored.isValid).toBe(true);
  });

  it('serializes concurrent event appends safely without chain forking or duplicate seq', async () => {
    // Append 5 events concurrently
    const concurrentPayloads = [
      'SIGNER_AUTHENTICATED',
      'CLAUSE_REVIEWED',
      'COMMENT_ADDED',
      'SIGNATURE_APPLIED',
      'CONFIRMATION_SENT',
    ];

    await Promise.all(
      concurrentPayloads.map((eventType, i) =>
        auditService.createEvent({
          agreementId: testAgreementId,
          eventType,
          actorType: 'USER',
          actorName: `Actor ${i}`,
          actorEmail: `actor${i}@example.com`,
          payload: { index: i },
        })
      )
    );

    const verification = await auditService.verifyChain(testAgreementId);
    expect(verification.isValid).toBe(true);
    expect(verification.eventCount).toBe(3 + concurrentPayloads.length); // 3 prior + 5 new = 8

    // Verify all sequence numbers are distinct and contiguous 1..8
    const allEvents = await prisma.auditEvent.findMany({
      where: { agreementId: testAgreementId },
      orderBy: { seq: 'asc' },
    });
    const seqs = allEvents.map((e) => e.seq);
    expect(seqs).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
