import { request } from './api';
import { isServiceReal } from './serviceMode';
import { stats as mockStats } from './mock/index';

export interface DashboardStatsData {
  total: number;
  completed: number;
  running: number;
  pendingSignatures: number;
  expired: number;
  completionRate: number;
  avgTurnaroundHours: number;
  deltas: {
    total: number;
    completed: number;
    running: number;
    pendingSignatures: number;
    expired: number;
    completionRate: number;
    avgTurnaroundHours: number;
  };
}

export interface ActivityFeedItem {
  id: string;
  action: string;
  summary: string;
  actor: {
    id: string | null;
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface DeadlineItem {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  expirationDate: string;
  categoryName: string;
  categorySlug: string;
  daysRemaining: number;
}

export const dashboardService = {
  isReal(): boolean {
    return isServiceReal('dashboard');
  },

  async getStats(orgId?: string): Promise<DashboardStatsData> {
    if (!this.isReal()) {
      const s = mockStats();
      return {
        total: s.total,
        completed: s.completed,
        running: s.running,
        pendingSignatures: s.pending,
        expired: s.expired,
        completionRate: s.rate,
        avgTurnaroundHours: 32.5,
        deltas: {
          total: 12.5,
          completed: 8.3,
          running: 4.1,
          pendingSignatures: -2.0,
          expired: 0,
          completionRate: 5.2,
          avgTurnaroundHours: -14.2,
        },
      };
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: DashboardStatsData }>('/dashboard/stats', {
      method: 'GET',
      headers,
    });
    return res.data;
  },

  async getActivity(page = 1, limit = 10, orgId?: string): Promise<{ data: ActivityFeedItem[]; total: number }> {
    if (!this.isReal()) {
      return {
        data: [
          {
            id: 'mock-act-1',
            action: 'AGREEMENT_CREATED',
            summary: 'Alex Morgan created Enterprise Cloud Migration SOW',
            actor: { id: 'usr-1', name: 'Alex Morgan' },
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      };
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: ActivityFeedItem[]; meta: { total: number } }>(
      `/dashboard/activity?page=${page}&limit=${limit}`,
      { method: 'GET', headers }
    );
    return { data: res.data, total: res.meta?.total || res.data.length };
  },

  async getDeadlines(days = 30, orgId?: string): Promise<DeadlineItem[]> {
    if (!this.isReal()) {
      return [];
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: DeadlineItem[] }>(`/dashboard/deadlines?days=${days}`, {
      method: 'GET',
      headers,
    });
    return res.data;
  },

  async getRecent(limit = 5, orgId?: string): Promise<any[]> {
    if (!this.isReal()) {
      return [];
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: any[] }>(`/dashboard/recent?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    return res.data;
  },
};
