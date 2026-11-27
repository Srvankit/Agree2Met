export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const PERMISSIONS = {
  // Organization Management
  ORG_UPDATE: ['OWNER', 'ADMIN'] as Role[],
  ORG_DELETE: ['OWNER'] as Role[],

  // Member Management
  MEMBERS_VIEW: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as Role[],
  MEMBERS_INVITE: ['OWNER', 'ADMIN'] as Role[],
  MEMBERS_CHANGE_ROLE: ['OWNER', 'ADMIN'] as Role[],
  MEMBERS_REMOVE: ['OWNER', 'ADMIN'] as Role[],

  // Agreements (for future phases)
  AGREEMENTS_VIEW: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as Role[],
  AGREEMENTS_CREATE: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  AGREEMENTS_EDIT: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  AGREEMENTS_DELETE: ['OWNER', 'ADMIN'] as Role[],
} as const;

export function hasMinimumRole(userRole: string, requiredRole: Role): boolean {
  const userRank = ROLE_HIERARCHY[userRole as Role] ?? 0;
  const requiredRank = ROLE_HIERARCHY[requiredRole] ?? 999;
  return userRank >= requiredRank;
}

export function canManageMemberRole(actorRole: Role, targetRole: Role, newRole?: Role): boolean {
  // OWNER can manage any role (except cannot demote last owner, handled in service)
  if (actorRole === 'OWNER') return true;

  // ADMIN can only manage MEMBER or VIEWER; cannot modify or assign OWNER or ADMIN
  if (actorRole === 'ADMIN') {
    if (targetRole === 'OWNER' || targetRole === 'ADMIN') return false;
    if (newRole && (newRole === 'OWNER' || newRole === 'ADMIN')) return false;
    return true;
  }

  return false;
}
