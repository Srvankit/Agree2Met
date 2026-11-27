import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { verifyAccessToken } from '../../utils/crypto.util.js';
import { sendError } from '../../utils/response.js';
import { Role } from '../../constants/permissions.js';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.['access_token'];

  if (!token || typeof token !== 'string') {
    sendError(res, 'UNAUTHORIZED', 'Authentication required. No access token provided.', 401);
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      sendError(
        res,
        'SESSION_EXPIRED',
        'Session has expired or was revoked. Please log in again.',
        401
      );
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true },
    });

    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'User not found.', 401);
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      sendError(
        res,
        'ACCOUNT_LOCKED',
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        423
      );
      return;
    }

    req.user = user;
    req.session = session;
    next();
  } catch {
    sendError(res, 'UNAUTHORIZED', 'Authentication failed. Invalid or expired token.', 401);
  }
}

export function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.isEmailVerified) {
    sendError(
      res,
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address to access this resource.',
      403
    );
    return;
  }
  next();
}

export async function requireOrgMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
    return;
  }

  const headerOrgId = req.headers['x-organization-id'];
  const orgId = typeof headerOrgId === 'string' && headerOrgId.trim() ? headerOrgId.trim() : null;

  try {
    let membership;

    if (orgId) {
      membership = await prisma.organizationMember.findUnique({
        where: {
          uq_org_user: {
            organizationId: orgId,
            userId: req.user.id,
          },
        },
        include: { organization: true },
      });
    } else {
      membership = await prisma.organizationMember.findFirst({
        where: {
          userId: req.user.id,
          isActive: true,
        },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!membership || !membership.isActive || !membership.organization.isActive) {
      sendError(
        res,
        'ORGANIZATION_ACCESS_DENIED',
        'You do not have active membership in this organization.',
        403
      );
      return;
    }

    req.orgMember = membership;
    req.organization = membership.organization;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.orgMember) {
      sendError(
        res,
        'ORGANIZATION_REQUIRED',
        'Active organization membership required for role validation.',
        403
      );
      return;
    }

    const currentRole = req.orgMember.role as Role;
    if (!allowedRoles.includes(currentRole)) {
      sendError(
        res,
        'INSUFFICIENT_PERMISSIONS',
        `This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403
      );
      return;
    }

    next();
  };
}
