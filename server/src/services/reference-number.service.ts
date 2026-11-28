/**
 * Agree2Met — Reference Number Generator Service
 *
 * Atomically generates sequential reference numbers in the format:
 * A2M-YYYY-NNNN (e.g. A2M-2026-0001)
 *
 * Utilizes PostgreSQL `INSERT ... ON CONFLICT (organization_id, year) DO UPDATE SET last_number = ... RETURNING`
 * guaranteeing race-free sequential counter allocation even under high concurrent load.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/db.js';

export class ReferenceNumberService {
  /**
   * Generates next reference number for an organization within the current calendar year.
   * Accepts an optional Prisma transaction client for atomic execution within an enclosing transaction.
   */
  public async getNextReferenceNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient
  ): Promise<string> {
    const client = tx || prisma;
    const year = new Date().getFullYear();

    // Raw SQL upsert with atomic counter increment and RETURNING clause
    const result = await client.$queryRaw<{ last_number: number }[]>`
      INSERT INTO organization_reference_counters (
        id,
        organization_id,
        year,
        last_number,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${organizationId}::uuid,
        ${year},
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (organization_id, year)
      DO UPDATE SET
        last_number = organization_reference_counters.last_number + 1,
        updated_at = CURRENT_TIMESTAMP
      RETURNING last_number;
    `;

    const lastNumber = result[0]?.last_number ?? 1;
    const padded = String(lastNumber).padStart(4, '0');

    return `A2M-${year}-${padded}`;
  }
}

export const referenceNumberService = new ReferenceNumberService();
