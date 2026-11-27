import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main as runSeed } from '../../prisma/seed.js';

describe('Seed Safety Environment Guard', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('refuses to run when NODE_ENV is production and throws an explicit error', async () => {
    process.env.NODE_ENV = 'production';

    await expect(runSeed()).rejects.toThrow(
      'Seed script cannot be executed in production environment (NODE_ENV=production).'
    );
  });
});
