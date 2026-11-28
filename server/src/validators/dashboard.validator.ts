import { z } from 'zod';

export const dashboardActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const dashboardDeadlinesQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const dashboardRecentQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(5),
});

export type DashboardActivityQuery = z.infer<typeof dashboardActivityQuerySchema>;
export type DashboardDeadlinesQuery = z.infer<typeof dashboardDeadlinesQuerySchema>;
export type DashboardRecentQuery = z.infer<typeof dashboardRecentQuerySchema>;
