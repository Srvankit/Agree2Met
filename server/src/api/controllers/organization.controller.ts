import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../../services/organization.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import {
  createOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
} from '../../validators/organization.validator.js';

export class OrganizationController {
  public async getOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }
      const orgs = await organizationService.getOrganizations(req.user.id);
      sendSuccess(res, { organizations: orgs }, 'Organizations retrieved successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async createOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = createOrganizationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid organization data.',
          400,
          parsed.error.errors
        );
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const org = await organizationService.createOrganization(
        req.user.id,
        req.user.email,
        parsed.data,
        requestId
      );

      sendSuccess(res, { organization: org }, 'Organization created successfully.', 201);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async getOrganizationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const orgId = req.params.id;
      const org = await organizationService.getOrganizationById(orgId, req.user.id);
      sendSuccess(res, { organization: org }, 'Organization details retrieved successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const orgId = req.params.id;
      const data = await organizationService.getMembers(orgId, req.user.id);
      sendSuccess(res, data, 'Organization members retrieved successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = inviteMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid invitation payload.',
          400,
          parsed.error.errors
        );
        return;
      }

      const orgId = req.params.id;
      const requestId = req.headers['x-request-id'] as string;

      const result = await organizationService.inviteMember(
        orgId,
        req.user.id,
        parsed.data,
        requestId
      );

      sendSuccess(res, result, result.message, 201);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = acceptInvitationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'VALIDATION_ERROR', 'Invitation token is required.', 400);
        return;
      }

      const requestId = req.headers['x-request-id'] as string;
      const result = await organizationService.acceptInvitation(
        req.user.id,
        req.user.email,
        parsed.data.token,
        requestId
      );

      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const parsed = updateMemberRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'VALIDATION_ERROR',
          'A valid role is required.',
          400,
          parsed.error.errors
        );
        return;
      }

      const { id: orgId, memberId } = req.params;
      const requestId = req.headers['x-request-id'] as string;

      const updated = await organizationService.updateMemberRole(
        orgId,
        req.user.id,
        memberId,
        parsed.data.role,
        requestId
      );

      sendSuccess(res, { member: updated }, 'Member role updated successfully.');
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const { id: orgId, memberId } = req.params;
      const requestId = req.headers['x-request-id'] as string;

      const result = await organizationService.removeMember(
        orgId,
        req.user.id,
        memberId,
        requestId
      );

      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const { id: orgId, invitationId } = req.params;
      const requestId = req.headers['x-request-id'] as string;

      const result = await organizationService.resendInvitation(
        orgId,
        req.user.id,
        invitationId,
        requestId
      );

      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  public async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
        return;
      }

      const { id: orgId, invitationId } = req.params;
      const requestId = req.headers['x-request-id'] as string;

      const result = await organizationService.revokeInvitation(
        orgId,
        req.user.id,
        invitationId,
        requestId
      );

      sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

export const organizationController = new OrganizationController();
