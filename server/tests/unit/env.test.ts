import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const testEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  STORAGE_PORT: z.coerce.number().default(9000),
});

describe('Environment Variable Validation', () => {
  it('successfully validates complete environment configuration', () => {
    const validConfig = {
      NODE_ENV: 'test',
      PORT: '5000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      STORAGE_PORT: '9000',
    };

    const parsed = testEnvSchema.parse(validConfig);
    expect(parsed.PORT).toBe(5000);
    expect(parsed.STORAGE_PORT).toBe(9000);
    expect(parsed.NODE_ENV).toBe('test');
  });

  it('fails fast when required DATABASE_URL is missing', () => {
    const invalidConfig = {
      REDIS_URL: 'redis://localhost:6379',
    };

    expect(() => testEnvSchema.parse(invalidConfig)).toThrowError(/DATABASE_URL/);
  });

  it('fails fast when required REDIS_URL is missing', () => {
    const invalidConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/db',
    };

    expect(() => testEnvSchema.parse(invalidConfig)).toThrowError(/REDIS_URL/);
  });
});
