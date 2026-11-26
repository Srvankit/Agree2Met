import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const dashboardService = {
  async getStats(orgId) {
    if (USE_MOCK) return mockStore.getDashboardStats(orgId);
    return apiClient.get(`/dashboard/stats?orgId=${orgId}`);
  },
};
