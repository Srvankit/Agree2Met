import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const remindersService = {
  async list() {
    if (USE_MOCK) {
      const items = await mockStore.listReminders();
      return Array.isArray(items) ? items : [];
    }
    const res = await apiClient.get('/reminders');
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  },

  async create(data) {
    if (USE_MOCK) return mockStore.createReminder(data);
    return apiClient.post('/reminders', data);
  },

  async delete(id) {
    if (USE_MOCK) return mockStore.deleteReminder(id);
    return apiClient.delete(`/reminders/${id}`);
  },
};
