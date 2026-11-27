import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const organizationRouter = Router();

organizationRouter.use(authenticate);

organizationRouter.get('/', organizationController.getOrganizations);
organizationRouter.post('/', organizationController.createOrganization);
organizationRouter.post('/invitations/accept', organizationController.acceptInvitation);
organizationRouter.get('/:id', organizationController.getOrganizationById);
organizationRouter.get('/:id/members', organizationController.getMembers);
organizationRouter.post('/:id/members', organizationController.inviteMember);
organizationRouter.patch('/:id/members/:memberId', organizationController.updateMemberRole);
organizationRouter.delete('/:id/members/:memberId', organizationController.removeMember);
organizationRouter.post('/:id/invitations/:invitationId/resend', organizationController.resendInvitation);
organizationRouter.delete('/:id/invitations/:invitationId', organizationController.revokeInvitation);
