import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const categoriesService = {
  async list() {
    if (USE_MOCK) return mockStore.listCategories();
    return apiClient.get('/categories');
  },
};
