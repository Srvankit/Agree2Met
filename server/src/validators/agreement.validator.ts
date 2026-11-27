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

export type ListAgreementsQuery = z.infer<typeof listAgreementsQuerySchema>;
export type GetAgreementParams = z.infer<typeof getAgreementParamsSchema>;
