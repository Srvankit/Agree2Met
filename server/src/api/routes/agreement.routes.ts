import { Router } from 'express';
import { agreementController } from '../controllers/agreement.controller.js';
import { authenticate, requireOrgMember } from '../middlewares/auth.middleware.js';

export const agreementRouter = Router();

// All agreement endpoints require authentication and active organization membership
agreementRouter.use(authenticate, requireOrgMember);

// Agreement read operations
agreementRouter.get('/', (req, res, next) => agreementController.listAgreements(req, res, next));
agreementRouter.get('/:id', (req, res, next) => agreementController.getAgreementById(req, res, next));

// Safe disabled writes for Phase 4 (defer creation, updates, and deletion to Phase 5)
agreementRouter.post('/', (req, res) => agreementController.disabledWriteAction(req, res));
agreementRouter.put('/:id', (req, res) => agreementController.disabledWriteAction(req, res));
agreementRouter.patch('/:id', (req, res) => agreementController.disabledWriteAction(req, res));
agreementRouter.delete('/:id', (req, res) => agreementController.disabledWriteAction(req, res));
