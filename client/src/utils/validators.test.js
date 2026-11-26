import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validatePassword,
  isRequired,
  isPositiveNumber,
  isDateOrderValid,
  formatCurrency,
  formatDate,
  formatRelativeTime,
} from './validators';

describe('Validators & Formatters', () => {
  describe('isValidEmail', () => {
    it('validates normal email formats', () => {
      expect(isValidEmail('alex@example.com')).toBe(true);
      expect(isValidEmail('legal.counsel@sub.company.org')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('missing@dot')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong password with all criteria', () => {
      const res = validatePassword('Pass1234!@#');
      expect(res.isValid).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(3);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = validatePassword('P1!a');
      expect(res.isValid).toBe(false);
      expect(res.checks.length).toBe(false);
    });

    it('handles empty or null password', () => {
      const res = validatePassword('');
      expect(res.isValid).toBe(false);
      expect(res.score).toBe(0);
    });
  });

  describe('isRequired', () => {
    it('returns true for non-empty values', () => {
      expect(isRequired('Agreement')).toBe(true);
      expect(isRequired(['one'])).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
    });

    it('returns false for null, undefined, or empty whitespace', () => {
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
      expect(isRequired([])).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('identifies positive numbers', () => {
      expect(isPositiveNumber(100)).toBe(true);
      expect(isPositiveNumber('45.50')).toBe(true);
    });

    it('rejects negative, zero, or non-numeric values', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-10)).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
    });
  });

  describe('isDateOrderValid', () => {
    it('returns true when start date is before or equal to end date', () => {
      expect(isDateOrderValid('2026-01-01', '2026-12-31')).toBe(true);
      expect(isDateOrderValid('2026-06-01', '2026-06-01')).toBe(true);
    });

    it('returns false when start date is after end date', () => {
      expect(isDateOrderValid('2026-12-31', '2026-01-01')).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD values accurately', () => {
      expect(formatCurrency(150000)).toContain('150,000');
      expect(formatCurrency(0)).toBe('$0');
    });
  });

  describe('formatDate', () => {
    it('formats ISO dates nicely', () => {
      const formatted = formatDate('2026-06-15T00:00:00Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Jun');
    });

    it('returns fallback for empty date', () => {
      expect(formatDate(null)).toBe('—');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats recent timestamps', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('formats hours and days correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toContain('h ago');
    });
  });
});
