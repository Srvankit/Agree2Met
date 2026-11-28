import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

export const GENESIS_HASH = '0'.repeat(64);

export interface CreateAuditEventInput {
  agreementId: string;
  eventType: string;
  actorType: 'USER' | 'COUNTERPARTY' | 'SYSTEM' | string;
  actorId?: string | null;
  actorName: string;
  actorEmail: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  payload?: Record<string, any>;
  createdAt?: Date;
}

export interface AuditChainVerificationResult {
  isValid: boolean;
  eventCount: number;
  tamperedEventId?: string;
  reason?: string;
}

/**
 * Deterministically serialize any JavaScript value so SHA-256 output is reproducible.
 * Object keys are sorted alphabetically at every nesting level.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((key) => JSON.stringify(key) + ':' + canonicalStringify(obj[key])).join(',') + '}';
}

/**
 * Computes canonical SHA-256 hash for an audit event entry.
 */
export function computeEventHash(params: {
  agreementId: string;
  seq: number;
  createdAt: string; // ISO string
  eventType: string;
  actorType: string;
  actorId: string | null;
  actorEmail: string;
  payload: any;
  previousHash: string;
}): string {
  const canonicalData = canonicalStringify({
    actorEmail: params.actorEmail,
    actorId: params.actorId ?? null,
    actorType: params.actorType,
    agreementId: params.agreementId,
    createdAt: params.createdAt,
    eventType: params.eventType,
    payload: params.payload ?? {},
    previousHash: params.previousHash,
    seq: params.seq,
  });
  return crypto.createHash('sha256').update(canonicalData, 'utf8').digest('hex');
}

export class AuditService {
  /**
   * Appends a new audit event to an agreement's hash chain.
   * Acquires an exclusive row-level lock on the agreement to prevent concurrent fork races.
   */
  public async createEvent(
    input: CreateAuditEventInput,
    externalTx?: any
  ) {
    if (externalTx) {
      return this.appendEventInternal(externalTx, input);
    }

    return prisma.$transaction(async (tx) => {
      return this.appendEventInternal(tx, input);
    });
  }

  private async appendEventInternal(tx: any, input: CreateAuditEventInput) {
    // Acquire row-level lock on the agreement to serialize audit trail appends
    await tx.$queryRaw`SELECT id FROM agreements WHERE id = ${input.agreementId}::uuid FOR UPDATE`;

    // Find the current tail of the hash chain for this agreement
    const lastEvent = await tx.auditEvent.findFirst({
      where: { agreementId: input.agreementId },
      orderBy: { seq: 'desc' },
    });

    const seq = lastEvent ? lastEvent.seq + 1 : 1;
    const previousEventHash = lastEvent ? lastEvent.eventHash : GENESIS_HASH;
    // Real event timestamp (monotonic timestamp offset removed in Phase 5 in favor of seq ordering)
    const createdAt = input.createdAt || new Date();

    const eventHash = computeEventHash({
      agreementId: input.agreementId,
      seq,
      createdAt: createdAt.toISOString(),
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail,
      payload: input.payload || {},
      previousHash: previousEventHash,
    });

    const event = await tx.auditEvent.create({
      data: {
        agreementId: input.agreementId,
        seq,
        eventType: input.eventType,
        actorType: input.actorType,
        actorId: input.actorId || null,
        actorName: input.actorName,
        actorEmail: input.actorEmail,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        payload: input.payload || {},
        previousEventHash,
        eventHash,
        createdAt,
      },
    });

    logger.debug(
      {
        agreementId: input.agreementId,
        eventId: event.id,
        seq,
        eventType: input.eventType,
        eventHash,
        previousEventHash,
      },
      'Appended audit event to chain'
    );

    return event;
  }

  /**
   * Cryptographically verifies the integrity of an agreement's audit chain from genesis to tail.
   */
  public async verifyChain(agreementId: string): Promise<AuditChainVerificationResult> {
    const events = await prisma.auditEvent.findMany({
      where: { agreementId },
      orderBy: { seq: 'asc' },
    });

    if (events.length === 0) {
      return { isValid: true, eventCount: 0 };
    }

    for (let i = 0; i < events.length; i++) {
      const current = events[i];
      const expectedSeq = i + 1;

      if (current.seq !== expectedSeq) {
        return {
          isValid: false,
          eventCount: events.length,
          tamperedEventId: current.id,
          reason: `Sequence discontinuity at index ${i}: expected seq ${expectedSeq}, got ${current.seq}`,
        };
      }

      const expectedPrevHash = i === 0 ? GENESIS_HASH : events[i - 1].eventHash;

      if (current.previousEventHash !== expectedPrevHash) {
        return {
          isValid: false,
          eventCount: events.length,
          tamperedEventId: current.id,
          reason:
            i === 0
              ? `Genesis hash mismatch. Expected ${GENESIS_HASH}, got ${current.previousEventHash}`
              : `Broken hash link at index ${i}. Expected ${expectedPrevHash}, got ${current.previousEventHash}`,
        };
      }

      const expectedHash = computeEventHash({
        agreementId: current.agreementId,
        seq: current.seq,
        createdAt: current.createdAt.toISOString(),
        eventType: current.eventType,
        actorType: current.actorType,
        actorId: current.actorId,
        actorEmail: current.actorEmail,
        payload: current.payload,
        previousHash: current.previousEventHash,
      });

      if (current.eventHash !== expectedHash) {
        return {
          isValid: false,
          eventCount: events.length,
          tamperedEventId: current.id,
          reason: `Payload or metadata hash mismatch at event ${current.id}`,
        };
      }
    }

    return {
      isValid: true,
      eventCount: events.length,
    };
  }

  /**
   * Retrieves the full audit trail for an agreement along with its cryptographic verification status.
   */
  public async getAuditTrail(agreementId: string) {
    const verification = await this.verifyChain(agreementId);
    const events = await prisma.auditEvent.findMany({
      where: { agreementId },
      orderBy: { seq: 'asc' },
    });

    return {
      events,
      verification,
    };
  }
}

export const auditService = new AuditService();
