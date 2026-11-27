import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error.js';
import { sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log all non-operational / unexpected errors with high severity
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, reqId: req.id, url: req.url }, 'Critical operational error');
    }
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      issue: e.message,
    }));
    sendError(res, 'VALIDATION_ERROR', 'Input validation failed.', 422, details);
    return;
  }

  // Handle Body parser / JSON syntax errors
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    sendError(res, 'MALFORMED_JSON', 'Malformed JSON payload in request body.', 400);
    return;
  }

  // Handle Multer upload limits (e.g. file size exceeded)
  if ((err as any).name === 'MulterError' || (err as any).code === 'LIMIT_FILE_SIZE') {
    sendError(res, 'FILE_TOO_LARGE', 'Uploaded file exceeds the maximum allowed size of 2MB.', 400);
    return;
  }

  // Unhandled / Generic server errors
  logger.error({ err, reqId: req.id, url: req.url }, 'Unhandled server exception');
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
    500,
  );
}
