import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Exempt safe HTTP methods (GET, HEAD, OPTIONS)
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Exempt public diagnostic / health endpoint
  if (req.path === '/api/v1/health' || req.path === '/health') {
    return next();
  }

  // Primary defense: Require custom header X-Requested-With (or X-CSRF-Token)
  // Browsers will not send custom headers cross-origin without an explicit CORS preflight
  const requestedWith = req.headers['x-requested-with'];
  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies?.['X-CSRF-Token'];

  // Check 1: X-Requested-With validation
  const hasCustomHeader =
    (typeof requestedWith === 'string' && requestedWith.toLowerCase() === 'xmlhttprequest') ||
    Boolean(csrfHeader);

  if (!hasCustomHeader) {
    return next(
      new ForbiddenError(
        'CSRF protection failed: Missing required X-Requested-With or X-CSRF-Token header.',
      ),
    );
  }

  // Check 2: If double-submit CSRF cookie is present, it must match X-CSRF-Token
  if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
    return next(new ForbiddenError('CSRF protection failed: Token mismatch.'));
  }

  next();
}
