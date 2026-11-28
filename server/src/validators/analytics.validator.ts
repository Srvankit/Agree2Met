import { z } from 'zod';

export const analyticsOverviewQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    granularity: z.enum(['day', 'week', 'month']).default('month'),
    timezone: z.string().default('UTC'),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const fromDate = new Date(data.from);
        const toDate = new Date(data.to);
        if (toDate < fromDate) return false;
        // Maximum range: 24 months (730 days)
        const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 730) return false;
      }
      return true;
    },
    {
      message: 'Invalid date range: "to" must be after "from", and duration cannot exceed 24 months.',
      path: ['to'],
    }
  );

export const analyticsExportQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export type AnalyticsOverviewQuery = z.infer<typeof analyticsOverviewQuerySchema>;
export type AnalyticsExportQuery = z.infer<typeof analyticsExportQuerySchema>;
