import { request } from './api';
import { isServiceReal } from './serviceMode';

export interface AnalyticsOverviewData {
  summary: {
    totalCreated: number;
    totalCompleted: number;
    totalValue: number;
    completionRate: number;
  };
  timeSeries: Array<{
    period: string;
    created: number;
    completed: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    iconName: string;
    count: number;
    totalValue: number;
  }>;
  turnaroundMetrics: {
    avgTurnaroundHours: number;
    medianTurnaroundHours: number;
    minTurnaroundHours: number;
    maxTurnaroundHours: number;
  };
  signerMetrics: {
    avgSignerResponseHours: number;
  };
}

export const analyticsService = {
  isReal(): boolean {
    return isServiceReal('analytics');
  },

  async getOverview(
    params?: { from?: string; to?: string; granularity?: string; timezone?: string },
    orgId?: string
  ): Promise<AnalyticsOverviewData> {
    if (!this.isReal()) {
      return {
        summary: { totalCreated: 42, totalCompleted: 28, totalValue: 420000, completionRate: 66.7 },
        timeSeries: [
          { period: '2026-06-01', created: 8, completed: 5 },
          { period: '2026-07-01', created: 10, completed: 7 },
          { period: '2026-08-01', created: 6, completed: 4 },
          { period: '2026-09-01', created: 9, completed: 6 },
          { period: '2026-10-01', created: 5, completed: 4 },
          { period: '2026-11-01', created: 4, completed: 2 },
        ],
        statusDistribution: [
          { status: 'COMPLETED', count: 28, percentage: 66.7 },
          { status: 'AWAITING_SIGNATURES', count: 8, percentage: 19.0 },
          { status: 'DRAFT', count: 4, percentage: 9.5 },
          { status: 'EXPIRED', count: 2, percentage: 4.8 },
        ],
        categoryDistribution: [
          { categoryId: '1', categoryName: 'Master Services Agreement', categorySlug: 'msa', iconName: 'FileText', count: 18, totalValue: 240000 },
          { categoryId: '2', categoryName: 'Statement of Work', categorySlug: 'sow', iconName: 'FileCode', count: 14, totalValue: 120000 },
          { categoryId: '3', categoryName: 'Non-Disclosure Agreement', categorySlug: 'nda', iconName: 'Shield', count: 10, totalValue: 60000 },
        ],
        turnaroundMetrics: {
          avgTurnaroundHours: 38.4,
          medianTurnaroundHours: 24.0,
          minTurnaroundHours: 4.5,
          maxTurnaroundHours: 112.0,
        },
        signerMetrics: {
          avgSignerResponseHours: 14.8,
        },
      };
    }

    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.granularity) query.set('granularity', params.granularity);
    if (params?.timezone) query.set('timezone', params.timezone);

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ data: AnalyticsOverviewData }>(`/analytics/overview${queryString}`, {
      method: 'GET',
      headers,
    });
    return res.data;
  },

  async exportCsv(params?: { from?: string; to?: string }, orgId?: string): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const BASE_URL =
      import.meta.env?.VITE_API_URL ||
      import.meta.env?.VITE_API_BASE_URL ||
      'http://localhost:5000/api/v1';

    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (orgId) headers['X-Organization-ID'] = orgId;

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${BASE_URL}/analytics/export.csv${queryString}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to export analytics CSV: ${response.statusText}`);
    }

    return response.blob();
  },
};
