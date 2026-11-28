import { z } from 'zod';

export const listAgreementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  sortBy: z.enum(['createdAt', 'title', 'status', 'expirationDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getAgreementParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid agreement ID format' }),
});

export const partyInputSchema = z.object({
  name: z.string().trim().min(1, 'Party name is required').max(255),
  companyName: z.string().trim().max(255).nullable().optional(),
  email: z.string().trim().email('Invalid party email address').max(255),
  phone: z.string().trim().max(50).nullable().optional(),
  role: z.enum(['SIGNER', 'REVIEWER', 'VIEWER']).default('SIGNER'),
  partyType: z.enum(['INTERNAL', 'COUNTERPARTY', 'WITNESS']).default('COUNTERPARTY'),
  signingSequence: z.coerce.number().int().min(1).max(20).default(1),
});

export const clauseInputSchema = z.object({
  sectionNumber: z.string().trim().max(20).default('1.0'),
  title: z.string().trim().min(1, 'Clause title is required').max(300),
  content: z.string().max(20000, 'Clause content exceeds maximum 20,000 characters'),
  isStandardClause: z.boolean().default(true),
  isMandatory: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(1).default(1),
});

export const paymentMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(200),
  percentage: z.number().min(0).max(100),
  amount: z.number().min(0).optional(),
  status: z.enum(['PENDING', 'PAID']).default('PENDING'),
});

export const paymentTermsInputSchema = z.object({
  totalAmount: z.number().min(0).nullable().optional(),
  currency: z.string().trim().length(3).default('USD'),
  paymentSchedule: z.enum(['LUMP_SUM', 'MONTHLY', 'MILESTONE', 'NET_30', 'NET_60']).default('MILESTONE'),
  billingNotes: z.string().max(2000).nullable().optional(),
  milestones: z.array(paymentMilestoneSchema).optional().default([]),
});

/**
 * Lenient schema for drafting / autosaving.
 * Permits partial fields, uncompleted clauses, and tentative parties.
 */
export const baseAgreementDraftSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  signingOrder: z.enum(['PARALLEL', 'SEQUENTIAL']).default('PARALLEL'),
  effectiveDate: z.string().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  parties: z.array(partyInputSchema).max(20, 'Maximum 20 parties allowed').optional().default([]),
  clauses: z.array(clauseInputSchema).max(200, 'Maximum 200 clauses allowed').optional().default([]),
  paymentTerms: paymentTermsInputSchema.nullable().optional(),
  changeSummary: z.string().max(500).optional(),
});

const validateDates = (data: { effectiveDate?: string | null; expirationDate?: string | null }) => {
  if (data.effectiveDate && data.expirationDate) {
    return new Date(data.expirationDate) > new Date(data.effectiveDate);
  }
  return true;
};

/**
 * Lenient schema for drafting / autosaving.
 * Permits partial fields, uncompleted clauses, and tentative parties.
 */
export const createAgreementDraftSchema = baseAgreementDraftSchema.refine(validateDates, {
  message: 'Expiration date must be strictly after the effective date',
  path: ['expirationDate'],
});

/**
 * Full update schema for explicit saves (PUT /agreements/:id).
 * Requires optimistic locking field `expectedRowVersion`.
 */
export const updateAgreementSchema = baseAgreementDraftSchema
  .extend({
    expectedRowVersion: z.coerce.number().int().min(1, 'expectedRowVersion is required for optimistic locking'),
  })
  .refine(validateDates, {
    message: 'Expiration date must be strictly after the effective date',
    path: ['expirationDate'],
  });

/**
 * Lightweight autosave schema for debounced updates.
 * Does not require all fields, but checks `expectedRowVersion`.
 */
export const autosaveAgreementSchema = z.object({
  expectedRowVersion: z.coerce.number().int().min(1, 'expectedRowVersion is required for autosave'),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().uuid().optional(),
  signingOrder: z.enum(['PARALLEL', 'SEQUENTIAL']).optional(),
  effectiveDate: z.string().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  parties: z.array(partyInputSchema).max(20).optional(),
  clauses: z.array(clauseInputSchema).max(200).optional(),
  paymentTerms: paymentTermsInputSchema.nullable().optional(),
}).refine(
  (data) => {
    if (data.effectiveDate && data.expirationDate) {
      return new Date(data.expirationDate) > new Date(data.effectiveDate);
    }
    return true;
  },
  {
    message: 'Expiration date must be strictly after the effective date',
    path: ['expirationDate'],
  }
);

/**
 * Status change schema (PATCH /agreements/:id/status).
 */
export const statusTransitionSchema = z.object({
  status: z.enum([
    'DRAFT',
    'PENDING_REVIEW',
    'SENT',
    'AWAITING_SIGNATURES',
    'PARTIALLY_SIGNED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED',
  ]),
  reason: z.string().trim().max(1000).optional(),
});

/**
 * Strict finalization schema.
 * Validates that an agreement meets all legal readiness criteria before
 * transitioning from DRAFT to PENDING_REVIEW.
 */
export const finalizeAgreementSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  categoryId: z.string().uuid('Valid category is required'),
  parties: z
    .array(partyInputSchema)
    .min(1, 'At least 1 counterparty is required')
    .refine((parties) => {
      // Must contain at least one signer
      return parties.some((p) => p.role === 'SIGNER');
    }, { message: 'Agreement must have at least one party with role SIGNER' })
    .refine((parties) => {
      // Party emails must be unique per agreement
      const emails = parties.map((p) => p.email.toLowerCase());
      return new Set(emails).size === emails.length;
    }, { message: 'Duplicate party emails are not permitted within an agreement' }),
  clauses: z
    .array(clauseInputSchema)
    .min(1, 'Agreement must contain at least 1 clause')
    .refine((clauses) => {
      return clauses.every((c) => c.content.trim().length > 0);
    }, { message: 'All clauses must have non-empty content' }),
});

/**
 * Category management schemas
 */
export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with dashes'),
  description: z.string().max(500).optional(),
  iconName: z.string().trim().max(50).default('FileText'),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  iconName: z.string().trim().max(50).optional(),
});

export const createCategoryClauseSchema = z.object({
  sectionNumber: z.string().trim().max(20).default('1.0'),
  title: z.string().trim().min(1, 'Title is required').max(300),
  content: z.string().min(1, 'Clause content is required').max(20000),
  isMandatory: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(1).default(1),
});

export type ListAgreementsQuery = z.infer<typeof listAgreementsQuerySchema>;
export type GetAgreementParams = z.infer<typeof getAgreementParamsSchema>;
export type CreateAgreementDraftInput = z.infer<typeof createAgreementDraftSchema>;
export type UpdateAgreementInput = z.infer<typeof updateAgreementSchema>;
export type AutosaveAgreementInput = z.infer<typeof autosaveAgreementSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateCategoryClauseInput = z.infer<typeof createCategoryClauseSchema>;
