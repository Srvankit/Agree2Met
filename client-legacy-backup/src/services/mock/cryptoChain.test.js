import { describe, it, expect } from 'vitest';
import {
  sha256Sync,
  computeAuditEventHash,
  verifyAuditChain,
} from './cryptoChain';

describe('Cryptographic Audit Chain Integrity', () => {
  describe('sha256Sync', () => {
    it('computes 64-character hex hash string', () => {
      const hash = sha256Sync('Agree2Met Digital Agreement Management');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('is deterministic', () => {
      const hash1 = sha256Sync('test payload');
      const hash2 = sha256Sync('test payload');
      expect(hash1).toBe(hash2);
    });

    it('exhibits avalanche effect on single character change', () => {
      const h1 = sha256Sync('Agreement v1.0.0');
      const h2 = sha256Sync('Agreement v1.0.1');
      expect(h1).not.toBe(h2);
    });
  });

  describe('verifyAuditChain', () => {
    const genesisPrev = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';

    it('validates a correct 3-event audit trail', () => {
      const event1 = {
        id: 'aud-1',
        agreementId: 'agr-101',
        actor: 'Alex Rivera',
        action: 'CREATED',
        details: 'Agreement created from template',
        timestamp: '2026-06-01T10:00:00Z',
        previousHash: genesisPrev,
      };
      event1.hash = computeAuditEventHash(event1, genesisPrev);

      const event2 = {
        id: 'aud-2',
        agreementId: 'agr-101',
        actor: 'Legal Admin',
        action: 'APPROVED',
        details: 'Approved for electronic signing',
        timestamp: '2026-06-01T12:00:00Z',
        previousHash: event1.hash,
      };
      event2.hash = computeAuditEventHash(event2, event1.hash);

      const event3 = {
        id: 'aud-3',
        agreementId: 'agr-101',
        actor: 'Signer Client',
        action: 'PARTY_SIGNED',
        details: 'Counterparty executed electronic signature',
        timestamp: '2026-06-01T14:00:00Z',
        previousHash: event2.hash,
      };
      event3.hash = computeAuditEventHash(event3, event2.hash);

      const chain = [event1, event2, event3];
      const result = verifyAuditChain(chain);

      expect(result.isValid).toBe(true);
      expect(result.verifiedCount).toBe(3);
      expect(result.brokenIndex).toBe(-1);
      expect(result.error).toBeNull();
    });

    it('detects previousHash mismatch (broken chain linkage)', () => {
      const event1 = {
        id: 'aud-1',
        agreementId: 'agr-102',
        actor: 'Alex Rivera',
        action: 'CREATED',
        details: 'Created',
        timestamp: '2026-06-01T10:00:00Z',
        previousHash: genesisPrev,
      };
      event1.hash = computeAuditEventHash(event1, genesisPrev);

      const event2 = {
        id: 'aud-2',
        agreementId: 'agr-102',
        actor: 'Attacker',
        action: 'TAMPERED_EVENT',
        details: 'Injected block with invalid previous hash',
        timestamp: '2026-06-01T11:00:00Z',
        previousHash: 'INVALID_PREV_HASH_1234567890abcdef1234567890abcdef',
      };
      event2.hash = computeAuditEventHash(event2, event2.previousHash);

      const result = verifyAuditChain([event1, event2]);
      expect(result.isValid).toBe(false);
      expect(result.brokenIndex).toBe(1);
      expect(result.error).toContain('previousHash mismatch');
    });

    it('detects altered payload content (tamper detection)', () => {
      const event1 = {
        id: 'aud-1',
        agreementId: 'agr-103',
        actor: 'Alex Rivera',
        action: 'CREATED',
        details: 'Created',
        timestamp: '2026-06-01T10:00:00Z',
        previousHash: genesisPrev,
      };
      event1.hash = computeAuditEventHash(event1, genesisPrev);

      // Now someone maliciously alters the actor or details without being able to fake the hash
      const tamperedEvent = {
        ...event1,
        details: 'Malicious modification of contract terms after signing',
      };

      const result = verifyAuditChain([tamperedEvent]);
      expect(result.isValid).toBe(false);
      expect(result.brokenIndex).toBe(0);
      expect(result.error).toContain('Tampered content');
    });
  });
});
