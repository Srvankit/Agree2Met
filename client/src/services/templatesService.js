import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const templatesService = {
  async list() {
    if (USE_MOCK) return mockStore.listTemplates();
    return apiClient.get('/templates');
  },

  async getById(id) {
    if (USE_MOCK) return mockStore.getTemplateById(id);
    return apiClient.get(`/templates/${id}`);
  },
};
