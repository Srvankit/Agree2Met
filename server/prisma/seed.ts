import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding baseline Phase 1 configuration...');
  await prisma.systemSetting.upsert({
    where: { key: 'phase1_initialized' },
    update: { value: 'true' },
    create: {
      key: 'phase1_initialized',
      value: 'true',
    },
  });
  console.log('Phase 1 baseline seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
