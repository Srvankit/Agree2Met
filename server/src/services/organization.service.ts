import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { hashToken, generateRandomToken } from '../utils/crypto.util.js';
import { canManageMemberRole, Role } from '../constants/permissions.js';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  InviteMemberInput,
} from '../validators/organization.validator.js';
import { enqueueTransactionalEmail } from '../queues/index.js';

export class OrganizationService {
  /**
   * List all active organizations the user belongs to.
   */
  public async getOrganizations(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId, isActive: true },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      subscriptionTier: m.organization.subscriptionTier,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Create a new organization and assign the creator as OWNER.
   */
  public async createOrganization(
    userId: string,
    userEmail: string,
    input: CreateOrganizationInput,
    requestId?: string
  ) {
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name.trim(),
          slug,
          billingEmail: input.billingEmail?.trim() || userEmail,
          defaultCurrency: input.defaultCurrency || 'USD',
          defaultTimezone: input.defaultTimezone || 'UTC',
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: 'OWNER',
          isActive: true,
        },
      });

      return org;
    });

    logger.info({ userId, organizationId: organization.id, requestId }, 'Organization created');
    return organization;
  }

  /**
   * Get organization details with tenant isolation check.
   */
  public async getOrganizationById(orgId: string, userId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId,
        },
      },
      include: { organization: true },
    });

    if (!membership || !membership.isActive) {
      const err = new Error('Organization not found or access denied.');
      (err as any).code = 'ORGANIZATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    return {
      ...membership.organization,
      currentUserRole: membership.role,
    };
  }

  /**
   * Get members and pending invitations for an organization.
   */
  public async getMembers(orgId: string, userId: string) {
    const callerMembership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!callerMembership || !callerMembership.isActive) {
      const err = new Error('Organization not found or access denied.');
      (err as any).code = 'ORGANIZATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                jobTitle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Only OWNER and ADMIN see pending invitations
    let invitations: any[] = [];
    if (callerMembership.role === 'OWNER' || callerMembership.role === 'ADMIN') {
      invitations = await prisma.organizationInvitation.findMany({
        where: {
          organizationId: orgId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        include: {
          inviter: {
            select: {
              email: true,
              profile: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        name: m.user.profile?.displayName || m.user.email,
        role: m.role,
        avatarUrl: m.user.profile?.avatarUrl,
        jobTitle: m.user.profile?.jobTitle,
        joinedAt: m.createdAt,
      })),
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.inviter?.profile?.displayName || inv.inviter?.email,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    };
  }

  /**
   * Invite a new team member by email.
   */
  public async inviteMember(
    orgId: string,
    inviterUserId: string,
    input: InviteMemberInput,
    requestId?: string
  ) {
    const inviterMembership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId: inviterUserId,
        },
      },
      include: { organization: true },
    });

    if (!inviterMembership || !inviterMembership.isActive) {
      const err = new Error('Organization not found.');
      (err as any).code = 'ORGANIZATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const inviterRole = inviterMembership.role as Role;
    if (inviterRole !== 'OWNER' && inviterRole !== 'ADMIN') {
      const err = new Error('Only Owners and Admins can invite team members.');
      (err as any).code = 'INSUFFICIENT_PERMISSIONS';
      (err as any).statusCode = 403;
      throw err;
    }

    if (!canManageMemberRole(inviterRole, 'MEMBER', input.role as Role)) {
      const err = new Error(`Admins cannot invite users with ${input.role} role.`);
      (err as any).code = 'INSUFFICIENT_PERMISSIONS';
      (err as any).statusCode = 403;
      throw err;
    }

    const email = input.email.toLowerCase().trim();

    // Check if user is already an active member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMembership = await prisma.organizationMember.findUnique({
        where: {
          uq_org_user: {
            organizationId: orgId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership && existingMembership.isActive) {
        const err = new Error('User is already an active member of this organization.');
        (err as any).code = 'ALREADY_A_MEMBER';
        (err as any).statusCode = 400;
        throw err;
      }
    }

    // Revoke any existing pending invitations for this email in this org
    await prisma.organizationInvitation.updateMany({
      where: {
        organizationId: orgId,
        email,
        status: 'PENDING',
      },
      data: { status: 'REVOKED' },
    });

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: orgId,
        email,
        role: input.role,
        invitationTokenHash: tokenHash,
        invitedBy: inviterUserId,
        status: 'PENDING',
        expiresAt,
      },
    });

    const inviteUrl = `${env.CLIENT_URL}/accept-invitation?token=${rawToken}`;
    await enqueueTransactionalEmail({
      to: email,
      subject: `You've been invited to join ${inviterMembership.organization.name} on Agree2Met`,
      html: `
        <h2>Team Invitation</h2>
        <p>You have been invited to join <strong>${inviterMembership.organization.name}</strong> as a <strong>${input.role}</strong>.</p>
        <p><a href="${inviteUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
        <p>This invitation expires in 7 days.</p>
      `,
      text: `You have been invited to join ${inviterMembership.organization.name} as a ${input.role}.\n\nAccept your invitation:\n${inviteUrl}\n\nThis invitation expires in 7 days.`,
    });

    logger.info({ organizationId: orgId, invitedEmail: email, role: input.role, requestId }, 'Team invitation sent');

    return {
      message: 'Invitation sent successfully.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  /**
   * Accept an invitation to join an organization.
   */
  public async acceptInvitation(
    userId: string,
    userEmail: string,
    token: string,
    requestId?: string
  ) {
    const tokenHash = hashToken(token);

    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        invitationTokenHash: tokenHash,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
    });

    if (!invitation) {
      const err = new Error('Invitation is invalid or has expired.');
      (err as any).code = 'INVALID_OR_EXPIRED_INVITATION';
      (err as any).statusCode = 400;
      throw err;
    }

    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      logger.warn(
        { userEmail, invitationEmail: invitation.email, requestId },
        'Invitation acceptance rejected: Email mismatch'
      );
      const err = new Error('This invitation was sent to a different email address.');
      (err as any).code = 'INVITATION_EMAIL_MISMATCH';
      (err as any).statusCode = 400;
      throw err;
    }

    await prisma.$transaction([
      prisma.organizationMember.upsert({
        where: {
          uq_org_user: {
            organizationId: invitation.organizationId,
            userId,
          },
        },
        update: {
          role: invitation.role,
          isActive: true,
        },
        create: {
          organizationId: invitation.organizationId,
          userId,
          role: invitation.role,
          isActive: true,
        },
      }),
      prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      }),
    ]);

    logger.info({ userId, organizationId: invitation.organizationId, requestId }, 'Invitation accepted');

    return {
      message: `You have successfully joined ${invitation.organization.name}.`,
      organizationId: invitation.organizationId,
    };
  }

  /**
   * Update role of a team member with last-owner and hierarchy protection.
   */
  public async updateMemberRole(
    orgId: string,
    actorUserId: string,
    targetMemberId: string,
    newRole: Role,
    requestId?: string
  ) {
    const actorMembership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId: actorUserId,
        },
      },
    });

    if (!actorMembership || !actorMembership.isActive) {
      const err = new Error('Organization not found.');
      (err as any).code = 'ORGANIZATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const actorRole = actorMembership.role as Role;
    if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
      const err = new Error('Only Owners and Admins can modify member roles.');
      (err as any).code = 'INSUFFICIENT_PERMISSIONS';
      (err as any).statusCode = 403;
      throw err;
    }

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: targetMemberId, organizationId: orgId, isActive: true },
    });

    if (!targetMember) {
      const err = new Error('Team member not found in this organization.');
      (err as any).code = 'MEMBER_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const targetRole = targetMember.role as Role;

    // Last OWNER protection
    if (targetRole === 'OWNER' && newRole !== 'OWNER') {
      const activeOwnersCount = await prisma.organizationMember.count({
        where: { organizationId: orgId, role: 'OWNER', isActive: true },
      });

      if (activeOwnersCount <= 1) {
        const err = new Error('Cannot demote member: An organization must have at least one active Owner.');
        (err as any).code = 'CANNOT_DEMOTE_LAST_OWNER';
        (err as any).statusCode = 400;
        throw err;
      }
    }

    // Role hierarchy permission check
    if (!canManageMemberRole(actorRole, targetRole, newRole)) {
      const err = new Error(`You do not have permission to change a ${targetRole}'s role to ${newRole}.`);
      (err as any).code = 'INSUFFICIENT_PERMISSIONS';
      (err as any).statusCode = 403;
      throw err;
    }

    const updated = await prisma.organizationMember.update({
      where: { id: targetMemberId },
      data: { role: newRole },
    });

    logger.info({ orgId, actorUserId, targetMemberId, newRole, requestId }, 'Member role updated');

    return updated;
  }

  /**
   * Remove a member from the organization with last-owner and hierarchy protection.
   */
  public async removeMember(
    orgId: string,
    actorUserId: string,
    targetMemberId: string,
    requestId?: string
  ) {
    const actorMembership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId: actorUserId,
        },
      },
    });

    if (!actorMembership || !actorMembership.isActive) {
      const err = new Error('Organization not found.');
      (err as any).code = 'ORGANIZATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: targetMemberId, organizationId: orgId, isActive: true },
    });

    if (!targetMember) {
      const err = new Error('Team member not found.');
      (err as any).code = 'MEMBER_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const actorRole = actorMembership.role as Role;
    const targetRole = targetMember.role as Role;
    const isSelfRemoval = targetMember.userId === actorUserId;

    if (!isSelfRemoval) {
      if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
        const err = new Error('Only Owners and Admins can remove team members.');
        (err as any).code = 'INSUFFICIENT_PERMISSIONS';
        (err as any).statusCode = 403;
        throw err;
      }

      if (!canManageMemberRole(actorRole, targetRole)) {
        const err = new Error(`Admins cannot remove other ${targetRole}s.`);
        (err as any).code = 'INSUFFICIENT_PERMISSIONS';
        (err as any).statusCode = 403;
        throw err;
      }
    }

    // Last OWNER protection
    if (targetRole === 'OWNER') {
      const activeOwnersCount = await prisma.organizationMember.count({
        where: { organizationId: orgId, role: 'OWNER', isActive: true },
      });

      if (activeOwnersCount <= 1) {
        const err = new Error('Cannot remove member: An organization must have at least one active Owner.');
        (err as any).code = 'CANNOT_REMOVE_LAST_OWNER';
        (err as any).statusCode = 400;
        throw err;
      }
    }

    await prisma.organizationMember.update({
      where: { id: targetMemberId },
      data: { isActive: false },
    });

    logger.info({ orgId, actorUserId, targetMemberId, isSelfRemoval, requestId }, 'Member removed from organization');

    return {
      message: 'Member removed from organization successfully.',
    };
  }

  /**
   * Resend an invitation.
   */
  public async resendInvitation(
    orgId: string,
    actorUserId: string,
    invitationId: string,
    requestId?: string
  ) {
    const actorMembership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId: actorUserId,
        },
      },
      include: { organization: true },
    });

    if (!actorMembership || !['OWNER', 'ADMIN'].includes(actorMembership.role)) {
      const err = new Error('Only Owners and Admins can resend invitations.');
      (err as any).code = 'INSUFFICIENT_PERMISSIONS';
      (err as any).statusCode = 403;
      throw err;
    }

    const invitation = await prisma.organizationInvitation.findFirst({
      where: { id: invitationId, organizationId: orgId, status: 'PENDING' },
    });

    if (!invitation) {
      const err = new Error('Pending invitation not found.');
      (err as any).code = 'INVITATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        invitationTokenHash: tokenHash,
        expiresAt,
      },
    });

    const inviteUrl = `${env.CLIENT_URL}/accept-invitation?token=${rawToken}`;
    await enqueueTransactionalEmail({
      to: invitation.email,
      subject: `Reminder: Join ${actorMembership.organization.name} on Agree2Met`,
      html: `
        <h2>Invitation Reminder</h2>
        <p>You have a pending invitation to join <strong>${actorMembership.organization.name}</strong> as a <strong>${invitation.role}</strong>.</p>
        <p><a href="${inviteUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
      `,
      text: `Reminder: Join ${actorMembership.organization.name} on Agree2Met:\n${inviteUrl}`,
    });

    logger.info({ orgId, invitationId, requestId }, 'Invitation resent');

    return {
      message: 'Invitation resent successfully.',
    };
  }

  /**
   * Revoke an invitation.
   */
  public async revokeInvitation(
    orgId: string,
    actorUserId: string,
    invitationId: string,
    requestId?: string
  ) {
    const actorMembership = await prisma.organizationMember.findUnique({
      where: {
        uq_org_user: {
          organizationId: orgId,
          userId: actorUserId,
        },
      },
    });

    if (!actorMembership || !['OWNER', 'ADMIN'].includes(actorMembership.role)) {
      const err = new Error('Only Owners and Admins can revoke invitations.');
      (err as any).code = 'INSUFFICIENT_PERMISSIONS';
      (err as any).statusCode = 403;
      throw err;
    }

    const invitation = await prisma.organizationInvitation.findFirst({
      where: { id: invitationId, organizationId: orgId },
    });

    if (!invitation) {
      const err = new Error('Invitation not found.');
      (err as any).code = 'INVITATION_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    await prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REVOKED' },
    });

    logger.info({ orgId, invitationId, requestId }, 'Invitation revoked');

    return {
      message: 'Invitation revoked successfully.',
    };
  }
}

export const organizationService = new OrganizationService();
