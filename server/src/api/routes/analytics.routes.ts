import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate, requireOrgMember } from '../middlewares/auth.middleware.js';

export const analyticsRouter = Router();

// Analytics endpoints accessible to all authenticated organization members (including VIEWER)
analyticsRouter.use(authenticate, requireOrgMember);

analyticsRouter.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
analyticsRouter.get('/export.csv', (req, res, next) => analyticsController.exportCsv(req, res, next));
