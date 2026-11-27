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

  const requestedWith = req.headers['x-requested-with'];
  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies?.['csrf_token'] || req.cookies?.['X-CSRF-Token'];

  // Check 1: Double-submit validation for sessions with CSRF cookie
  if (csrfCookie) {
    if (!csrfHeader || typeof csrfHeader !== 'string') {
      return next(
        new ForbiddenError('CSRF protection failed: Missing required X-CSRF-Token header.'),
      );
    }
    if (csrfCookie !== csrfHeader) {
      return next(new ForbiddenError('CSRF protection failed: Token mismatch.'));
    }
  }

  // Check 2: Custom header requirement (anti-CSRF preflight trigger)
  const isXMLHttpRequest =
    typeof requestedWith === 'string' && requestedWith.toLowerCase() === 'xmlhttprequest';

  if (!isXMLHttpRequest) {
    return next(
      new ForbiddenError(
        'CSRF protection failed: Missing required X-Requested-With: XMLHttpRequest header.',
      ),
    );
  }

  next();
}
