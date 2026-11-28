import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

interface LockoutState {
  attempts: number;
  lockedUntil: number; // Unix timestamp in ms
}

/**
 * In-memory fallback map when Redis is not available
 */
const memoryStore = new Map<string, LockoutState>();

function getMemoryState(key: string): LockoutState {
  const existing = memoryStore.get(key);
  const now = Date.now();
  if (existing) {
    if (existing.lockedUntil > 0 && existing.lockedUntil <= now) {
      // Lock expired
      memoryStore.delete(key);
      return { attempts: 0, lockedUntil: 0 };
    }
    return existing;
  }
  return { attempts: 0, lockedUntil: 0 };
}

function setMemoryState(key: string, state: LockoutState, ttlMs: number): void {
  memoryStore.set(key, state);
  setTimeout(() => {
    const s = memoryStore.get(key);
    if (s && s.lockedUntil <= Date.now()) {
      memoryStore.delete(key);
    }
  }, ttlMs).unref?.();
}

/**
 * Service to manage login rate limiting and brute force lockouts.
 * Enforces lockout per (IP + email) pair plus an IP-level threshold to prevent
 * account enumeration and prevent malicious actors from locking out legitimate victims.
 */
export class LoginLockoutService {
  private readonly maxPairAttempts = 5;
  private readonly maxIpAttempts = 20;
  private readonly lockoutDurationSeconds = 15 * 60; // 15 minutes (900s)

  private normalizeKey(ip: string, email?: string): string {
    const cleanIp = (ip || '127.0.0.1').trim().toLowerCase();
    if (!email) return `lockout:ip:${cleanIp}`;
    const cleanEmail = email.trim().toLowerCase();
    return `lockout:pair:${cleanIp}:${cleanEmail}`;
  }

  /**
   * Check if the (IP + email) pair or the IP itself is currently locked.
   */
  public async isLocked(ip: string, email: string): Promise<{ locked: boolean; retryAfter: number }> {
    const pairKey = this.normalizeKey(ip, email);
    const ipKey = this.normalizeKey(ip);
    const now = Date.now();

    // 1. Try Redis
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const [pairTtl, ipTtl] = await Promise.all([
          redis.ttl(pairKey),
          redis.ttl(ipKey),
        ]);

        if (ipTtl > 0) {
          return { locked: true, retryAfter: ipTtl };
        }
        if (pairTtl > 0) {
          return { locked: true, retryAfter: pairTtl };
        }
        return { locked: false, retryAfter: 0 };
      }
    } catch (err) {
      logger.warn({ err }, 'Redis lockout lookup failed, falling back to in-memory store');
    }

    // 2. Fallback to in-memory store
    const ipState = getMemoryState(ipKey);
    if (ipState.lockedUntil > now) {
      return {
        locked: true,
        retryAfter: Math.ceil((ipState.lockedUntil - now) / 1000),
      };
    }

    const pairState = getMemoryState(pairKey);
    if (pairState.lockedUntil > now) {
      return {
        locked: true,
        retryAfter: Math.ceil((pairState.lockedUntil - now) / 1000),
      };
    }

    return { locked: false, retryAfter: 0 };
  }

  /**
   * Record a failed login attempt.
   * Increments attempt counters and locks if threshold is reached.
   */
  public async recordFailedAttempt(ip: string, email: string): Promise<{ locked: boolean; retryAfter: number }> {
    const pairKey = this.normalizeKey(ip, email);
    const attemptsKey = `attempts:pair:${(ip || '127.0.0.1').trim().toLowerCase()}:${email.trim().toLowerCase()}`;
    const ipAttemptsKey = `attempts:ip:${(ip || '127.0.0.1').trim().toLowerCase()}`;
    const ipLockKey = this.normalizeKey(ip);
    const now = Date.now();

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        // Increment attempts with 15m expiration
        const [pairAttempts, ipAttempts] = await Promise.all([
          redis.incr(attemptsKey),
          redis.incr(ipAttemptsKey),
        ]);

        if (pairAttempts === 1) {
          await redis.expire(attemptsKey, this.lockoutDurationSeconds);
        }
        if (ipAttempts === 1) {
          await redis.expire(ipAttemptsKey, this.lockoutDurationSeconds);
        }

        let locked = false;
        let retryAfter = 0;

        if (pairAttempts >= this.maxPairAttempts) {
          await redis.set(pairKey, 'locked', 'EX', this.lockoutDurationSeconds);
          locked = true;
          retryAfter = this.lockoutDurationSeconds;
        }

        if (ipAttempts >= this.maxIpAttempts) {
          await redis.set(ipLockKey, 'locked', 'EX', this.lockoutDurationSeconds);
          locked = true;
          retryAfter = this.lockoutDurationSeconds;
        }

        return { locked, retryAfter };
      }
    } catch (err) {
      logger.warn({ err }, 'Redis failed attempt increment failed, falling back to in-memory store');
    }

    // In-memory fallback
    const pairState = getMemoryState(pairKey);
    pairState.attempts += 1;
    let locked = false;
    let retryAfter = 0;

    if (pairState.attempts >= this.maxPairAttempts) {
      pairState.lockedUntil = now + this.lockoutDurationSeconds * 1000;
      locked = true;
      retryAfter = this.lockoutDurationSeconds;
    }
    setMemoryState(pairKey, pairState, this.lockoutDurationSeconds * 1000);

    const ipState = getMemoryState(ipLockKey);
    ipState.attempts += 1;
    if (ipState.attempts >= this.maxIpAttempts) {
      ipState.lockedUntil = now + this.lockoutDurationSeconds * 1000;
      locked = true;
      retryAfter = this.lockoutDurationSeconds;
    }
    setMemoryState(ipLockKey, ipState, this.lockoutDurationSeconds * 1000);

    return { locked, retryAfter };
  }

  /**
   * Reset failed attempts upon successful authentication.
   */
  public async resetAttempts(ip: string, email: string): Promise<void> {
    const pairKey = this.normalizeKey(ip, email);
    const attemptsKey = `attempts:pair:${(ip || '127.0.0.1').trim().toLowerCase()}:${email.trim().toLowerCase()}`;

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await Promise.all([
          redis.del(pairKey),
          redis.del(attemptsKey),
        ]);
        return;
      }
    } catch (err) {
      logger.warn({ err }, 'Redis reset failed attempts failed, clearing in-memory state');
    }

    memoryStore.delete(pairKey);
  }

  /**
   * Clear all lockout states (used in test setup / teardown).
   */
  public async clearAll(): Promise<void> {
    memoryStore.clear();
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const keys = await redis.keys('*lockout*');
        const attemptKeys = await redis.keys('*attempts*');
        const allKeys = [...keys, ...attemptKeys];
        if (allKeys.length > 0) {
          await redis.del(...allKeys);
        }
      }
    } catch {
      // ignore
    }
  }
}

export const loginLockoutService = new LoginLockoutService();
