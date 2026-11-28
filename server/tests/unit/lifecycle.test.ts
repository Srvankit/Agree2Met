import { describe, it, expect } from 'vitest';
import {
  canTransition,
  validatePhase5Transition,
  isEditableStatus,
  canArchive,
  canDelete,
  ALLOWED_TRANSITIONS,
  ALL_STATUSES,
  AgreementStatus,
} from '../../src/domain/lifecycle.js';

describe('Agreement Lifecycle State Machine (Pure Domain)', () => {
  describe('canTransition() Blueprint Validation', () => {
    it('allows valid forward and backward transitions defined in blueprint', () => {
      expect(canTransition('DRAFT', 'PENDING_REVIEW')).toBe(true);
      expect(canTransition('PENDING_REVIEW', 'DRAFT')).toBe(true);
      expect(canTransition('PENDING_REVIEW', 'SENT')).toBe(true);
      expect(canTransition('SENT', 'AWAITING_SIGNATURES')).toBe(true);
      expect(canTransition('AWAITING_SIGNATURES', 'COMPLETED')).toBe(true);
      expect(canTransition('AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')).toBe(true);
      expect(canTransition('PARTIALLY_SIGNED', 'COMPLETED')).toBe(true);
      expect(canTransition('DRAFT', 'CANCELLED')).toBe(true);
      expect(canTransition('PENDING_REVIEW', 'CANCELLED')).toBe(true);
      expect(canTransition('AWAITING_SIGNATURES', 'REJECTED')).toBe(true);
      expect(canTransition('AWAITING_SIGNATURES', 'EXPIRED')).toBe(true);
    });

    it('rejects invalid transitions across all status pairs', () => {
      expect(canTransition('DRAFT', 'COMPLETED')).toBe(false);
      expect(canTransition('DRAFT', 'SENT')).toBe(false);
      expect(canTransition('DRAFT', 'EXPIRED')).toBe(false);
      expect(canTransition('COMPLETED', 'DRAFT')).toBe(false);
      expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
      expect(canTransition('REJECTED', 'DRAFT')).toBe(false);
      expect(canTransition('CANCELLED', 'DRAFT')).toBe(false);
      expect(canTransition('EXPIRED', 'PENDING_REVIEW')).toBe(false);
    });

    it('confirms terminal statuses have zero outgoing transitions', () => {
      const terminalStatuses: AgreementStatus[] = ['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
      for (const terminal of terminalStatuses) {
        for (const target of ALL_STATUSES) {
          expect(canTransition(terminal, target)).toBe(false);
        }
      }
    });
  });

  describe('validatePhase5Transition() API Availability & Permissions', () => {
    it('permits Phase 5 reachable transitions: DRAFT <-> PENDING_REVIEW and -> CANCELLED', () => {
      const r1 = validatePhase5Transition('DRAFT', 'PENDING_REVIEW', 'OWNER', true);
      expect(r1.allowed).toBe(true);

      const r2 = validatePhase5Transition('PENDING_REVIEW', 'DRAFT', 'ADMIN', false);
      expect(r2.allowed).toBe(true);

      const r3 = validatePhase5Transition('DRAFT', 'CANCELLED', 'MEMBER', true);
      expect(r3.allowed).toBe(true);

      const r4 = validatePhase5Transition('PENDING_REVIEW', 'CANCELLED', 'OWNER', false);
      expect(r4.allowed).toBe(true);
    });

    it('returns 409 TRANSITION_NOT_AVAILABLE_YET for blueprint transitions deferred to Phase 6+', () => {
      const r1 = validatePhase5Transition('PENDING_REVIEW', 'SENT', 'OWNER', true);
      expect(r1.allowed).toBe(false);
      expect(r1.httpStatus).toBe(409);
      expect(r1.errorCode).toBe('TRANSITION_NOT_AVAILABLE_YET');
      expect(r1.errorMessage).toContain('Phase 6');
    });

    it('returns 400 INVALID_TRANSITION for structurally impossible transitions', () => {
      const r = validatePhase5Transition('DRAFT', 'COMPLETED', 'OWNER', true);
      expect(r.allowed).toBe(false);
      expect(r.httpStatus).toBe(400);
      expect(r.errorCode).toBe('INVALID_TRANSITION');
    });

    it('returns 403 FORBIDDEN for VIEWERS attempting any status transition', () => {
      const r = validatePhase5Transition('DRAFT', 'PENDING_REVIEW', 'VIEWER', false);
      expect(r.allowed).toBe(false);
      expect(r.httpStatus).toBe(403);
      expect(r.errorCode).toBe('FORBIDDEN');
    });

    it('returns 403 FORBIDDEN for MEMBER attempting to cancel an agreement they did not create', () => {
      const r = validatePhase5Transition('DRAFT', 'CANCELLED', 'MEMBER', false);
      expect(r.allowed).toBe(false);
      expect(r.httpStatus).toBe(403);
      expect(r.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('Lifecycle State Helpers', () => {
    it('isEditableStatus allows DRAFT and PENDING_REVIEW only', () => {
      expect(isEditableStatus('DRAFT')).toBe(true);
      expect(isEditableStatus('PENDING_REVIEW')).toBe(true);
      expect(isEditableStatus('SENT')).toBe(false);
      expect(isEditableStatus('AWAITING_SIGNATURES')).toBe(false);
      expect(isEditableStatus('COMPLETED')).toBe(false);
      expect(isEditableStatus('CANCELLED')).toBe(false);
    });

    it('canArchive allows terminal statuses and DRAFT only', () => {
      expect(canArchive('COMPLETED')).toBe(true);
      expect(canArchive('REJECTED')).toBe(true);
      expect(canArchive('CANCELLED')).toBe(true);
      expect(canArchive('EXPIRED')).toBe(true);
      expect(canArchive('DRAFT')).toBe(true);
      expect(canArchive('AWAITING_SIGNATURES')).toBe(false);
      expect(canArchive('SENT')).toBe(false);
      expect(canArchive('PENDING_REVIEW')).toBe(false);
    });

    it('canDelete allows DRAFT only', () => {
      expect(canDelete('DRAFT')).toBe(true);
      expect(canDelete('PENDING_REVIEW')).toBe(false);
      expect(canDelete('SENT')).toBe(false);
      expect(canDelete('COMPLETED')).toBe(false);
      expect(canDelete('CANCELLED')).toBe(false);
    });
  });
});
