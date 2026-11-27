import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './api.js';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends X-Requested-With header and includes credentials', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { status: 'healthy' } }),
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await apiClient.getHealth();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, config] = globalThis.fetch.mock.calls[0];

    expect(url).toContain('/health');
    expect(config.credentials).toBe('include');
    expect(config.headers['X-Requested-With']).toBe('XMLHttpRequest');
    expect(result.data.status).toBe('healthy');
  });

  it('throws ApiError with error details on HTTP failure', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Storage offline' },
      }),
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockErrorResponse);

    await expect(apiClient.getHealth()).rejects.toThrow('Storage offline');
    await expect(apiClient.getHealth()).rejects.toBeInstanceOf(ApiError);
  });
});
