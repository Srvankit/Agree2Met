/**
 * Agreement Lifecycle State Machine and Transition Rules
 * Matches Phase 0 and Phase 1 specifications.
 */

export const AGREEMENT_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  AWAITING_SIGNATURES: 'awaiting_signatures',
  PARTIALLY_SIGNED: 'partially_signed',
  SIGNED: 'signed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
};

export const STATUS_META = {
  [AGREEMENT_STATUSES.DRAFT]: {
    label: 'Draft',
    variant: 'draft',
    description: 'Agreement is being authored and clauses edited.',
    color: 'var(--color-status-draft-text)',
    bgColor: 'var(--color-status-draft-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.IN_REVIEW]: {
    label: 'In Review',
    variant: 'in_review',
    description: 'Internal legal or management review in progress.',
    color: 'var(--color-status-in-review-text)',
    bgColor: 'var(--color-status-in-review-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.APPROVED]: {
    label: 'Approved',
    variant: 'approved',
    description: 'Internal approval received. Ready to prepare for signatures.',
    color: 'var(--color-status-approved-text)',
    bgColor: 'var(--color-status-approved-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.AWAITING_SIGNATURES]: {
    label: 'Awaiting Signatures',
    variant: 'awaiting_signatures',
    description: 'Signing invitations dispatched. Pending signers.',
    color: 'var(--color-status-awaiting-signatures-text)',
    bgColor: 'var(--color-status-awaiting-signatures-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.PARTIALLY_SIGNED]: {
    label: 'Partially Signed',
    variant: 'partially_signed',
    description: 'At least one signer has signed; awaiting remaining parties.',
    color: 'var(--color-status-partially-signed-text)',
    bgColor: 'var(--color-status-partially-signed-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.SIGNED]: {
    label: 'Fully Signed',
    variant: 'signed',
    description: 'All counterparties have signed. Execution finalized.',
    color: 'var(--color-status-signed-text)',
    bgColor: 'var(--color-status-signed-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.ACTIVE]: {
    label: 'Active',
    variant: 'active',
    description: 'In effect and ongoing terms/milestones are active.',
    color: 'var(--color-status-active-text)',
    bgColor: 'var(--color-status-active-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.COMPLETED]: {
    label: 'Completed',
    variant: 'completed',
    description: 'All obligations and milestones successfully fulfilled.',
    color: 'var(--color-status-completed-text)',
    bgColor: 'var(--color-status-completed-bg)',
    terminal: true,
  },
  [AGREEMENT_STATUSES.EXPIRED]: {
    label: 'Expired',
    variant: 'expired',
    description: 'Contract term or signing window elapsed without extension.',
    color: 'var(--color-status-expired-text)',
    bgColor: 'var(--color-status-expired-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.TERMINATED]: {
    label: 'Terminated',
    variant: 'terminated',
    description: 'Contract ended early by mutual agreement or breach.',
    color: 'var(--color-status-terminated-text)',
    bgColor: 'var(--color-status-terminated-bg)',
    terminal: true,
  },
  [AGREEMENT_STATUSES.DISPUTED]: {
    label: 'Disputed',
    variant: 'disputed',
    description: 'Under dispute or legal contention regarding obligations.',
    color: 'var(--color-status-disputed-text)',
    bgColor: 'var(--color-status-disputed-bg)',
    terminal: false,
  },
  [AGREEMENT_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    variant: 'cancelled',
    description: 'Voided before execution took effect.',
    color: 'var(--color-status-cancelled-text)',
    bgColor: 'var(--color-status-cancelled-bg)',
    terminal: true,
  },
};

// Transition matrix
export const TRANSITIONS = {
  [AGREEMENT_STATUSES.DRAFT]: [
    AGREEMENT_STATUSES.IN_REVIEW,
    AGREEMENT_STATUSES.CANCELLED,
  ],
  [AGREEMENT_STATUSES.IN_REVIEW]: [
    AGREEMENT_STATUSES.APPROVED,
    AGREEMENT_STATUSES.DRAFT, // requested changes
    AGREEMENT_STATUSES.CANCELLED,
  ],
  [AGREEMENT_STATUSES.APPROVED]: [
    AGREEMENT_STATUSES.AWAITING_SIGNATURES,
    AGREEMENT_STATUSES.DRAFT,
    AGREEMENT_STATUSES.CANCELLED,
  ],
  [AGREEMENT_STATUSES.AWAITING_SIGNATURES]: [
    AGREEMENT_STATUSES.PARTIALLY_SIGNED,
    AGREEMENT_STATUSES.SIGNED,
    AGREEMENT_STATUSES.EXPIRED,
    AGREEMENT_STATUSES.CANCELLED,
  ],
  [AGREEMENT_STATUSES.PARTIALLY_SIGNED]: [
    AGREEMENT_STATUSES.SIGNED,
    AGREEMENT_STATUSES.EXPIRED,
    AGREEMENT_STATUSES.CANCELLED,
  ],
  [AGREEMENT_STATUSES.SIGNED]: [
    AGREEMENT_STATUSES.ACTIVE,
    AGREEMENT_STATUSES.COMPLETED,
  ],
  [AGREEMENT_STATUSES.ACTIVE]: [
    AGREEMENT_STATUSES.COMPLETED,
    AGREEMENT_STATUSES.EXPIRED,
    AGREEMENT_STATUSES.TERMINATED,
    AGREEMENT_STATUSES.DISPUTED,
  ],
  [AGREEMENT_STATUSES.DISPUTED]: [
    AGREEMENT_STATUSES.ACTIVE,
    AGREEMENT_STATUSES.TERMINATED,
    AGREEMENT_STATUSES.COMPLETED,
  ],
  [AGREEMENT_STATUSES.EXPIRED]: [
    AGREEMENT_STATUSES.ACTIVE, // with renewal extension
    AGREEMENT_STATUSES.COMPLETED,
  ],
  [AGREEMENT_STATUSES.COMPLETED]: [],
  [AGREEMENT_STATUSES.TERMINATED]: [],
  [AGREEMENT_STATUSES.CANCELLED]: [],
};

// Roles that can perform lifecycle transitions
export const ROLE_PERMISSIONS = {
  OWNER: ['*'],
  ADMIN: [
    'create',
    'edit',
    'delete',
    'submit_review',
    'approve',
    'send_signatures',
    'cancel',
    'terminate',
    'activate',
    'complete',
    'resolve_dispute',
  ],
  MEMBER: [
    'create',
    'edit',
    'submit_review',
    'send_signatures',
    'download',
    'view',
  ],
  VIEWER: ['view', 'download'],
};

/**
 * Validates if transition from currentStatus to nextStatus is allowed
 */
export function isValidTransition(currentStatus, nextStatus) {
  const allowed = TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Checks if user with given role can perform specific action
 */
export function canUserPerformAction(role, action) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role.toUpperCase()] || [];
  if (perms.includes('*')) return true;
  return perms.includes(action);
}

/**
 * Gets list of allowable next statuses for a given agreement and user role
 */
export function getAvailableNextStatuses(currentStatus, role = 'ADMIN') {
  const possible = TRANSITIONS[currentStatus] || [];
  if (role === 'VIEWER') return [];
  return possible;
}
