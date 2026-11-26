import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { sendError } from '../../utils/response.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests from this IP. Please try again later.',
      429,
    );
  },
  skip: (req) => {
    // Skip rate limiting in test environment or for health checks
    return env.NODE_ENV === 'test' || req.path === '/api/v1/health' || req.path === '/health';
  },
});
