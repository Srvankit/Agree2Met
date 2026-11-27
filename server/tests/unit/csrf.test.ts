import { describe, it, expect, vi } from 'vitest';
import { csrfMiddleware } from '../../src/api/middlewares/csrf.middleware.js';
import { ForbiddenError } from '../../src/errors/app-error.js';

describe('CSRF Protection Middleware', () => {
  it('exempts safe HTTP GET, HEAD, OPTIONS methods', () => {
    const next = vi.fn();
    const req = { method: 'GET', path: '/api/v1/agreements', headers: {}, cookies: {} } as any;
    const res = {} as any;

    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('exempts public health endpoints', () => {
    const next = vi.fn();
    const req = { method: 'POST', path: '/api/v1/health', headers: {}, cookies: {} } as any;
    const res = {} as any;

    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects mutating POST request without custom header', () => {
    const next = vi.fn();
    const req = { method: 'POST', path: '/api/v1/agreements', headers: {}, cookies: {} } as any;
    const res = {} as any;

    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    const error = next.mock.calls[0][0];
    expect(error.message).toContain('Missing required X-Requested-With');
  });

  it('allows mutating POST request with X-Requested-With: XMLHttpRequest', () => {
    const next = vi.fn();
    const req = {
      method: 'POST',
      path: '/api/v1/agreements',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
      cookies: {},
    } as any;
    const res = {} as any;

    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects mutating request when CSRF cookie and header mismatch', () => {
    const next = vi.fn();
    const req = {
      method: 'PUT',
      path: '/api/v1/profile',
      headers: { 'x-csrf-token': 'token-a' },
      cookies: { 'X-CSRF-Token': 'token-b' },
    } as any;
    const res = {} as any;

    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    const error = next.mock.calls[0][0];
    expect(error.message).toContain('Token mismatch');
  });
});
