import argon2 from 'argon2';
import { COMMON_PASSWORDS } from '../constants/common-passwords.js';

// Pre-computed Argon2id dummy hash for anti-enumeration timing equality
let dummyHashCache: string | null = null;

async function getDummyHash(): Promise<string> {
  if (!dummyHashCache) {
    dummyHashCache = await argon2.hash('agree2met_dummy_password_timing_12345!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }
  return dummyHashCache;
}

/**
 * Hashes a password using Argon2id with OWASP-recommended parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Performs a dummy Argon2id verification against an invalid password
 * to maintain constant-time response behavior when a user is not found.
 */
export async function dummyPasswordVerify(): Promise<boolean> {
  try {
    const dummyHash = await getDummyHash();
    await argon2.verify(dummyHash, 'non_matching_dummy_attempt_12345!');
  } catch {
    // ignore
  }
  return false;
}

/**
 * Validates password strength:
 * - Minimum 10 characters
 * - Rejects commonly used / weak passwords
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 10) {
    return {
      valid: false,
      message: 'Password must be at least 10 characters long.',
    };
  }

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) {
    return {
      valid: false,
      message: 'This password is too common and easily guessed. Please choose a more secure password.',
    };
  }

  return { valid: true };
}
