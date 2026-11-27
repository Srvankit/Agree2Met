import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { sendError } from '../../utils/response.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests from this IP. Please try again later.',
      429,
    );
  },
  skip: (req) => {
    return env.NODE_ENV === 'test' || req.path === '/api/v1/health' || req.path === '/health';
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication requests. Please try again later.',
      429,
    );
  },
  skip: () => env.NODE_ENV === 'test',
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many login attempts. Please wait 15 minutes before trying again.',
      429,
    );
  },
  skip: () => env.NODE_ENV === 'test',
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password reset requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many password reset requests. Please try again in an hour.',
      429,
    );
  },
  skip: () => env.NODE_ENV === 'test',
});
