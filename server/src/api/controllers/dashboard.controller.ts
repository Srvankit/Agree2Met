import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../../services/dashboard.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import {
  dashboardActivityQuerySchema,
  dashboardDeadlinesQuerySchema,
  dashboardRecentQuerySchema,
} from '../../validators/dashboard.validator.js';

export class DashboardController {
  public async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.organization!.id;
      const stats = await dashboardService.getStats(orgId);
      sendSuccess(res, stats, 'Dashboard statistics retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = dashboardActivityQuerySchema.parse(req.query);
      const orgId = req.organization!.id;
      const result = await dashboardService.getActivity(orgId, parsed.page, parsed.limit);
      sendSuccess(res, result.data, 'Activity feed retrieved successfully.', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public async getDeadlines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = dashboardDeadlinesQuerySchema.parse(req.query);
      const orgId = req.organization!.id;
      const deadlines = await dashboardService.getDeadlines(orgId, parsed.days);
      sendSuccess(res, deadlines, 'Upcoming deadlines retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async getRecent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = dashboardRecentQuerySchema.parse(req.query);
      const orgId = req.organization!.id;
      const recent = await dashboardService.getRecent(orgId, parsed.limit);
      sendSuccess(res, recent, 'Recent agreements retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
