import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { auditService, canonicalStringify } from './audit.service.js';
import { referenceNumberService } from './reference-number.service.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { AppError, ConflictError, NotFoundError, BadRequestError, ForbiddenError } from '../errors/app-error.js';
import {
  canTransition,
  validatePhase5Transition,
  isEditableStatus,
  canArchive,
  canDelete,
  AgreementStatus,
} from '../domain/lifecycle.js';
import {
  ListAgreementsQuery,
  CreateAgreementDraftInput,
  UpdateAgreementInput,
  AutosaveAgreementInput,
  finalizeAgreementSchema,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateCategoryClauseInput,
} from '../validators/agreement.validator.js';

export class AgreementService {
  /**
   * Constructs canonical snapshot payload for agreement versioning.
   */
  private createSnapshotPayload(agreement: any) {
    return {
      title: agreement.title,
      description: agreement.description || null,
      categoryId: agreement.categoryId,
      signingOrder: agreement.signingOrder,
      effectiveDate: agreement.effectiveDate
        ? (typeof agreement.effectiveDate === 'string'
            ? agreement.effectiveDate
            : agreement.effectiveDate.toISOString().split('T')[0])
        : null,
      expirationDate: agreement.expirationDate
        ? (typeof agreement.expirationDate === 'string'
            ? agreement.expirationDate
            : agreement.expirationDate.toISOString().split('T')[0])
        : null,
      parties: (agreement.parties || []).map((p: any) => ({
        name: p.name,
        companyName: p.companyName || null,
        email: p.email,
        phone: p.phone || null,
        role: p.role || 'SIGNER',
        partyType: p.partyType || 'COUNTERPARTY',
        signingSequence: p.signingSequence || 1,
      })),
      clauses: (agreement.clauses || []).map((c: any) => ({
        sectionNumber: c.sectionNumber || '1.0',
        title: c.title,
        content: c.content,
        isStandardClause: c.isStandardClause ?? true,
        isMandatory: c.isMandatory ?? true,
        displayOrder: c.displayOrder,
      })),
      paymentTerms: agreement.paymentTerms
        ? {
            totalAmount: agreement.paymentTerms.totalAmount != null ? Number(agreement.paymentTerms.totalAmount) : null,
            currency: agreement.paymentTerms.currency || 'USD',
            paymentSchedule: agreement.paymentTerms.paymentSchedule || 'MILESTONE',
            billingNotes: agreement.paymentTerms.billingNotes || null,
            milestones: agreement.paymentTerms.milestones || [],
          }
        : null,
    };
  }

