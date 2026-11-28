import { Router } from 'express';
import { agreementController } from '../controllers/agreement.controller.js';
import { authenticate, requireOrgMember } from '../middlewares/auth.middleware.js';

export const agreementRouter = Router();

// All agreement endpoints require authentication and active organization membership
agreementRouter.use(authenticate, requireOrgMember);

// List agreements with pagination, filtering & sorting
agreementRouter.get('/', (req, res, next) => agreementController.listAgreements(req, res, next));

// Create agreement draft (with atomic reference number, v1 version snapshot, audit trail)
agreementRouter.post('/', (req, res, next) => agreementController.createAgreement(req, res, next));

// Single agreement details with parties, clauses, payment terms, and cryptographic audit trail
agreementRouter.get('/:id', (req, res, next) => agreementController.getAgreementById(req, res, next));

// Full update of draft agreement (with optimistic locking & new version snapshot)
agreementRouter.put('/:id', (req, res, next) => agreementController.updateAgreement(req, res, next));

// Debounced lightweight autosave of draft agreement
agreementRouter.patch('/:id/autosave', (req, res, next) => agreementController.autosaveAgreement(req, res, next));

// Lifecycle state machine status transition (Phase 5: DRAFT <-> PENDING_REVIEW, CANCELLED)
agreementRouter.patch('/:id/status', (req, res, next) => agreementController.changeStatus(req, res, next));

// Duplicate agreement as a new draft
agreementRouter.post('/:id/duplicate', (req, res, next) => agreementController.duplicateAgreement(req, res, next));

// Archive agreement
agreementRouter.post('/:id/archive', (req, res, next) => agreementController.archiveAgreement(req, res, next));

// Unarchive agreement
agreementRouter.post('/:id/unarchive', (req, res, next) => agreementController.unarchiveAgreement(req, res, next));

// Soft delete agreement (strictly drafts)
agreementRouter.delete('/:id', (req, res, next) => agreementController.deleteAgreement(req, res, next));

// Historical version snapshots
agreementRouter.get('/:id/versions', (req, res, next) => agreementController.listVersions(req, res, next));
agreementRouter.get('/:id/versions/:versionNumber', (req, res, next) => agreementController.getVersion(req, res, next));
