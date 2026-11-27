import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from '../services/api';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = 'csrf_token=test-csrf-token; path=/';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('includes X-Requested-With and credentials include', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { status: 'healthy' } }),
    } as any);

    const res = await apiClient.get('/health');
    expect(res.data.status).toBe('healthy');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/health',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          'X-Requested-With': 'XMLHttpRequest',
        }),
      })
    );
  });

  it('includes X-CSRF-Token on mutating requests (POST, PUT, DELETE)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as any);

    await apiClient.post('/test', { hello: 'world' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': 'test-csrf-token',
        }),
      })
    );
  });

  it('performs single-flight token refresh on 401 and retries original request', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url) => {
      callCount++;
      if (url.toString().includes('/auth/refresh-token')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });
      }
      if (callCount === 1) {
        // First call fails with 401
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Token expired', code: 'UNAUTHORIZED' } }),
        });
      }
      // Retried call succeeds
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { user: 'recovered' } }),
      });
    });

    const res = await apiClient.get('/users/profile');
    expect(res.data.user).toBe('recovered');
    // Original request + refresh call + retried request = 3 calls
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('throws ApiError when 401 refresh fails', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes('/auth/refresh-token')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' } }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Token expired', code: 'UNAUTHORIZED' } }),
      });
    });

    await expect(apiClient.get('/users/profile')).rejects.toThrow(ApiError);
  });
});
