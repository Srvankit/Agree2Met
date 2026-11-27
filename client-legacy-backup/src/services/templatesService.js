import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const templatesService = {
  async list() {
    if (USE_MOCK) {
      const items = await mockStore.listTemplates();
      return Array.isArray(items) ? items : [];
    }
    const res = await apiClient.get('/templates');
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  },

  async getById(id) {
    if (USE_MOCK) return mockStore.getTemplateById(id);
    return apiClient.get(`/templates/${id}`);
  },
};
