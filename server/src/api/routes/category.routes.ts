import { Router } from 'express';
import { agreementController } from '../controllers/agreement.controller.js';
import { authenticate, requireOrgMember } from '../middlewares/auth.middleware.js';

export const categoryRouter = Router();

categoryRouter.use(authenticate, requireOrgMember);
categoryRouter.get('/', (req, res, next) => agreementController.listCategories(req, res, next));
