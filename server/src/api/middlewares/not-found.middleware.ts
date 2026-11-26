import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response.js';

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  sendError(res, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`, 404);
}
