import { Request, Response, NextFunction } from 'express';
import { agreementService } from '../../services/agreement.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import {
  listAgreementsQuerySchema,
  getAgreementParamsSchema,
} from '../../validators/agreement.validator.js';

export class AgreementController {
  public async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.organization!.id;
      const categories = await agreementService.listCategories(orgId);
      sendSuccess(res, categories, 'Agreement categories retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

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

  /**
   * Safe disabled write handler for Phase 4.
   * Creation, updates, state transitions, and deletion of agreements are deferred to Phase 5.
   */
  public disabledWriteAction(req: Request, res: Response): void {
    sendError(
      res,
      'NOT_AVAILABLE_YET',
      'Agreement modification operations will be available in an upcoming release (Phase 5).',
      501
    );
  }
}

export const agreementController = new AgreementController();
