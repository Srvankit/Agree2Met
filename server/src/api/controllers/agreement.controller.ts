import { Request, Response, NextFunction } from 'express';
import { agreementService } from '../../services/agreement.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import {
  listAgreementsQuerySchema,
  getAgreementParamsSchema,
  createAgreementDraftSchema,
  updateAgreementSchema,
  autosaveAgreementSchema,
  statusTransitionSchema,
  createCategorySchema,
  updateCategorySchema,
  createCategoryClauseSchema,
} from '../../validators/agreement.validator.js';

export class AgreementController {
  // =========================================================================
  // AGREEMENT READ ENDPOINTS
  // =========================================================================

  public async listAgreements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listAgreementsQuerySchema.parse(req.query);
      const orgId = req.organization!.id;
      const result = await agreementService.listAgreements(orgId, query);
      sendSuccess(res, result.data, 'Agreements retrieved successfully.', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public async getAgreementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const orgId = req.organization!.id;
      const agreement = await agreementService.getAgreementById(orgId, params.id);

      if (!agreement) {
        sendError(res, 'NOT_FOUND', 'Agreement not found or access denied.', 404);
        return;
      }

      sendSuccess(res, agreement, 'Agreement details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // AGREEMENT WRITE ENDPOINTS
  // =========================================================================

  public async createAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createAgreementDraftSchema.parse(req.body);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const actorName = req.user!.profile?.displayName || `${req.user!.profile?.firstName} ${req.user!.profile?.lastName}`.trim() || req.user!.email;
      const actorEmail = req.user!.email;
      const idempotencyKey = req.header('Idempotency-Key');
      const ipAddress = req.ip;
      const userAgent = req.header('user-agent');

      const result = await agreementService.createAgreement(
        orgId,
        userId,
        actorName,
        actorEmail,
        body,
        idempotencyKey,
        ipAddress,
        userAgent
      );

      if (result.isReplay) {
        res.setHeader('Idempotent-Replay', 'true');
      }

      sendSuccess(res, result.agreement, 'Agreement draft created successfully.', result.status);
    } catch (error) {
      next(error);
    }
  }

  public async updateAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const body = updateAgreementSchema.parse(req.body);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const actorName = req.user!.profile?.displayName || `${req.user!.profile?.firstName} ${req.user!.profile?.lastName}`.trim() || req.user!.email;
      const actorEmail = req.user!.email;
      const ipAddress = req.ip;
      const userAgent = req.header('user-agent');

      const updated = await agreementService.updateAgreement(
        orgId,
        userId,
        actorName,
        actorEmail,
        params.id,
        body,
        ipAddress,
        userAgent
      );

      sendSuccess(res, updated, 'Agreement updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async autosaveAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const body = autosaveAgreementSchema.parse(req.body);
      const orgId = req.organization!.id;

      const result = await agreementService.autosaveAgreement(orgId, params.id, body);
      sendSuccess(res, result, 'Draft autosaved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const body = statusTransitionSchema.parse(req.body);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const userRole = req.orgMember!.role;
      const actorName = req.user!.profile?.displayName || `${req.user!.profile?.firstName} ${req.user!.profile?.lastName}`.trim() || req.user!.email;
      const actorEmail = req.user!.email;
      const ipAddress = req.ip;
      const userAgent = req.header('user-agent');

      const updated = await agreementService.changeStatus(
        orgId,
        userId,
        userRole,
        actorName,
        actorEmail,
        params.id,
        body.status,
        body.reason,
        ipAddress,
        userAgent
      );

      sendSuccess(res, updated, `Agreement status transitioned to ${body.status}.`);
    } catch (error) {
      next(error);
    }
  }

  public async duplicateAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const actorName = req.user!.profile?.displayName || `${req.user!.profile?.firstName} ${req.user!.profile?.lastName}`.trim() || req.user!.email;
      const actorEmail = req.user!.email;
      const ipAddress = req.ip;
      const userAgent = req.header('user-agent');

      const duplicated = await agreementService.duplicateAgreement(
        orgId,
        userId,
        actorName,
        actorEmail,
        params.id,
        ipAddress,
        userAgent
      );

