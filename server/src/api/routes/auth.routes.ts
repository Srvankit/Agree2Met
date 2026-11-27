import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  authRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
} from '../middlewares/rate-limiter.middleware.js';

export const authRouter = Router();

// Public Authentication Flow
authRouter.post('/register', authRateLimiter, authController.register);
authRouter.post('/login', loginRateLimiter, authController.login);
authRouter.post('/refresh-token', authRateLimiter, authController.refreshToken);
authRouter.post('/verify-email', authRateLimiter, authController.verifyEmail);
authRouter.post('/resend-verification', authRateLimiter, authController.resendVerification);
authRouter.post('/forgot-password', passwordResetRateLimiter, authController.forgotPassword);
authRouter.post('/reset-password', passwordResetRateLimiter, authController.resetPassword);

// Authenticated Session & Identity Management
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
authRouter.get('/sessions', authenticate, authController.getSessions);
authRouter.delete('/sessions/:id', authenticate, authController.revokeSession);
