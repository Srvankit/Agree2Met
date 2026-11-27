import { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { setAuthCookies, clearAuthCookies } from '../../utils/cookie.util.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/auth.validator.js';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid registration data provided.',
          400,
          parsed.error.errors
        );
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await authService.register(parsed.data, requestId);
      sendSuccess(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Email and password are required.',
          400,
          parsed.error.errors
        );
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const requestId = req.headers['x-request-id'] as string;

      const result = await authService.login(parsed.data, userAgent, ipAddress, requestId);

      setAuthCookies(res, result.accessToken, result.refreshToken, result.csrfToken);

      sendSuccess(res, { user: result.user }, 'Login successful.');
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.['refresh_token'];
      if (!rawRefreshToken) {
        sendError(res, 'UNAUTHORIZED', 'No refresh token provided in cookies.', 401);
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const requestId = req.headers['x-request-id'] as string;

      const result = await authService.refreshToken(rawRefreshToken, userAgent, ipAddress, requestId);

      setAuthCookies(res, result.accessToken, result.refreshToken, result.csrfToken);

      sendSuccess(res, { message: 'Tokens refreshed successfully.' }, 'Tokens refreshed successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        if (error.code === 'REFRESH_TOKEN_REUSE_DETECTED') {
          clearAuthCookies(res);
        }
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string;
      if (req.user && req.session) {
        await authService.logout(req.user.id, req.session.id, requestId);
      }
      clearAuthCookies(res);
      sendSuccess(res, { message: 'Logged out successfully.' }, 'Logged out successfully.');
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = verifyEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'VALIDATION_ERROR', 'Verification token is required.', 400);
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await authService.verifyEmail(parsed.data.token, requestId);
      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = resendVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'VALIDATION_ERROR', 'A valid email address is required.', 400);
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await authService.resendVerification(parsed.data.email, requestId);
      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'VALIDATION_ERROR', 'A valid email address is required.', 400);
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await authService.forgotPassword(parsed.data.email, requestId);
      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Valid token and new password are required.',
          400,
          parsed.error.errors
        );
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await authService.resetPassword(parsed.data, requestId);
      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const data = await authService.getMe(req.user.id);
      sendSuccess(res, data, 'User profile retrieved successfully.');
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.session) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const sessions = await authService.getSessions(req.user.id, req.session.id);
      sendSuccess(res, { sessions }, 'Active sessions retrieved successfully.');
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const sessionId = req.params.id;
      const requestId = req.headers['x-request-id'] as string;
      const result = await authService.revokeSession(req.user.id, sessionId, requestId);
      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.retryAfter) {
        res.setHeader('Retry-After', String(error.retryAfter));
      }
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

export const authController = new AuthController();