      sendSuccess(res, duplicated, 'Agreement duplicated successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  public async archiveAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const actorName = req.user!.profile?.displayName || `${req.user!.profile?.firstName} ${req.user!.profile?.lastName}`.trim() || req.user!.email;
      const actorEmail = req.user!.email;
      const ipAddress = req.ip;
      const userAgent = req.header('user-agent');

      const archived = await agreementService.archiveAgreement(
        orgId,
        userId,
        actorName,
        actorEmail,
        params.id,
        true,
        ipAddress,
        userAgent
      );

      sendSuccess(res, archived, 'Agreement archived successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async unarchiveAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const actorName = req.user!.profile?.displayName || `${req.user!.profile?.firstName} ${req.user!.profile?.lastName}`.trim() || req.user!.email;
      const actorEmail = req.user!.email;
      const ipAddress = req.ip;
      const userAgent = req.header('user-agent');

      const unarchived = await agreementService.archiveAgreement(
        orgId,
        userId,
        actorName,
        actorEmail,
        params.id,
        false,
        ipAddress,
        userAgent
      );

      sendSuccess(res, unarchived, 'Agreement unarchived successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async deleteAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const orgId = req.organization!.id;
      const userId = req.user!.id;
      const userRole = req.orgMember!.role;
      const ipAddress = req.ip;

      const deleted = await agreementService.softDeleteAgreement(orgId, userId, userRole, params.id, ipAddress);
      sendSuccess(res, deleted, 'Agreement draft deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // VERSION ENDPOINTS
  // =========================================================================

  public async listVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const orgId = req.organization!.id;

      const versions = await agreementService.listVersions(orgId, params.id);
      sendSuccess(res, versions, 'Agreement versions retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async getVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getAgreementParamsSchema.parse(req.params);
      const versionNum = parseInt(req.params.versionNumber, 10);
      if (isNaN(versionNum) || versionNum < 1) {
        sendError(res, 'BAD_REQUEST', 'Invalid version number.', 400);
        return;
      }

      const orgId = req.organization!.id;
      const version = await agreementService.getVersion(orgId, params.id, versionNum);
      sendSuccess(res, version, 'Agreement version snapshot retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // CATEGORY ENDPOINTS
  // =========================================================================

  public async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.organization!.id;
      const categories = await agreementService.listCategories(orgId);
      sendSuccess(res, categories, 'Agreement categories retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.orgMember!.role;
      if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
        sendError(res, 'FORBIDDEN', 'Only organization administrators can create categories.', 403);
        return;
      }

      const body = createCategorySchema.parse(req.body);
      const orgId = req.organization!.id;
      const category = await agreementService.createCategory(orgId, body);
      sendSuccess(res, category, 'Category created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.orgMember!.role;
      if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
        sendError(res, 'FORBIDDEN', 'Only organization administrators can update categories.', 403);
        return;
      }

      const categoryId = req.params.id;
      const body = updateCategorySchema.parse(req.body);
      const orgId = req.organization!.id;
      const updated = await agreementService.updateCategory(orgId, categoryId, body);
      sendSuccess(res, updated, 'Category updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.orgMember!.role;
      if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
        sendError(res, 'FORBIDDEN', 'Only organization administrators can delete categories.', 403);
        return;
      }

      const categoryId = req.params.id;
      const orgId = req.organization!.id;
      const deleted = await agreementService.deleteCategory(orgId, categoryId);
      sendSuccess(res, deleted, 'Category deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async getCategoryTemplateClauses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.params.id;
      const clauses = await agreementService.getCategoryTemplateClauses(categoryId);
      sendSuccess(res, clauses, 'Category template clauses retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  public async createCategoryTemplateClause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.orgMember!.role;
      if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
        sendError(res, 'FORBIDDEN', 'Only organization administrators can create template clauses.', 403);
        return;
      }

      const categoryId = req.params.id;
      const body = createCategoryClauseSchema.parse(req.body);
      const orgId = req.organization!.id;
      const clause = await agreementService.createCategoryTemplateClause(orgId, categoryId, body);
      sendSuccess(res, clause, 'Template clause created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const agreementController = new AgreementController();
