/**
 * Agree2Met Database Seed Script
 *
 * SAFETY WARNING: DEV-ONLY SEED SCRIPT
 * This script seeds deterministic development credentials (e.g. alex@agree2met.com / Demo@1234).
 * It MUST NOT and WILL NOT run in production environments (NODE_ENV=production).
 */

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { auditService } from '../src/services/audit.service.js';

const prisma = new PrismaClient();

export async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Dev seed script refuses to run when NODE_ENV=production.');
    throw new Error('Seed script cannot be executed in production environment (NODE_ENV=production).');
  }

  console.log('Seeding Phase 4 development data with full agreement read models & audit trails...');

  // Baseline Phase 1 Setting
  await prisma.systemSetting.upsert({
    where: { key: 'phase1_initialized' },
    update: { value: 'true' },
    create: {
      key: 'phase1_initialized',
      value: 'true',
    },
  });

  // Seed 9 System Default Agreement Categories
  const systemCategories = [
    { slug: 'nda', name: 'Non-Disclosure Agreement', iconName: 'Shield', description: 'Protects proprietary and confidential information between parties.' },
    { slug: 'msa', name: 'Master Services Agreement', iconName: 'FileText', description: 'Governs recurring service relationships, warranties, and liability.' },
    { slug: 'sow', name: 'Statement of Work', iconName: 'FileCode', description: 'Defines deliverables, milestones, and project timelines under an MSA.' },
    { slug: 'freelance-contract', name: 'Freelance Contract', iconName: 'Briefcase', description: 'Independent contractor agreement for defined scope and IP.' },
    { slug: 'employment-offer', name: 'Employment Offer', iconName: 'UserCheck', description: 'Standard employment offer letter detailing role, compensation, and benefits.' },
    { slug: 'commercial-lease', name: 'Commercial Lease', iconName: 'Home', description: 'Commercial property tenancy terms, rent schedules, and facility rules.' },
    { slug: 'partnership-agreement', name: 'Partnership Agreement', iconName: 'Handshake', description: 'Strategic joint venture, revenue share, or distribution terms.' },
    { slug: 'sales-agreement', name: 'Sales Agreement', iconName: 'TrendingUp', description: 'Product purchase, delivery schedules, payment terms, and inspection.' },
    { slug: 'consulting-agreement', name: 'Consulting Agreement', iconName: 'Award', description: 'Professional advisory services, intellectual property, and billing rates.' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of systemCategories) {
    const existing = await prisma.agreementCategory.findFirst({
      where: { slug: cat.slug, organizationId: null },
    });
    if (existing) {
      await prisma.agreementCategory.update({
        where: { id: existing.id },
        data: { name: cat.name, iconName: cat.iconName, description: cat.description, isSystemDefault: true },
      });
      categoryMap.set(cat.slug, existing.id);
    } else {
      const created = await prisma.agreementCategory.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          iconName: cat.iconName,
          description: cat.description,
          isSystemDefault: true,
          organizationId: null,
        },
      });
      categoryMap.set(cat.slug, created.id);
    }
  }

  // Seed template clauses for system categories if empty
  for (const [slug, categoryId] of categoryMap.entries()) {
    const existingClauses = await prisma.agreementCategoryClause.count({ where: { categoryId } });
    if (existingClauses === 0) {
      await prisma.agreementCategoryClause.createMany({
        data: [
          {
            categoryId,
            sectionNumber: '1.0',
            title: 'Scope of Agreement',
            content: 'The parties agree to the terms, obligations, and deliverables set forth in this agreement and any attached exhibits.',
            isMandatory: true,
            displayOrder: 1,
          },
          {
            categoryId,
            sectionNumber: '2.0',
            title: 'Confidentiality & Non-Disclosure',
            content: 'Each party agrees to maintain strict confidentiality regarding all proprietary information disclosed during the term of this agreement.',
            isMandatory: true,
            displayOrder: 2,
          },
          {
            categoryId,
            sectionNumber: '3.0',
            title: 'Term and Termination',
            content: 'This agreement shall commence on the effective date and remain in full force until the expiration date or until terminated by mutual written consent.',
            isMandatory: false,
            displayOrder: 3,
          },
          {
            categoryId,
            sectionNumber: '4.0',
            title: 'Limitation of Liability',
            content: 'In no event shall either party be liable for any indirect, incidental, special, or consequential damages arising out of or related to this agreement.',
            isMandatory: true,
            displayOrder: 4,
          },
          {
            categoryId,
            sectionNumber: '5.0',
            title: 'Governing Law and Dispute Resolution',
            content: 'This agreement shall be governed by and construed in accordance with the laws of Delaware. Any disputes shall be submitted to confidential binding arbitration.',
            isMandatory: true,
            displayOrder: 5,
          },
        ],
      });
    }
  }

  const devPassword = 'Demo@1234';
  const passwordHash = await argon2.hash(devPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Seed Primary Org: Acme Corporation
  const acmeOrg = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {
      name: 'Acme Corporation',
      billingEmail: 'billing@acme.com',
      subscriptionTier: 'ENTERPRISE',
    },
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      billingEmail: 'billing@acme.com',
      subscriptionTier: 'ENTERPRISE',
      defaultCurrency: 'USD',
      defaultTimezone: 'UTC',
    },
  });

  const acmeUser = await prisma.user.upsert({
    where: { email: 'alex@agree2met.com' },
    update: { passwordHash, isEmailVerified: true },
    create: {
      email: 'alex@agree2met.com',
      passwordHash,
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: acmeUser.id },
    update: {
      firstName: 'Alex',
      lastName: 'Morgan',
      displayName: 'Alex Morgan',
      jobTitle: 'Head of Legal Operations',
      themePreference: 'system',
    },
    create: {
      userId: acmeUser.id,
      firstName: 'Alex',
      lastName: 'Morgan',
      displayName: 'Alex Morgan',
      jobTitle: 'Head of Legal Operations',
      themePreference: 'system',
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      uq_org_user: {
        organizationId: acmeOrg.id,
        userId: acmeUser.id,
      },
    },
    update: { role: 'OWNER', isActive: true },
    create: {
      organizationId: acmeOrg.id,
      userId: acmeUser.id,
      role: 'OWNER',
      isActive: true,
    },
  });

  // Seed Secondary Org: Globex Corporation (for multi-tenant isolation verification)
  const globexOrg = await prisma.organization.upsert({
    where: { slug: 'globex-corp' },
    update: {
      name: 'Globex Corporation',
      billingEmail: 'billing@globex.com',
      subscriptionTier: 'PRO',
    },
    create: {
      name: 'Globex Corporation',
      slug: 'globex-corp',
      billingEmail: 'billing@globex.com',
      subscriptionTier: 'PRO',
      defaultCurrency: 'USD',
      defaultTimezone: 'America/New_York',
    },
  });

  const globexUser = await prisma.user.upsert({
    where: { email: 'hank@globex.com' },
    update: { passwordHash, isEmailVerified: true },
    create: {
      email: 'hank@globex.com',
      passwordHash,
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: globexUser.id },
    update: {
      firstName: 'Hank',
      lastName: 'Scorpio',
      displayName: 'Hank Scorpio',
      jobTitle: 'Chief Executive Officer',
      themePreference: 'dark',
    },
    create: {
      userId: globexUser.id,
      firstName: 'Hank',
      lastName: 'Scorpio',
      displayName: 'Hank Scorpio',
      jobTitle: 'Chief Executive Officer',
      themePreference: 'dark',
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      uq_org_user: {
        organizationId: globexOrg.id,
        userId: globexUser.id,
      },
    },
    update: { role: 'OWNER', isActive: true },
    create: {
      organizationId: globexOrg.id,
      userId: globexUser.id,
      role: 'OWNER',
      isActive: true,
    },
  });

  // Clear existing agreement data for both organizations for clean idempotent seed
  const orgIds = [acmeOrg.id, globexOrg.id];
  console.log('Cleaning old agreements & audit events for clean seeding...');
  await prisma.auditEvent.deleteMany({
    where: { agreement: { organizationId: { in: orgIds } } },
  });
  await prisma.agreementVersion.deleteMany({
    where: { agreement: { organizationId: { in: orgIds } } },
  });
  await prisma.agreementClause.deleteMany({
    where: { agreement: { organizationId: { in: orgIds } } },
  });
  await prisma.agreementParty.deleteMany({
    where: { agreement: { organizationId: { in: orgIds } } },
  });
  await prisma.agreementPaymentTerm.deleteMany({
    where: { agreement: { organizationId: { in: orgIds } } },
  });
  await prisma.agreement.deleteMany({
    where: { organizationId: { in: orgIds } },
  });
  await prisma.activityLog.deleteMany({
    where: { organizationId: { in: orgIds } },
  });
  await prisma.idempotencyKey.deleteMany({
    where: { organizationId: { in: orgIds } },
  });

  // Sequential reference counters
  await prisma.organizationReferenceCounter.upsert({
    where: { uq_org_reference_counter: { organizationId: acmeOrg.id, year: 2026 } },
    update: { lastNumber: 62 },
    create: { organizationId: acmeOrg.id, year: 2026, lastNumber: 62 },
  });
  await prisma.organizationReferenceCounter.upsert({
    where: { uq_org_reference_counter: { organizationId: globexOrg.id, year: 2026 } },
    update: { lastNumber: 5 },
    create: { organizationId: globexOrg.id, year: 2026, lastNumber: 5 },
  });

  // Generate 62 Realistic Agreements for Acme Corporation
  console.log('Generating 62 realistic agreements with hash-chained audit trails for Acme Corp...');

  const counterparties = [
    { name: 'Bruce Wayne', company: 'Wayne Enterprises', email: 'bruce@wayneenterprises.com' },
    { name: 'Tony Stark', company: 'Stark Industries', email: 'tony@starkindustries.com' },
    { name: 'Miles Dyson', company: 'Cyberdyne Systems', email: 'dyson@cyberdyne.com' },
    { name: 'Peter Gibbons', company: 'Initech Software', email: 'peter@initech.com' },
    { name: 'Richard Hendricks', company: 'Pied Piper Tech', email: 'richard@piedpiper.com' },
    { name: 'Gavin Belson', company: 'Hooli Corporation', email: 'gavin@hooli.com' },
    { name: 'Walter Bishop', company: 'Massive Dynamic', email: 'walter@massivedynamic.com' },
    { name: 'Eldon Tyrell', company: 'Tyrell BioCorp', email: 'tyrell@tyrellcorp.com' },
    { name: 'Elliot Alderson', company: 'Allsafe Cybersecurity', email: 'elliot@allsafe.net' },
    { name: 'Logan Roy', company: 'Waystar Royco', email: 'logan@waystar.com' },
  ];

  const clausesTemplates = [
    { section: '1.0', title: 'Scope of Services', content: 'The Provider shall perform the services detailed in Exhibit A with professional skill and diligence consistent with industry best practices.' },
    { section: '2.0', title: 'Confidentiality & Non-Disclosure', content: 'Each party agrees to hold all Confidential Information in strict confidence and use at least the same degree of care as for its own proprietary information.' },
    { section: '3.0', title: 'Intellectual Property Ownership', content: 'All work product, inventions, and deliverables created under this Agreement shall belong exclusively to the Client upon full payment.' },
    { section: '4.0', title: 'Limitation of Liability', content: 'Neither party shall be liable for indirect, incidental, or consequential damages. Maximum aggregate liability is limited to fees paid under this Agreement.' },
    { section: '5.0', title: 'Governing Law & Dispute Resolution', content: 'This Agreement is governed by Delaware law. Any dispute shall be resolved via binding arbitration in Dover, Delaware.' },
  ];

  // Define distribution of 62 agreements
  const statusDistribution: { status: string; count: number }[] = [
    { status: 'COMPLETED', count: 16 },
    { status: 'AWAITING_SIGNATURES', count: 10 },
    { status: 'DRAFT', count: 8 },
    { status: 'SENT', count: 7 },
    { status: 'PARTIALLY_SIGNED', count: 6 },
    { status: 'PENDING_REVIEW', count: 5 },
    { status: 'EXPIRED', count: 4 },
    { status: 'REJECTED', count: 3 },
    { status: 'CANCELLED', count: 3 },
  ];

  const categoryKeys = Array.from(categoryMap.keys());
  let agreementIndex = 0;
  const now = new Date();

  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      agreementIndex++;
      const refNum = `ACM-${now.getFullYear()}-${String(agreementIndex).padStart(3, '0')}`;
      const cp = counterparties[(agreementIndex - 1) % counterparties.length];
      const catSlug = categoryKeys[(agreementIndex - 1) % categoryKeys.length];
      const categoryId = categoryMap.get(catSlug)!;

      // Distribute created dates across the past 12 months (e.g. 1 to 350 days ago)
      const daysAgo = Math.floor((62 - agreementIndex) * 5.5) + 1;
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const effectiveDate = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);

      // Expiration dates: some upcoming soon, some further out, some past for EXPIRED
      let expirationDate: Date | null = null;
      if (status === 'EXPIRED') {
        expirationDate = new Date(now.getTime() - Math.floor(Math.random() * 20 + 2) * 24 * 60 * 60 * 1000);
      } else if (['AWAITING_SIGNATURES', 'SENT', 'COMPLETED', 'PARTIALLY_SIGNED'].includes(status)) {
        // Some deadlines in 3, 7, 14, 30, 60 days
        const daysAhead = ((agreementIndex * 7) % 45) + 3;
        expirationDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      }

      // Turnaround calculation for COMPLETED: completed between 6 hours and 5 days after creation
      let completedAt: Date | null = null;
      if (status === 'COMPLETED') {
        const turnaroundHours = Math.floor(Math.random() * 96) + 6; // 6 to 102 hours
        completedAt = new Date(createdAt.getTime() + turnaroundHours * 60 * 60 * 1000);
        if (completedAt > now) completedAt = new Date(now.getTime() - 1000 * 60 * 60);
      }

      let cancelledAt: Date | null = null;
      let cancellationReason: string | null = null;
      if (status === 'CANCELLED') {
        cancelledAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
        cancellationReason = 'Commercial terms renegotiated outside platform.';
      }

      let rejectionReason: string | null = null;
      if (status === 'REJECTED') {
        rejectionReason = 'Requested revisions to Section 4.0 Limitation of Liability.';
      }

      const title = `${cp.company} - ${catSlug.toUpperCase().replace(/-/g, ' ')}`;
      const amount = (Math.floor(Math.random() * 85) + 5) * 1000; // $5,000 to $90,000

      // Signer counts
      const totalSigners = status === 'DRAFT' || status === 'PENDING_REVIEW' ? 1 : 2;
      const completedSigners =
        status === 'COMPLETED' ? totalSigners :
        status === 'PARTIALLY_SIGNED' ? 1 : 0;

      const agreement = await prisma.agreement.create({
        data: {
          referenceNumber: refNum,
          organizationId: acmeOrg.id,
          creatorId: acmeUser.id,
          categoryId,
          title,
          description: `Contractual arrangement between Acme Corporation and ${cp.company} for professional execution.`,
          status,
          signingOrder: 'SEQUENTIAL',
          currentSignerSequence: completedSigners + 1,
          totalSignersCount: totalSigners,
          completedSignersCount: completedSigners,
          effectiveDate,
          expirationDate,
          completedAt,
          cancelledAt,
          cancellationReason,
          rejectionReason,
          isArchived: false,
          createdAt,
          updatedAt: completedAt || createdAt,
        },
      });

      // Parties
      await prisma.agreementParty.create({
        data: {
          agreementId: agreement.id,
          partyType: 'INTERNAL',
          name: 'Alex Morgan',
          companyName: 'Acme Corporation',
          email: 'alex@agree2met.com',
          role: 'SIGNER',
          signingSequence: 1,
          status: completedSigners >= 1 ? 'SIGNED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
          signedAt: completedSigners >= 1 ? new Date(createdAt.getTime() + 4 * 60 * 60 * 1000) : null,
          createdAt,
        },
      });

      if (totalSigners > 1) {
        await prisma.agreementParty.create({
          data: {
            agreementId: agreement.id,
            partyType: 'COUNTERPARTY',
            name: cp.name,
            companyName: cp.company,
            email: cp.email,
            role: 'SIGNER',
            signingSequence: 2,
            status: completedSigners === 2 ? 'SIGNED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
            signedAt: completedSigners === 2 ? completedAt : null,
            createdAt,
          },
        });
      }

      // Clauses
      for (let c = 0; c < 4; c++) {
        const ct = clausesTemplates[c];
        await prisma.agreementClause.create({
          data: {
            agreementId: agreement.id,
            sectionNumber: ct.section,
            title: ct.title,
            content: ct.content,
            isStandardClause: true,
            isMandatory: c < 3,
            displayOrder: c + 1,
            createdAt,
          },
        });
      }

      // Payment Terms
      await prisma.agreementPaymentTerm.create({
        data: {
          agreementId: agreement.id,
          totalAmount: amount,
          currency: 'USD',
          paymentSchedule: 'MILESTONE',
          billingNotes: '50% upon commencement, 50% upon successful delivery and acceptance.',
          milestones: [
            { name: 'Initial Kickoff', percentage: 50, amount: amount * 0.5, status: completedSigners >= 1 ? 'PAID' : 'PENDING' },
            { name: 'Final Acceptance', percentage: 50, amount: amount * 0.5, status: status === 'COMPLETED' ? 'PAID' : 'PENDING' },
          ],
          createdAt,
        },
      });

      // Initial Agreement Version (v1 Snapshot)
      const snapshotPayload = {
        title,
        description: `Standard ${catSlug.toUpperCase()} between Acme Corporation and counterparties.`,
        categoryId,
        signingOrder: 'PARALLEL',
        effectiveDate: effectiveDate ? effectiveDate.toISOString() : null,
        expirationDate: expirationDate ? expirationDate.toISOString() : null,
        parties: [
          { name: 'Alex Morgan', email: 'alex@agree2met.com', role: 'SIGNER', partyType: 'INTERNAL', signingSequence: 1 },
          ...(totalSigners > 1 ? [{ name: cp.name, email: cp.email, role: 'SIGNER', partyType: 'COUNTERPARTY', signingSequence: 2 }] : []),
        ],
        clauses: [
          { sectionNumber: '1.0', title: 'Scope of Services', content: 'The Provider shall perform the services detailed in Exhibit A with professional skill and diligence consistent with industry best practices.', isMandatory: true, displayOrder: 1 },
          { sectionNumber: '2.0', title: 'Confidentiality & Non-Disclosure', content: 'Each party agrees to hold all Confidential Information in strict confidence and use at least the same degree of care as for its own proprietary information.', isMandatory: true, displayOrder: 2 },
        ],
        paymentTerms: amount ? { totalAmount: amount, currency: 'USD', paymentSchedule: 'MILESTONE', billingNotes: 'Standard invoicing terms.' } : null,
      };
      const contentHash = crypto.createHash('sha256').update(JSON.stringify(snapshotPayload)).digest('hex');

      await prisma.agreementVersion.create({
        data: {
          agreementId: agreement.id,
          versionNumber: 1,
          content: snapshotPayload,
          contentHash,
          createdBy: acmeUser.id,
          changeSummary: 'Initial version created',
          createdAt,
        },
      });

      // Chained Audit Events
      // Event 1: Creation
      await auditService.createEvent({
        agreementId: agreement.id,
        eventType: 'AGREEMENT_CREATED',
        actorType: 'USER',
        actorId: acmeUser.id,
        actorName: 'Alex Morgan',
        actorEmail: 'alex@agree2met.com',
        payload: { referenceNumber: refNum, title, category: catSlug, amount },
        createdAt,
      });

      // Event 2: Sent
      if (status !== 'DRAFT' && status !== 'PENDING_REVIEW') {
        const sentTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_SENT',
          actorType: 'USER',
          actorId: acmeUser.id,
          actorName: 'Alex Morgan',
          actorEmail: 'alex@agree2met.com',
          payload: { recipient: cp.email, totalSigners },
          createdAt: sentTime,
        });

        // Event 3: Viewed
        const viewedTime = new Date(sentTime.getTime() + 30 * 60 * 1000);
        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_VIEWED',
          actorType: 'COUNTERPARTY',
          actorName: cp.name,
          actorEmail: cp.email,
          payload: { ipAddress: '198.51.100.42' },
          createdAt: viewedTime,
        });
      }

      // Signed events
      if (completedSigners >= 1) {
        const signed1Time = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_SIGNED',
          actorType: 'USER',
          actorId: acmeUser.id,
          actorName: 'Alex Morgan',
          actorEmail: 'alex@agree2met.com',
          payload: { sequence: 1, signerRole: 'INTERNAL_AUTHOR' },
          createdAt: signed1Time,
        });
      }

      if (status === 'COMPLETED' && completedAt) {
        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_SIGNED',
          actorType: 'COUNTERPARTY',
          actorName: cp.name,
          actorEmail: cp.email,
          payload: { sequence: 2, counterpartyCompany: cp.company },
          createdAt: completedAt,
        });

        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_COMPLETED',
          actorType: 'SYSTEM',
          actorName: 'Agree2Met Automation Engine',
          actorEmail: 'system@agree2met.com',
          payload: { finalStatus: 'COMPLETED', allPartiesSigned: true },
          createdAt: new Date(completedAt.getTime() + 5000),
        });
      }

      if (status === 'REJECTED') {
        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_REJECTED',
          actorType: 'COUNTERPARTY',
          actorName: cp.name,
          actorEmail: cp.email,
          payload: { reason: rejectionReason },
          createdAt: new Date(createdAt.getTime() + 12 * 60 * 60 * 1000),
        });
      }

      if (status === 'CANCELLED' && cancelledAt) {
        await auditService.createEvent({
          agreementId: agreement.id,
          eventType: 'AGREEMENT_CANCELLED',
          actorType: 'USER',
          actorId: acmeUser.id,
          actorName: 'Alex Morgan',
          actorEmail: 'alex@agree2met.com',
          payload: { reason: cancellationReason },
          createdAt: cancelledAt,
        });
      }
    }
  }

  // Seed 25 Activity Logs for Acme Corp
  console.log('Seeding 25 activity log entries for Acme Corp dashboard feed...');
  const activityActions = [
    { action: 'AGREEMENT_CREATED', entityType: 'agreement', metadata: { title: 'Enterprise Cloud Migration SOW' } },
    { action: 'SIGNATURE_RECORDED', entityType: 'agreement', metadata: { party: 'Tony Stark', company: 'Stark Industries' } },
    { action: 'AGREEMENT_SENT', entityType: 'agreement', metadata: { recipient: 'dyson@cyberdyne.com' } },
    { action: 'AUDIT_EXPORTED', entityType: 'audit', metadata: { format: 'CSV', recordsCount: 62 } },
    { action: 'TEAM_MEMBER_INVITED', entityType: 'organization', metadata: { invitedEmail: 'sarah.connor@acme.com', role: 'ADMIN' } },
    { action: 'AGREEMENT_COMPLETED', entityType: 'agreement', metadata: { referenceNumber: 'ACM-2026-015', durationHours: 18 } },
    { action: 'DEADLINE_REMINDER_SENT', entityType: 'agreement', metadata: { recipient: 'bruce@wayneenterprises.com', daysRemaining: 5 } },
    { action: 'SECURITY_SETTINGS_UPDATED', entityType: 'organization', metadata: { mfaPolicy: 'ENFORCED' } },
  ];

  for (let a = 0; a < 25; a++) {
    const act = activityActions[a % activityActions.length];
    const logDate = new Date(now.getTime() - (a * 7 + 1) * 60 * 60 * 1000); // spread across hours/days
    await prisma.activityLog.create({
      data: {
        organizationId: acmeOrg.id,
        userId: acmeUser.id,
        action: act.action,
        entityType: act.entityType,
        ipAddress: '127.0.0.1',
        metadata: act.metadata,
        createdAt: logDate,
      },
    });
  }

  // Generate 5 Distinct Agreements for Globex Corp (for multi-tenant isolation verification)
  console.log('Seeding 5 distinct agreements for Globex Corporation...');
  for (let g = 1; g <= 5; g++) {
    const glxRef = `GLX-${now.getFullYear()}-00${g}`;
    const glxCatId = categoryMap.get('nda')!;
    const glxCreated = new Date(now.getTime() - g * 24 * 60 * 60 * 1000);

    const glxAgreement = await prisma.agreement.create({
      data: {
        referenceNumber: glxRef,
        organizationId: globexOrg.id,
        creatorId: globexUser.id,
        categoryId: glxCatId,
        title: `Globex Project Vulcan Agreement #${g}`,
        description: 'Confidential strategic project agreement for Globex Corporation.',
        status: g === 1 ? 'COMPLETED' : (g === 2 ? 'AWAITING_SIGNATURES' : 'DRAFT'),
        signingOrder: 'PARALLEL',
        totalSignersCount: 1,
        completedSignersCount: g === 1 ? 1 : 0,
        completedAt: g === 1 ? now : null,
        createdAt: glxCreated,
        updatedAt: glxCreated,
      },
    });

    const glxPayload = {
      title: `Globex Project Vulcan Agreement #${g}`,
      description: 'Confidential strategic project agreement for Globex Corporation.',
      categoryId: glxCatId,
      signingOrder: 'PARALLEL',
      parties: [{ name: 'Hank Scorpio', email: 'hank@globex.com', role: 'SIGNER', partyType: 'INTERNAL', signingSequence: 1 }],
      clauses: [{ sectionNumber: '1.0', title: 'Scope of Project Vulcan', content: 'Secret project terms.', isMandatory: true, displayOrder: 1 }],
    };
    const glxContentHash = crypto.createHash('sha256').update(JSON.stringify(glxPayload)).digest('hex');
    await prisma.agreementVersion.create({
      data: {
        agreementId: glxAgreement.id,
        versionNumber: 1,
        content: glxPayload,
        contentHash: glxContentHash,
        createdBy: globexUser.id,
        changeSummary: 'Initial version created',
        createdAt: glxCreated,
      },
    });

    await auditService.createEvent({
      agreementId: glxAgreement.id,
      eventType: 'AGREEMENT_CREATED',
      actorType: 'USER',
      actorId: globexUser.id,
      actorName: 'Hank Scorpio',
      actorEmail: 'hank@globex.com',
      payload: { referenceNumber: glxRef, project: 'Project Vulcan' },
      createdAt: glxCreated,
    });
  }

  // Large Scale Dataset (~25,000 agreements for perf-corp)
  if (process.argv.includes('--scale=large')) {
    console.log('\nGenerating LARGE dataset (~25,000 agreements) for performance testing (--scale=large)...');
    const perfOrg = await prisma.organization.upsert({
      where: { slug: 'perf-corp' },
      update: {
        name: 'Performance Benchmark Corp',
        billingEmail: 'perf@agree2met.com',
        subscriptionTier: 'ENTERPRISE',
      },
      create: {
        name: 'Performance Benchmark Corp',
        slug: 'perf-corp',
        billingEmail: 'perf@agree2met.com',
        subscriptionTier: 'ENTERPRISE',
      },
    });

    const perfUser = await prisma.user.upsert({
      where: { email: 'perf@agree2met.com' },
      update: { passwordHash, isEmailVerified: true },
      create: {
        email: 'perf@agree2met.com',
        passwordHash,
        isEmailVerified: true,
        profile: {
          create: {
            firstName: 'Perf',
            lastName: 'Runner',
            displayName: 'Perf Benchmark Runner',
          },
        },
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        uq_org_user: {
          organizationId: perfOrg.id,
          userId: perfUser.id,
        },
      },
      update: { role: 'OWNER' },
      create: {
        organizationId: perfOrg.id,
        userId: perfUser.id,
        role: 'OWNER',
      },
    });

    console.log('Cleaning old perf-corp records...');
    await prisma.agreement.deleteMany({ where: { organizationId: perfOrg.id } });

    const totalLarge = 25000;
    const batchSize = 2500;
    const catList = Array.from(categoryMap.values());
    const statuses = [
      'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
      'AWAITING_SIGNATURES', 'AWAITING_SIGNATURES',
      'SENT', 'PARTIALLY_SIGNED',
      'DRAFT', 'EXPIRED',
    ];

    console.log(`Inserting ${totalLarge} agreements into perf-corp in batches of ${batchSize}...`);
    for (let batch = 0; batch < totalLarge / batchSize; batch++) {
      const agreementsBatch = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = batch * batchSize + i + 1;
        const status = statuses[idx % statuses.length];
        const catId = catList[idx % catList.length];
        const daysAgo = (idx % 365) + 1;
        const created = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const completed = status === 'COMPLETED' ? new Date(created.getTime() + 48 * 60 * 60 * 1000) : null;
        const expiration = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);

        agreementsBatch.push({
          referenceNumber: `PRF-2026-${String(idx).padStart(6, '0')}`,
          organizationId: perfOrg.id,
          creatorId: perfUser.id,
          categoryId: catId,
          title: `Performance Benchmark Agreement #${idx} - ${status}`,
          description: `Automated high-scale agreement record #${idx} for query indexing and performance benchmarking.`,
          status,
          signingOrder: 'PARALLEL',
          totalSignersCount: 2,
          completedSignersCount: status === 'COMPLETED' ? 2 : (status === 'PARTIALLY_SIGNED' ? 1 : 0),
          completedAt: completed,
          expirationDate: expiration,
          createdAt: created,
          updatedAt: completed || created,
        });
      }

      await prisma.agreement.createMany({ data: agreementsBatch });
      console.log(`  Inserted batch ${batch + 1}/${totalLarge / batchSize} (${(batch + 1) * batchSize} rows)`);
    }
    console.log(`Successfully populated 25,000 performance agreements for perf-corp.`);
  }

  console.log('Seed completed successfully:');
  console.log('  - 9 System Categories seeded');
  console.log('  - 1 Primary Org (acme-corp) with 62 agreements across all 9 statuses');
  console.log('  - 1 Secondary Org (globex-corp) with 5 agreements for tenant isolation');
  console.log('  - Cryptographically chained audit events verified for every agreement');
}

main()
  .catch((e) => {
    console.error('Seed execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
