import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, requireOrgMember } from '../middlewares/auth.middleware.js';

export const dashboardRouter = Router();

// Dashboard read endpoints accessible to all authenticated organization members (including VIEWER)
dashboardRouter.use(authenticate, requireOrgMember);

dashboardRouter.get('/stats', (req, res, next) => dashboardController.getStats(req, res, next));
dashboardRouter.get('/activity', (req, res, next) => dashboardController.getActivity(req, res, next));
dashboardRouter.get('/deadlines', (req, res, next) => dashboardController.getDeadlines(req, res, next));
dashboardRouter.get('/recent', (req, res, next) => dashboardController.getRecent(req, res, next));
