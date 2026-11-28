import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/db.js';
import { referenceNumberService } from '../../src/services/reference-number.service.js';

describe('Reference Number Service & Concurrent Counter Allocation', () => {
  let testOrgId: string;

  beforeAll(async () => {
    // Create temporary isolated test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Ref Counter Test Org',
        slug: `ref-test-${Date.now()}`,
        billingEmail: 'ref@test.com',
      },
    });
    testOrgId = org.id;
  });

  afterAll(async () => {
    if (testOrgId) {
      await prisma.organizationReferenceCounter.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.organization.delete({ where: { id: testOrgId } });
    }
  });

  it('generates sequential reference numbers in format A2M-YYYY-NNNN', async () => {
    const year = new Date().getFullYear();
    const ref1 = await referenceNumberService.getNextReferenceNumber(testOrgId);
    expect(ref1).toBe(`A2M-${year}-0001`);

    const ref2 = await referenceNumberService.getNextReferenceNumber(testOrgId);
    expect(ref2).toBe(`A2M-${year}-0002`);

    const ref3 = await referenceNumberService.getNextReferenceNumber(testOrgId);
    expect(ref3).toBe(`A2M-${year}-0003`);
  });

  it('safely serializes concurrent requests without duplicates or counter gaps', async () => {
    const year = new Date().getFullYear();
    const concurrentCount = 10;

    // Fire 10 simultaneous calls for next reference number
    const results = await Promise.all(
      Array.from({ length: concurrentCount }, () => referenceNumberService.getNextReferenceNumber(testOrgId))
    );

    // All must be formatted properly
    for (const ref of results) {
      expect(ref).toMatch(new RegExp(`^A2M-${year}-\\d{4}$`));
    }

    // Must be completely unique (no race duplicates)
    const uniqueRefs = new Set(results);
    expect(uniqueRefs.size).toBe(concurrentCount);

    // Counter must have advanced by exactly 10
    const counter = await prisma.organizationReferenceCounter.findUnique({
      where: { uq_org_reference_counter: { organizationId: testOrgId, year } },
    });
    expect(counter?.lastNumber).toBe(13); // 3 prior + 10 concurrent
  });
});