  /**
   * Helper to persist an agreement version snapshot.
   */
  private async recordVersionSnapshot(
    tx: Prisma.TransactionClient,
    agreementId: string,
    userId: string,
    snapshotData: any,
    changeSummary: string = 'Version snapshot'
  ) {
    const payload = this.createSnapshotPayload(snapshotData);
    const contentHash = crypto.createHash('sha256').update(canonicalStringify(payload)).digest('hex');

    // Get next version number
    const lastVersion = await tx.agreementVersion.findFirst({
      where: { agreementId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    return tx.agreementVersion.create({
      data: {
        agreementId,
        versionNumber,
        content: payload,
        contentHash,
        createdBy: userId,
        changeSummary,
      },
    });
  }

  // =========================================================================
  // AGREEMENT QUERIES
  // =========================================================================

  /**
   * Lists active (non-soft-deleted) agreements for an organization.
   */
  public async listAgreements(organizationId: string, query: ListAgreementsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
      isArchived: false,
    };

    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim().toUpperCase());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { referenceNumber: { contains: term, mode: 'insensitive' } },
        {
          parties: {
            some: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { companyName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const orderBy: any = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [total, agreements] = await Promise.all([
      prisma.agreement.count({ where }),
      prisma.agreement.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
          parties: {
            select: {
              id: true,
              name: true,
              companyName: true,
              email: true,
              role: true,
              status: true,
              signingSequence: true,
              signedAt: true,
            },
            orderBy: { signingSequence: 'asc' },
          },
          paymentTerms: {
            select: {
              totalAmount: true,
              currency: true,
              paymentSchedule: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: agreements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single agreement by ID with all parties, clauses, payment terms, and cryptographic audit trail.
   */
  public async getAgreementById(organizationId: string, agreementId: string) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        category: true,
        parties: {
          orderBy: { signingSequence: 'asc' },
        },
        clauses: {
          orderBy: { displayOrder: 'asc' },
        },
        paymentTerms: true,
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!agreement || agreement.organizationId !== organizationId || agreement.deletedAt !== null) {
      return null;
    }

    // Attach verified cryptographic audit trail
    const auditTrail = await auditService.getAuditTrail(agreementId);

    // Get count of historical versions
    const versionCount = await prisma.agreementVersion.count({
      where: { agreementId },
    });

    return {
      ...agreement,
      versionCount,
      auditTrail,
    };
  }

  // =========================================================================
  // AGREEMENT MUTATIONS
  // =========================================================================

  /**
   * Creates a new agreement draft with atomic reference numbering, initial version v1,
   * audit trail genesis event, and idempotency handling.
   */
  public async createAgreement(
    organizationId: string,
    userId: string,
    actorName: string,
    actorEmail: string,
    data: CreateAgreementDraftInput,
    idempotencyKey?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const requestPayload = { body: data, organizationId };
      const requestHash = crypto.createHash('sha256').update(canonicalStringify(requestPayload)).digest('hex');

      const existingRecord = await prisma.idempotencyKey.findUnique({
        where: { uq_org_idempotency_key: { organizationId, key: idempotencyKey } },
      });

      if (existingRecord) {
        if (existingRecord.expiresAt < new Date()) {
          // Key expired, delete it and continue
          await prisma.idempotencyKey.delete({ where: { id: existingRecord.id } });
        } else if (existingRecord.requestHash === requestHash) {
          // Replay cached response
          return {
            agreement: existingRecord.responseBody,
            isReplay: true,
            status: existingRecord.responseStatus,
          };
        } else {
          // Key reused with differing payload -> 422 Conflict
          throw new AppError(
            'Idempotency key has already been used with a different request payload.',
            422,
            'IDEMPOTENCY_CONFLICT'
          );
        }
      }
    }

    // 2. Resolve Category (fallback to first system default if not provided)
    let categoryId = data.categoryId;
    if (!categoryId) {
      const defaultCat = await prisma.agreementCategory.findFirst({
        where: { OR: [{ organizationId: null }, { organizationId }] },
        orderBy: [{ isSystemDefault: 'desc' }, { createdAt: 'asc' }],
        select: { id: true },
      });
      if (!defaultCat) {
        throw new NotFoundError('No agreement categories found.');
      }
      categoryId = defaultCat.id;
    }

    // 3. Sanitize clause content
    const sanitizedClauses = (data.clauses || []).map((c, index) => ({
      sectionNumber: c.sectionNumber || `${index + 1}.0`,
      title: c.title.trim(),
      content: sanitizeHtml(c.content),
      isStandardClause: c.isStandardClause ?? true,
      isMandatory: c.isMandatory ?? true,
      displayOrder: c.displayOrder || index + 1,
    }));

    // 4. Atomic Transaction for Agreement Creation
    const created = await prisma.$transaction(async (tx) => {
      // Generate sequential reference number
      const referenceNumber = await referenceNumberService.getNextReferenceNumber(organizationId, tx);

      // Create agreement record
      const agreement = await tx.agreement.create({
        data: {
          referenceNumber,
          organizationId,
          creatorId: userId,
          categoryId,
          title: data.title.trim(),
          description: data.description ? data.description.trim() : null,
          status: 'DRAFT',
          signingOrder: data.signingOrder || 'PARALLEL',
          totalSignersCount: (data.parties || []).filter((p) => p.role === 'SIGNER').length,
          completedSignersCount: 0,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
          rowVersion: 1,
        },
      });

      // Create parties
      if (data.parties && data.parties.length > 0) {
        await tx.agreementParty.createMany({
          data: data.parties.map((p, idx) => ({
            agreementId: agreement.id,
            name: p.name.trim(),
            companyName: p.companyName ? p.companyName.trim() : null,
            email: p.email.trim().toLowerCase(),
            phone: p.phone ? p.phone.trim() : null,
            role: p.role || 'SIGNER',
            partyType: p.partyType || 'COUNTERPARTY',
            signingSequence: p.signingSequence || idx + 1,
            status: 'PENDING',
          })),
        });
      }

      // Create clauses
      if (sanitizedClauses.length > 0) {
        await tx.agreementClause.createMany({
          data: sanitizedClauses.map((c) => ({
            agreementId: agreement.id,
            sectionNumber: c.sectionNumber,
            title: c.title,
            content: c.content,
            isStandardClause: c.isStandardClause,
            isMandatory: c.isMandatory,
            displayOrder: c.displayOrder,
          })),
        });
      }

      // Create payment terms
      if (data.paymentTerms) {
        await tx.agreementPaymentTerm.create({
          data: {
            agreementId: agreement.id,
            totalAmount: data.paymentTerms.totalAmount != null ? new Prisma.Decimal(data.paymentTerms.totalAmount) : null,
            currency: data.paymentTerms.currency || 'USD',
            paymentSchedule: data.paymentTerms.paymentSchedule || 'MILESTONE',
            billingNotes: data.paymentTerms.billingNotes ? data.paymentTerms.billingNotes.trim() : null,
            milestones: data.paymentTerms.milestones || [],
          },
        });
      }

      // Fetch complete agreement for version snapshot
      const fullAgreement = await tx.agreement.findUnique({
        where: { id: agreement.id },
        include: {
          parties: { orderBy: { signingSequence: 'asc' } },
          clauses: { orderBy: { displayOrder: 'asc' } },
          paymentTerms: true,
          category: true,
        },
      });

      // Write Version 1 snapshot
      await this.recordVersionSnapshot(
        tx,
        agreement.id,
        userId,
        fullAgreement,
        data.changeSummary || 'Initial draft created'
      );

      // Create initial chained audit event
      await auditService.createEvent(
        {
          agreementId: agreement.id,
          eventType: 'AGREEMENT_CREATED',
          actorType: 'USER',
          actorId: userId,
          actorName,
          actorEmail,
          ipAddress,
          userAgent,
          payload: {
            referenceNumber,
            title: agreement.title,
            status: 'DRAFT',
            totalSigners: fullAgreement?.parties.filter((p) => p.role === 'SIGNER').length || 0,
          },
        },
        tx
      );

      // Operational activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          action: 'CREATE_AGREEMENT',
          entityType: 'AGREEMENT',
          entityId: agreement.id,
          ipAddress,
          metadata: { referenceNumber, title: agreement.title },
        },
      });

      // Save idempotency key if requested (TTL: 24h)
      if (idempotencyKey) {
        const requestPayload = { body: data, organizationId };
        const requestHash = crypto.createHash('sha256').update(canonicalStringify(requestPayload)).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            organizationId,
            userId,
            requestHash,
            responseStatus: 201,
            responseBody: fullAgreement as any,
            expiresAt,
          },
        });
      }

      return fullAgreement;
    });

    return { agreement: created, isReplay: false, status: 201 };
  }

