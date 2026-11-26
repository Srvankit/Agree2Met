import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import * as dbConfig from '../../src/config/db.js';

describe('GET /api/v1/health Integration', () => {
  it('returns 200 with all dependencies healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.version).toBe('1.0.0');
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
    expect(response.body.data.services).toEqual({
      database: true,
      redis: true,
      storage: true,
      smtp: true,
    });
  });

  it('returns 503 when a dependency check fails', async () => {
    const dbSpy = vi.spyOn(dbConfig, 'checkDatabaseHealth').mockResolvedValueOnce(false);

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.body.error.details[0].services.database).toBe(false);

    dbSpy.mockRestore();
  });
});
