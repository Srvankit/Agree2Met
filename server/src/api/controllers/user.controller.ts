import { Request, Response, NextFunction } from 'express';
import { userService } from '../../services/user.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { clearAuthCookies } from '../../utils/cookie.util.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../../validators/user.validator.js';

export class UserController {
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const data = await userService.getProfile(req.user.id);
      sendSuccess(res, data, 'User profile retrieved successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid profile data provided.',
          400,
          parsed.error.errors
        );
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const updated = await userService.updateProfile(req.user.id, parsed.data, requestId);
      sendSuccess(res, { profile: updated }, 'Profile updated successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 'VALIDATION_ERROR', 'No image file uploaded.', 400);
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await userService.uploadAvatar(req.user.id, file, requestId);
      sendSuccess(res, result, 'Avatar uploaded successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid password data provided.',
          400,
          parsed.error.errors
        );
        return;
      }

      const currentSessionId = req.session?.id;
      const requestId = req.headers['x-request-id'] as string;

      const result = await userService.changePassword(
        req.user.id,
        parsed.data,
        currentSessionId,
        requestId
      );

      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async exportUserData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const data = await userService.exportUserData(req.user.id);
      sendSuccess(res, data, 'User data exported successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = deleteAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Confirmation required. Please type DELETE and provide your password.',
          400,
          parsed.error.errors
        );
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await userService.deleteAccount(req.user.id, parsed.data, requestId);

      clearAuthCookies(res);
      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

export const userController = new UserController();
