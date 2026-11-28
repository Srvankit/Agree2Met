import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../../services/analytics.service.js';
import { sendSuccess } from '../../utils/response.js';
import {
  analyticsOverviewQuerySchema,
  analyticsExportQuerySchema,
} from '../../validators/analytics.validator.js';

export class AnalyticsController {
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = analyticsOverviewQuerySchema.parse(req.query);
      const orgId = req.organization!.id;
      const data = await analyticsService.getOverview(orgId, query);
      sendSuccess(res, data, 'Analytics overview retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = analyticsExportQuerySchema.parse(req.query);
      const orgId = req.organization!.id;
      const csvContent = await analyticsService.exportCsv(orgId, query.from, query.to);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="agree2met-analytics-${timestamp}.csv"`
      );
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
