import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendError } from '../../src/utils/response.js';

describe('Response Envelope Utilities', () => {
  it('formats success response matching API_DOCUMENTATION.md contract', () => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const res = { status: mockStatus } as any;

    sendSuccess(res, { item: 'sample' }, 'Item retrieved.', 200, { page: 1, limit: 10, total: 1 });

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data: { item: 'sample' },
      message: 'Item retrieved.',
      meta: { page: 1, limit: 10, total: 1 },
    });
  });

  it('formats error response matching RFC error envelope contract', () => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const res = { status: mockStatus } as any;

    sendError(res, 'VALIDATION_ERROR', 'Input was invalid.', 422, [{ field: 'email', issue: 'Required' }]);

    expect(mockStatus).toHaveBeenCalledWith(422);
    const callArg = mockJson.mock.calls[0][0];

    expect(callArg.success).toBe(false);
    expect(callArg.error.code).toBe('VALIDATION_ERROR');
    expect(callArg.error.message).toBe('Input was invalid.');
    expect(callArg.error.details).toEqual([{ field: 'email', issue: 'Required' }]);
    expect(typeof callArg.timestamp).toBe('string');
  });
});
