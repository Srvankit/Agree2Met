import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const notificationsService = {
  async list() {
    if (USE_MOCK) return mockStore.listNotifications();
    return apiClient.get('/notifications');
  },

  async markAsRead(id) {
    if (USE_MOCK) return mockStore.markNotificationRead(id);
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    if (USE_MOCK) return mockStore.markAllNotificationsRead();
    return apiClient.post('/notifications/read-all');
  },
};
