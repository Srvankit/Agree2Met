import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as envModule from '../../src/config/env.js';

describe('Dev Routes Environment Protection', () => {
  const originalEnv = envModule.env.NODE_ENV;

  afterEach(() => {
    (envModule.env as any).NODE_ENV = originalEnv;
  });

  it('returns 404 when NODE_ENV is production', async () => {
    (envModule.env as any).NODE_ENV = 'production';
    const prodApp = createApp();

    const response = await request(prodApp)
      .post('/api/v1/dev/test-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ to: 'prod-test@example.com' });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('mounts and responds when NODE_ENV is development', async () => {
    (envModule.env as any).NODE_ENV = 'development';
    const devApp = createApp();

    const response = await request(devApp)
      .post('/api/v1/dev/test-email')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ to: 'dev-test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.queue).toBe('transactional-email-queue');
  });
});
