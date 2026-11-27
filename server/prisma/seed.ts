/**
 * Agree2Met Database Seed Script
 *
 * SAFETY WARNING: DEV-ONLY SEED SCRIPT
 * This script seeds deterministic development credentials (e.g. alex@agree2met.com / Demo@1234).
 * It MUST NOT and WILL NOT run in production environments (NODE_ENV=production).
 */

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

export async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Dev seed script refuses to run when NODE_ENV=production.');
    throw new Error('Seed script cannot be executed in production environment (NODE_ENV=production).');
  }

  console.log('Seeding Phase 3 development user and organization...');

  // Baseline Phase 1 Setting
  await prisma.systemSetting.upsert({
    where: { key: 'phase1_initialized' },
    update: { value: 'true' },
    create: {
      key: 'phase1_initialized',
      value: 'true',
    },
  });

  const devEmail = 'alex@agree2met.com';
  const devPassword = 'Demo@1234';
  const passwordHash = await argon2.hash(devPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Seed or update dev organization
  const organization = await prisma.organization.upsert({
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

  // Seed or update dev user
  const user = await prisma.user.upsert({
    where: { email: devEmail },
    update: {
      passwordHash,
      isEmailVerified: true,
    },
    create: {
      email: devEmail,
      passwordHash,
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });

  // Seed user profile
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      firstName: 'Alex',
      lastName: 'Morgan',
      displayName: 'Alex Morgan',
      jobTitle: 'Head of Legal Operations',
      themePreference: 'system',
    },
    create: {
      userId: user.id,
      firstName: 'Alex',
      lastName: 'Morgan',
      displayName: 'Alex Morgan',
      jobTitle: 'Head of Legal Operations',
      themePreference: 'system',
    },
  });

  // Seed organization membership as OWNER
  await prisma.organizationMember.upsert({
    where: {
      uq_org_user: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {
      role: 'OWNER',
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log(`Phase 3 seed completed successfully.`);
  console.log(`Dev user created: ${devEmail} (Role: OWNER in ${organization.name})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
