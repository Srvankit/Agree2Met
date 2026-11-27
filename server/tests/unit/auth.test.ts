import { describe, it, expect } from 'vitest';
import { validatePassword, hashPassword, verifyPassword } from '../../src/utils/password.util.js';
import { hashToken, generateRandomToken, signAccessToken, verifyAccessToken } from '../../src/utils/crypto.util.js';
import { hasMinimumRole, canManageMemberRole, Role } from '../../src/constants/permissions.js';

describe('Auth Security & Cryptography Utilities', () => {
  it('validates password strength rules', () => {
    // Too short (< 10 chars)
    expect(validatePassword('short').valid).toBe(false);
    expect(validatePassword('pass123').valid).toBe(false);

    // Common password in blacklist
    expect(validatePassword('1234567890').valid).toBe(false);
    expect(validatePassword('password123').valid).toBe(false);
    expect(validatePassword('agree2met123').valid).toBe(false);

    // Valid strong password
    expect(validatePassword('Complex#Password$2026').valid).toBe(true);
    expect(validatePassword('SuperSecureStr0ngPassphrase!').valid).toBe(true);
  });

  it('hashes and verifies passwords using Argon2id', async () => {
    const password = 'CorrectHorseBatteryStaple!2026';
    const hash = await hashPassword(password);

    expect(hash).toContain('$argon2id$');
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, 'wrong_password_attempt')).toBe(false);
  });

  it('computes consistent deterministic SHA-256 token hashes', () => {
    const token = 'sample-random-token-value-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
    expect(hash1).not.toBe(token);
  });

  it('generates high-entropy random tokens', () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('signs and verifies short-lived JWT access tokens', () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'alex@agree2met.com',
      sessionId: '22222222-2222-2222-2222-222222222222',
    };

    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.sessionId).toBe(payload.sessionId);
  });

  it('enforces RBAC hierarchy and member management rules', () => {
    expect(hasMinimumRole('OWNER', 'VIEWER')).toBe(true);
    expect(hasMinimumRole('ADMIN', 'MEMBER')).toBe(true);
    expect(hasMinimumRole('MEMBER', 'ADMIN')).toBe(false);
    expect(hasMinimumRole('VIEWER', 'OWNER')).toBe(false);

    // OWNER can manage any role
    expect(canManageMemberRole('OWNER', 'ADMIN', 'MEMBER')).toBe(true);
    expect(canManageMemberRole('OWNER', 'MEMBER', 'ADMIN')).toBe(true);

    // ADMIN can manage MEMBER and VIEWER, but cannot modify or assign OWNER or ADMIN
    expect(canManageMemberRole('ADMIN', 'MEMBER', 'VIEWER')).toBe(true);
    expect(canManageMemberRole('ADMIN', 'OWNER', 'MEMBER')).toBe(false);
    expect(canManageMemberRole('ADMIN', 'ADMIN', 'MEMBER')).toBe(false);
    expect(canManageMemberRole('ADMIN', 'MEMBER', 'OWNER')).toBe(false);
    expect(canManageMemberRole('ADMIN', 'MEMBER', 'ADMIN')).toBe(false);

    // MEMBER and VIEWER cannot manage roles
    expect(canManageMemberRole('MEMBER', 'VIEWER')).toBe(false);
    expect(canManageMemberRole('VIEWER', 'VIEWER')).toBe(false);
  });
});
