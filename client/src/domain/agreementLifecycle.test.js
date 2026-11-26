import { describe, it, expect } from 'vitest';
import {
  AGREEMENT_STATUSES,
  STATUS_META,
  isValidTransition,
  canUserPerformAction,
  getAvailableNextStatuses,
} from './agreementLifecycle';

describe('Agreement Lifecycle State Machine', () => {
  it('defines all 12 canonical agreement lifecycle statuses', () => {
    const statuses = Object.values(AGREEMENT_STATUSES);
    expect(statuses).toHaveLength(12);
    expect(statuses).toContain('draft');
    expect(statuses).toContain('in_review');
    expect(statuses).toContain('approved');
    expect(statuses).toContain('awaiting_signatures');
    expect(statuses).toContain('partially_signed');
    expect(statuses).toContain('signed');
    expect(statuses).toContain('active');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('expired');
    expect(statuses).toContain('terminated');
    expect(statuses).toContain('disputed');
    expect(statuses).toContain('cancelled');
  });

  it('provides metadata for every status', () => {
    Object.values(AGREEMENT_STATUSES).forEach((status) => {
      const meta = STATUS_META[status];
      expect(meta).toBeDefined();
      expect(meta.label).toBeDefined();
      expect(typeof meta.terminal).toBe('boolean');
    });
  });

  describe('isValidTransition', () => {
    it('allows valid forward drafting transitions', () => {
      expect(isValidTransition('draft', 'in_review')).toBe(true);
      expect(isValidTransition('in_review', 'approved')).toBe(true);
      expect(isValidTransition('approved', 'awaiting_signatures')).toBe(true);
    });

    it('allows signing lifecycle progression', () => {
      expect(isValidTransition('awaiting_signatures', 'partially_signed')).toBe(true);
      expect(isValidTransition('partially_signed', 'signed')).toBe(true);
      expect(isValidTransition('awaiting_signatures', 'signed')).toBe(true);
      expect(isValidTransition('signed', 'active')).toBe(true);
    });

    it('allows dispute and termination transitions', () => {
      expect(isValidTransition('active', 'disputed')).toBe(true);
      expect(isValidTransition('disputed', 'active')).toBe(true);
      expect(isValidTransition('active', 'terminated')).toBe(true);
    });

    it('blocks invalid or backwards transitions', () => {
      expect(isValidTransition('draft', 'signed')).toBe(false);
      expect(isValidTransition('draft', 'active')).toBe(false);
      expect(isValidTransition('completed', 'draft')).toBe(false);
      expect(isValidTransition('terminated', 'in_review')).toBe(false);
      expect(isValidTransition('cancelled', 'signed')).toBe(false);
    });
  });

  describe('canUserPerformAction', () => {
    it('allows OWNER all actions', () => {
      expect(canUserPerformAction('OWNER', 'any_arbitrary_action')).toBe(true);
      expect(canUserPerformAction('OWNER', 'terminate')).toBe(true);
    });

    it('enforces ADMIN permissions', () => {
      expect(canUserPerformAction('ADMIN', 'create')).toBe(true);
      expect(canUserPerformAction('ADMIN', 'approve')).toBe(true);
      expect(canUserPerformAction('ADMIN', 'terminate')).toBe(true);
    });

    it('restricts MEMBER permissions', () => {
      expect(canUserPerformAction('MEMBER', 'create')).toBe(true);
      expect(canUserPerformAction('MEMBER', 'approve')).toBe(false);
      expect(canUserPerformAction('MEMBER', 'terminate')).toBe(false);
    });

    it('restricts VIEWER permissions to read-only', () => {
      expect(canUserPerformAction('VIEWER', 'view')).toBe(true);
      expect(canUserPerformAction('VIEWER', 'download')).toBe(true);
      expect(canUserPerformAction('VIEWER', 'create')).toBe(false);
      expect(canUserPerformAction('VIEWER', 'edit')).toBe(false);
    });
  });

  describe('getAvailableNextStatuses', () => {
    it('returns available transitions for active status', () => {
      const next = getAvailableNextStatuses('active', 'ADMIN');
      expect(next).toContain('completed');
      expect(next).toContain('expired');
      expect(next).toContain('terminated');
      expect(next).toContain('disputed');
    });

    it('returns empty array for VIEWER role', () => {
      const next = getAvailableNextStatuses('active', 'VIEWER');
      expect(next).toEqual([]);
    });
  });
});
