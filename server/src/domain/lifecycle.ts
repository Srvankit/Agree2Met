/**
 * Agree2Met — Agreement Lifecycle State Machine Domain Module
 *
 * Implements pure state machine transitions according to SYSTEM_ARCHITECTURE.md
 * and API_DOCUMENTATION.md.
 */

export type AgreementStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'SENT'
  | 'AWAITING_SIGNATURES'
  | 'PARTIALLY_SIGNED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export const ALL_STATUSES: AgreementStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'SENT',
  'AWAITING_SIGNATURES',
  'PARTIALLY_SIGNED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
];

export const TERMINAL_STATUSES: AgreementStatus[] = [
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
];

/**
 * Valid transitions defined across the entire Agree2Met platform blueprint.
 */
export const ALLOWED_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['DRAFT', 'SENT', 'CANCELLED'],
  SENT: ['AWAITING_SIGNATURES', 'CANCELLED', 'EXPIRED'],
  AWAITING_SIGNATURES: ['PARTIALLY_SIGNED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  PARTIALLY_SIGNED: ['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/**
 * Valid transitions reachable via the API in Phase 5.
 * Signing, dispatch, and execution transitions are deferred to Phase 6 and beyond.
 */
export const PHASE_5_ALLOWED_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['DRAFT', 'CANCELLED'],
  SENT: [],
  AWAITING_SIGNATURES: [],
  PARTIALLY_SIGNED: [],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export interface TransitionValidationResult {
  allowed: boolean;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Checks whether a transition between two statuses is structurally valid in the lifecycle.
 */
export function canTransition(from: AgreementStatus, to: AgreementStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Checks whether an agreement in a given status can be edited.
 */
export function isEditableStatus(status: AgreementStatus): boolean {
  return status === 'DRAFT' || status === 'PENDING_REVIEW';
}

/**
 * Checks whether an agreement can be archived.
 * Allowed for terminal statuses and drafts.
 */
export function canArchive(status: AgreementStatus): boolean {
  return TERMINAL_STATUSES.includes(status) || status === 'DRAFT';
}

/**
 * Checks whether an agreement can be soft-deleted.
 * Strictly restricted to DRAFT status.
 */
export function canDelete(status: AgreementStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Evaluates whether a requested transition is permitted in Phase 5,
 * taking into account user role and lifecycle availability.
 */
export function validatePhase5Transition(
  currentStatus: AgreementStatus,
  targetStatus: AgreementStatus,
  userRole: string,
  isCreator: boolean
): TransitionValidationResult {
  // Role checks: Viewers can never alter agreement state
  if (userRole === 'VIEWER') {
    return {
      allowed: false,
      httpStatus: 403,
      errorCode: 'FORBIDDEN',
      errorMessage: 'Viewers do not have permission to transition agreement status.',
    };
  }

  // Same status is a no-op
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      httpStatus: 400,
      errorCode: 'NOOP_TRANSITION',
      errorMessage: `Agreement is already in status '${currentStatus}'.`,
    };
  }

  // Check if transition is valid in the platform blueprint
  if (!canTransition(currentStatus, targetStatus)) {
    return {
      allowed: false,
      httpStatus: 400,
      errorCode: 'INVALID_TRANSITION',
      errorMessage: `Cannot transition agreement from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  // Check if transition is available in Phase 5
  const phase5Allowed = PHASE_5_ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus);
  if (!phase5Allowed) {
    return {
      allowed: false,
      httpStatus: 409,
      errorCode: 'TRANSITION_NOT_AVAILABLE_YET',
      errorMessage: `Transition to '${targetStatus}' will be available in an upcoming release (Phase 6). Sending for signature is not yet enabled.`,
    };
  }

  // Member role restrictions: Members can transition drafts they created, or transition back to draft
  if (userRole === 'MEMBER' && !isCreator && targetStatus === 'CANCELLED') {
    return {
      allowed: false,
      httpStatus: 403,
      errorCode: 'FORBIDDEN',
      errorMessage: 'Only the agreement creator or an administrator can cancel this agreement.',
    };
  }

  return { allowed: true };
}
