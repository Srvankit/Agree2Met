import { prisma } from '../config/db.js';
import { auditService } from './audit.service.js';
import { ListAgreementsQuery } from '../validators/agreement.validator.js';

export class AgreementService {
  /**
   * Lists available agreement categories (system defaults + organization-specific).
   */
  public async listCategories(organizationId: string) {
    return prisma.agreementCategory.findMany({
      where: {
        OR: [{ organizationId: null }, { organizationId }],
      },
      orderBy: [{ isSystemDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Retrieves paginated, filtered, and sorted agreements for the organization.
   */
  public async listAgreements(organizationId: string, query: ListAgreementsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
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
   * Returns null if agreement does not belong to the organization.
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

    if (!agreement || agreement.organizationId !== organizationId) {
      return null;
    }

    // Attach verified cryptographic audit trail
    const auditTrail = await auditService.getAuditTrail(agreementId);

    return {
      ...agreement,
      auditTrail,
    };
  }
}

export const agreementService = new AgreementService();
