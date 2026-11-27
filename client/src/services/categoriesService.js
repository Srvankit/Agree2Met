import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const categoriesService = {
  async list() {
    if (USE_MOCK) {
      const items = await mockStore.listCategories();
      return Array.isArray(items) ? items : [];
    }
    const res = await apiClient.get('/categories');
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  },
};
