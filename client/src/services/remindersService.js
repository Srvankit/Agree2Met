import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const remindersService = {
  async list() {
    if (USE_MOCK) return mockStore.listReminders();
    return apiClient.get('/reminders');
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