  /**
   * Explicit full update of an agreement draft (PUT /agreements/:id).
   * Enforces optimistic locking via `expectedRowVersion`.
   * Automatically creates a new version snapshot and audit event.
   */
  public async updateAgreement(
    organizationId: string,
    userId: string,
    actorName: string,
    actorEmail: string,
    agreementId: string,
    data: UpdateAgreementInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        parties: true,
        clauses: true,
        paymentTerms: true,
      },
    });

    if (!existing || existing.organizationId !== organizationId || existing.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    if (!isEditableStatus(existing.status as AgreementStatus)) {
      throw new BadRequestError(`Agreements in status '${existing.status}' cannot be modified.`);
    }

    // Optimistic locking conflict check
    if (existing.rowVersion !== data.expectedRowVersion) {
      throw new AppError(
        'This agreement was modified by another session or user. Please reload the latest changes before saving.',
        409,
        'VERSION_CONFLICT',
        [{ currentVersion: existing.rowVersion, serverAgreement: existing }]
      );
    }

    // Sanitize clauses
    const sanitizedClauses = (data.clauses || []).map((c, index) => ({
      sectionNumber: c.sectionNumber || `${index + 1}.0`,
      title: c.title.trim(),
      content: sanitizeHtml(c.content),
      isStandardClause: c.isStandardClause ?? true,
      isMandatory: c.isMandatory ?? true,
      displayOrder: c.displayOrder || index + 1,
    }));

    return prisma.$transaction(async (tx) => {
      const nextVersion = existing.rowVersion + 1;

      // Update agreement core fields
      await tx.agreement.update({
        where: { id: agreementId },
        data: {
          title: data.title.trim(),
          description: data.description ? data.description.trim() : null,
          categoryId: data.categoryId || existing.categoryId,
          signingOrder: data.signingOrder || existing.signingOrder,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
          totalSignersCount: (data.parties || []).filter((p) => p.role === 'SIGNER').length,
          rowVersion: nextVersion,
        },
      });

      // Replace parties
      await tx.agreementParty.deleteMany({ where: { agreementId } });
      if (data.parties && data.parties.length > 0) {
        await tx.agreementParty.createMany({
          data: data.parties.map((p, idx) => ({
            agreementId,
            name: p.name.trim(),
            companyName: p.companyName ? p.companyName.trim() : null,
            email: p.email.trim().toLowerCase(),
            phone: p.phone ? p.phone.trim() : null,
            role: p.role || 'SIGNER',
            partyType: p.partyType || 'COUNTERPARTY',
            signingSequence: p.signingSequence || idx + 1,
            status: 'PENDING',
          })),
        });
      }

      // Replace clauses
      await tx.agreementClause.deleteMany({ where: { agreementId } });
      if (sanitizedClauses.length > 0) {
        await tx.agreementClause.createMany({
          data: sanitizedClauses.map((c) => ({
            agreementId,
            sectionNumber: c.sectionNumber,
            title: c.title,
            content: c.content,
            isStandardClause: c.isStandardClause,
            isMandatory: c.isMandatory,
            displayOrder: c.displayOrder,
          })),
        });
      }

      // Upsert payment terms
      if (data.paymentTerms) {
        await tx.agreementPaymentTerm.upsert({
          where: { agreementId },
          update: {
            totalAmount: data.paymentTerms.totalAmount != null ? new Prisma.Decimal(data.paymentTerms.totalAmount) : null,
            currency: data.paymentTerms.currency || 'USD',
            paymentSchedule: data.paymentTerms.paymentSchedule || 'MILESTONE',
            billingNotes: data.paymentTerms.billingNotes ? data.paymentTerms.billingNotes.trim() : null,
            milestones: data.paymentTerms.milestones || [],
          },
          create: {
            agreementId,
            totalAmount: data.paymentTerms.totalAmount != null ? new Prisma.Decimal(data.paymentTerms.totalAmount) : null,
            currency: data.paymentTerms.currency || 'USD',
            paymentSchedule: data.paymentTerms.paymentSchedule || 'MILESTONE',
            billingNotes: data.paymentTerms.billingNotes ? data.paymentTerms.billingNotes.trim() : null,
            milestones: data.paymentTerms.milestones || [],
          },
        });
      } else {
        await tx.agreementPaymentTerm.deleteMany({ where: { agreementId } });
      }

      // Fetch fresh updated agreement
      const updatedAgreement = await tx.agreement.findUnique({
        where: { id: agreementId },
        include: {
          parties: { orderBy: { signingSequence: 'asc' } },
          clauses: { orderBy: { displayOrder: 'asc' } },
          paymentTerms: true,
          category: true,
        },
      });

      // Create new Version snapshot
      await this.recordVersionSnapshot(
        tx,
        agreementId,
        userId,
        updatedAgreement,
        data.changeSummary || `Version ${nextVersion} saved`
      );

      // Audit event
      await auditService.createEvent(
        {
          agreementId,
          eventType: 'AGREEMENT_UPDATED',
          actorType: 'USER',
          actorId: userId,
          actorName,
          actorEmail,
          ipAddress,
          userAgent,
          payload: {
            version: nextVersion,
            title: updatedAgreement?.title,
            summary: data.changeSummary || 'Draft updated',
          },
        },
        tx
      );

      // Operational activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          action: 'UPDATE_AGREEMENT',
          entityType: 'AGREEMENT',
          entityId: agreementId,
          ipAddress,
          metadata: { referenceNumber: existing.referenceNumber, version: nextVersion },
        },
      });

      return updatedAgreement;
    });
  }

  /**
   * Lightweight autosave (PATCH /agreements/:id/autosave).
   * Checks `expectedRowVersion`, updates draft fields and increments `rowVersion`.
   * Does NOT create an `agreement_versions` snapshot (reserved for explicit saves/status transitions).
   */
  public async autosaveAgreement(
    organizationId: string,
    agreementId: string,
    data: AutosaveAgreementInput
  ) {
    const existing = await prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        id: true,
        organizationId: true,
        status: true,
        rowVersion: true,
        deletedAt: true,
      },
    });

    if (!existing || existing.organizationId !== organizationId || existing.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    if (!isEditableStatus(existing.status as AgreementStatus)) {
      throw new BadRequestError(`Agreements in status '${existing.status}' cannot be autosaved.`);
    }

    if (existing.rowVersion !== data.expectedRowVersion) {
      throw new AppError(
        'Version conflict detected during autosave. The document was updated elsewhere.',
        409,
        'VERSION_CONFLICT',
        [{ currentVersion: existing.rowVersion }]
      );
    }

    const nextRowVersion = existing.rowVersion + 1;

    await prisma.$transaction(async (tx) => {
      // Core fields update
      const updateData: any = {
        rowVersion: nextRowVersion,
      };
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.signingOrder !== undefined) updateData.signingOrder = data.signingOrder;
      if (data.effectiveDate !== undefined) updateData.effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : null;
      if (data.expirationDate !== undefined) updateData.expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;
      if (data.parties !== undefined) {
        updateData.totalSignersCount = data.parties.filter((p) => p.role === 'SIGNER').length;
      }

      await tx.agreement.update({
        where: { id: agreementId },
        data: updateData,
      });

      // Parties replacement if present
      if (data.parties !== undefined) {
        await tx.agreementParty.deleteMany({ where: { agreementId } });
        if (data.parties.length > 0) {
          await tx.agreementParty.createMany({
            data: data.parties.map((p, idx) => ({
              agreementId,
              name: p.name.trim(),
              companyName: p.companyName ? p.companyName.trim() : null,
              email: p.email.trim().toLowerCase(),
              phone: p.phone ? p.phone.trim() : null,
              role: p.role || 'SIGNER',
              partyType: p.partyType || 'COUNTERPARTY',
              signingSequence: p.signingSequence || idx + 1,
              status: 'PENDING',
            })),
          });
        }
      }

      // Clauses replacement if present
      if (data.clauses !== undefined) {
        const sanitizedClauses = data.clauses.map((c, index) => ({
          sectionNumber: c.sectionNumber || `${index + 1}.0`,
          title: c.title.trim(),
          content: sanitizeHtml(c.content),
          isStandardClause: c.isStandardClause ?? true,
          isMandatory: c.isMandatory ?? true,
          displayOrder: c.displayOrder || index + 1,
        }));

        await tx.agreementClause.deleteMany({ where: { agreementId } });
        if (sanitizedClauses.length > 0) {
          await tx.agreementClause.createMany({
            data: sanitizedClauses.map((c) => ({
              agreementId,
              sectionNumber: c.sectionNumber,
              title: c.title,
              content: c.content,
              isStandardClause: c.isStandardClause,
              isMandatory: c.isMandatory,
              displayOrder: c.displayOrder,
            })),
          });
        }
      }

      // Payment terms update if present
      if (data.paymentTerms !== undefined) {
        if (data.paymentTerms) {
          await tx.agreementPaymentTerm.upsert({
            where: { agreementId },
            update: {
              totalAmount: data.paymentTerms.totalAmount != null ? new Prisma.Decimal(data.paymentTerms.totalAmount) : null,
              currency: data.paymentTerms.currency || 'USD',
              paymentSchedule: data.paymentTerms.paymentSchedule || 'MILESTONE',
              billingNotes: data.paymentTerms.billingNotes ? data.paymentTerms.billingNotes.trim() : null,
              milestones: data.paymentTerms.milestones || [],
            },
            create: {
              agreementId,
              totalAmount: data.paymentTerms.totalAmount != null ? new Prisma.Decimal(data.paymentTerms.totalAmount) : null,
              currency: data.paymentTerms.currency || 'USD',
              paymentSchedule: data.paymentTerms.paymentSchedule || 'MILESTONE',
              billingNotes: data.paymentTerms.billingNotes ? data.paymentTerms.billingNotes.trim() : null,
              milestones: data.paymentTerms.milestones || [],
            },
          });
        } else {
          await tx.agreementPaymentTerm.deleteMany({ where: { agreementId } });
        }
      }
    });

    return {
      id: agreementId,
      rowVersion: nextRowVersion,
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * Transitions agreement status via the lifecycle state machine (PATCH /agreements/:id/status).
   * In Phase 5, permitted transitions are DRAFT <-> PENDING_REVIEW and -> CANCELLED.
   */
  public async changeStatus(
    organizationId: string,
    userId: string,
    userRole: string,
    actorName: string,
    actorEmail: string,
    agreementId: string,
    targetStatus: AgreementStatus,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        parties: { orderBy: { signingSequence: 'asc' } },
        clauses: { orderBy: { displayOrder: 'asc' } },
        paymentTerms: true,
        category: true,
      },
    });

    if (!agreement || agreement.organizationId !== organizationId || agreement.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    // Lifecycle validation
    const validation = validatePhase5Transition(
      agreement.status as AgreementStatus,
      targetStatus,
      userRole,
      agreement.creatorId === userId
    );

    if (!validation.allowed) {
      throw new AppError(
        validation.errorMessage || 'Invalid status transition.',
        validation.httpStatus || 400,
        validation.errorCode || 'INVALID_TRANSITION'
      );
    }

    // If moving to PENDING_REVIEW, enforce legal completeness checks
    if (targetStatus === 'PENDING_REVIEW') {
      try {
        finalizeAgreementSchema.parse({
          title: agreement.title,
          categoryId: agreement.categoryId,
          parties: agreement.parties,
          clauses: agreement.clauses,
        });
      } catch (err: any) {
        throw new AppError(
          'Agreement is not ready for review. Please verify all required counterparties, signers, and clauses.',
          422,
          'AGREEMENT_NOT_FINALIZABLE',
          err.errors || []
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      const nextVersion = agreement.rowVersion + 1;
      const now = new Date();

      const updateData: any = {
        status: targetStatus,
        rowVersion: nextVersion,
      };

      if (targetStatus === 'CANCELLED') {
        updateData.cancelledAt = now;
        updateData.cancellationReason = reason ? reason.trim() : 'Cancelled by user';
      }

      await tx.agreement.update({
        where: { id: agreementId },
        data: updateData,
      });

      // Updated full object for snapshot
      const updatedAgreement = {
        ...agreement,
        status: targetStatus,
        rowVersion: nextVersion,
        cancelledAt: updateData.cancelledAt || agreement.cancelledAt,
        cancellationReason: updateData.cancellationReason || agreement.cancellationReason,
      };

      // Record snapshot
      await this.recordVersionSnapshot(
        tx,
        agreementId,
        userId,
        updatedAgreement,
        `Status transitioned from ${agreement.status} to ${targetStatus}${reason ? `: ${reason}` : ''}`
      );

      // Audit event
      const eventType = targetStatus === 'CANCELLED' ? 'AGREEMENT_CANCELLED' : 'AGREEMENT_STATUS_CHANGED';
      await auditService.createEvent(
        {
          agreementId,
          eventType,
          actorType: 'USER',
          actorId: userId,
          actorName,
          actorEmail,
          ipAddress,
          userAgent,
          payload: {
            previousStatus: agreement.status,
            newStatus: targetStatus,
            reason,
            version: nextVersion,
          },
        },
        tx
      );

      // Operational activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          action: 'STATUS_CHANGE',
          entityType: 'AGREEMENT',
          entityId: agreementId,
          ipAddress,
          metadata: {
            referenceNumber: agreement.referenceNumber,
            previousStatus: agreement.status,
            newStatus: targetStatus,
          },
        },
      });

      return updatedAgreement;
    });
  }

  /**
   * Duplicates an existing agreement into a new DRAFT (POST /agreements/:id/duplicate).
   */
  public async duplicateAgreement(
    organizationId: string,
    userId: string,
    actorName: string,
    actorEmail: string,
    agreementId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const source = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        parties: { orderBy: { signingSequence: 'asc' } },
        clauses: { orderBy: { displayOrder: 'asc' } },
        paymentTerms: true,
        category: true,
      },
    });

    if (!source || source.organizationId !== organizationId || source.deletedAt !== null) {
      throw new NotFoundError('Source agreement not found.');
    }

    return prisma.$transaction(async (tx) => {
      const referenceNumber = await referenceNumberService.getNextReferenceNumber(organizationId, tx);

      const newAgreement = await tx.agreement.create({
        data: {
          referenceNumber,
          organizationId,
          creatorId: userId,
          categoryId: source.categoryId,
          title: `Copy of ${source.title}`.slice(0, 300),
          description: source.description,
          status: 'DRAFT',
          signingOrder: source.signingOrder,
          totalSignersCount: source.parties.filter((p) => p.role === 'SIGNER').length,
          completedSignersCount: 0,
          effectiveDate: null, // Clear effective date for duplicate draft
          expirationDate: null,
          rowVersion: 1,
        },
      });

      // Duplicate parties with reset status
      if (source.parties.length > 0) {
        await tx.agreementParty.createMany({
          data: source.parties.map((p) => ({
            agreementId: newAgreement.id,
            name: p.name,
            companyName: p.companyName,
            email: p.email,
            phone: p.phone,
            role: p.role,
            partyType: p.partyType,
            signingSequence: p.signingSequence,
            status: 'PENDING',
          })),
        });
      }

      // Duplicate clauses
      if (source.clauses.length > 0) {
        await tx.agreementClause.createMany({
          data: source.clauses.map((c) => ({
            agreementId: newAgreement.id,
            sectionNumber: c.sectionNumber,
            title: c.title,
            content: c.content,
            isStandardClause: c.isStandardClause,
            isMandatory: c.isMandatory,
            displayOrder: c.displayOrder,
          })),
        });
      }

      // Duplicate payment terms
      if (source.paymentTerms) {
        await tx.agreementPaymentTerm.create({
          data: {
            agreementId: newAgreement.id,
            totalAmount: source.paymentTerms.totalAmount,
            currency: source.paymentTerms.currency,
            paymentSchedule: source.paymentTerms.paymentSchedule,
            billingNotes: source.paymentTerms.billingNotes,
            milestones: source.paymentTerms.milestones as any,
          },
        });
      }

      const fullDuplicate = await tx.agreement.findUnique({
        where: { id: newAgreement.id },
        include: {
          parties: { orderBy: { signingSequence: 'asc' } },
          clauses: { orderBy: { displayOrder: 'asc' } },
          paymentTerms: true,
          category: true,
        },
      });

      // Initial version 1 snapshot
      await this.recordVersionSnapshot(
        tx,
        newAgreement.id,
        userId,
        fullDuplicate,
        `Duplicated from ${source.referenceNumber}`
      );

      // Audit event
      await auditService.createEvent(
        {
          agreementId: newAgreement.id,
          eventType: 'AGREEMENT_CREATED',
          actorType: 'USER',
          actorId: userId,
          actorName,
          actorEmail,
          ipAddress,
          userAgent,
          payload: {
            referenceNumber,
            duplicatedFrom: source.referenceNumber,
            sourceAgreementId: source.id,
          },
        },
        tx
      );

      // Activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          action: 'DUPLICATE_AGREEMENT',
          entityType: 'AGREEMENT',
          entityId: newAgreement.id,
          ipAddress,
          metadata: {
            sourceReference: source.referenceNumber,
            newReference: referenceNumber,
          },
        },
      });

      return fullDuplicate;
    });
  }

  /**
   * Archives or unarchives an agreement (POST /agreements/:id/archive).
   * Permitted only for terminal agreements and drafts.
   */
  public async archiveAgreement(
    organizationId: string,
    userId: string,
    actorName: string,
    actorEmail: string,
    agreementId: string,
    archive: boolean = true,
    ipAddress?: string,
    userAgent?: string
  ) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement || agreement.organizationId !== organizationId || agreement.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    if (!canArchive(agreement.status as AgreementStatus)) {
      throw new BadRequestError(
        `Cannot archive agreement in status '${agreement.status}'. Only drafts and completed/terminated agreements may be archived.`
      );
    }

    const updated = await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        isArchived: archive,
        archivedAt: archive ? new Date() : null,
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: archive ? 'ARCHIVE_AGREEMENT' : 'UNARCHIVE_AGREEMENT',
        entityType: 'AGREEMENT',
        entityId: agreementId,
        ipAddress,
        metadata: { referenceNumber: agreement.referenceNumber },
      },
    });

    return updated;
  }

  /**
   * Soft-deletes an agreement draft (DELETE /agreements/:id).
   * Strictly limited to DRAFT status. Non-drafts must be archived.
   */
  public async softDeleteAgreement(
    organizationId: string,
    userId: string,
    userRole: string,
    agreementId: string,
    ipAddress?: string
  ) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement || agreement.organizationId !== organizationId || agreement.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    if (!canDelete(agreement.status as AgreementStatus)) {
      throw new BadRequestError(
        `Agreements in status '${agreement.status}' cannot be deleted. Use Archive instead to preserve legal history.`
      );
    }

    if (userRole === 'VIEWER') {
      throw new ForbiddenError('Viewers do not have permission to delete agreements.');
    }

    if (userRole === 'MEMBER' && agreement.creatorId !== userId) {
      throw new ForbiddenError('Only the agreement creator or an administrator can delete this draft.');
    }

    const deleted = await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        deletedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: 'DELETE_AGREEMENT',
        entityType: 'AGREEMENT',
        entityId: agreementId,
        ipAddress,
        metadata: { referenceNumber: agreement.referenceNumber, title: agreement.title },
      },
    });

    return deleted;
  }

  // =========================================================================
  // AGREEMENT VERSIONS
  // =========================================================================

  /**
   * Lists all version snapshots for an agreement.
   */
  public async listVersions(organizationId: string, agreementId: string) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      select: { organizationId: true, deletedAt: true },
    });

    if (!agreement || agreement.organizationId !== organizationId || agreement.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    return prisma.agreementVersion.findMany({
      where: { agreementId },
      select: {
        id: true,
        versionNumber: true,
        changeSummary: true,
        contentHash: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Retrieves full snapshot content of a specific agreement version.
   */
  public async getVersion(organizationId: string, agreementId: string, versionNumber: number) {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      select: { organizationId: true, deletedAt: true },
    });

    if (!agreement || agreement.organizationId !== organizationId || agreement.deletedAt !== null) {
      throw new NotFoundError('Agreement not found.');
    }

    const version = await prisma.agreementVersion.findUnique({
      where: {
        uq_agreement_version: {
          agreementId,
          versionNumber,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundError(`Version ${versionNumber} not found for this agreement.`);
    }

    return version;
  }

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================

  /**
   * Lists categories with count of template clauses.
   */
  public async listCategories(organizationId: string) {
    return prisma.agreementCategory.findMany({
      where: {
        OR: [{ organizationId: null }, { organizationId }],
      },
      include: {
        _count: {
          select: { templateClauses: true },
        },
      },
      orderBy: [{ isSystemDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Creates an organization-scoped category.
   */
  public async createCategory(organizationId: string, data: CreateCategoryInput) {
    const existing = await prisma.agreementCategory.findFirst({
      where: {
        slug: data.slug,
        OR: [{ organizationId: null }, { organizationId }],
      },
    });

    if (existing) {
      throw new ConflictError(`Category with slug '${data.slug}' already exists.`);
    }

    return prisma.agreementCategory.create({
      data: {
        organizationId,
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description ? data.description.trim() : null,
        iconName: data.iconName || 'FileText',
        isSystemDefault: false,
      },
    });
  }

  /**
   * Updates an organization-scoped category.
   */
  public async updateCategory(organizationId: string, categoryId: string, data: UpdateCategoryInput) {
    const category = await prisma.agreementCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || (category.organizationId !== organizationId && !category.isSystemDefault)) {
      throw new NotFoundError('Category not found.');
    }

    if (category.isSystemDefault) {
      throw new ForbiddenError('System default categories cannot be modified.');
    }

    return prisma.agreementCategory.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
        ...(data.iconName && { iconName: data.iconName }),
      },
    });
  }

  /**
   * Deletes an organization-scoped category.
   */
  public async deleteCategory(organizationId: string, categoryId: string) {
    const category = await prisma.agreementCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || (category.organizationId !== organizationId && !category.isSystemDefault)) {
      throw new NotFoundError('Category not found.');
    }

    if (category.isSystemDefault) {
      throw new ForbiddenError('System default categories cannot be deleted.');
    }

    // Check if in use by agreements
    const agreementsCount = await prisma.agreement.count({
      where: { categoryId, deletedAt: null },
    });

    if (agreementsCount > 0) {
      throw new ConflictError(
        `Cannot delete category '${category.name}' because it is in use by ${agreementsCount} agreement(s).`
      );
    }

    return prisma.agreementCategory.delete({
      where: { id: categoryId },
    });
  }

  /**
   * Retrieves template clauses for a category.
   */
  public async getCategoryTemplateClauses(categoryId: string) {
    return prisma.agreementCategoryClause.findMany({
      where: { categoryId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Adds a template clause to a category.
   */
  public async createCategoryTemplateClause(
    organizationId: string,
    categoryId: string,
    data: CreateCategoryClauseInput
  ) {
    const category = await prisma.agreementCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found.');
    }

    if (category.isSystemDefault) {
      throw new ForbiddenError('Template clauses cannot be added to system default categories.');
    }

    if (category.organizationId !== organizationId) {
      throw new ForbiddenError('Access denied.');
    }

    return prisma.agreementCategoryClause.create({
      data: {
        categoryId,
        sectionNumber: data.sectionNumber || '1.0',
        title: data.title.trim(),
        content: sanitizeHtml(data.content),
        isMandatory: data.isMandatory ?? true,
        displayOrder: data.displayOrder || 1,
      },
    });
  }
}

export const agreementService = new AgreementService();
