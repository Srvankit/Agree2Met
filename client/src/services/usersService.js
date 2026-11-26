import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const usersService = {
  async getProfile() {
    if (USE_MOCK) return mockStore.getCurrentUser();
    return apiClient.get('/users/profile');
  },

  async updateProfile(updates) {
    if (USE_MOCK) return mockStore.updateProfile(updates);
    return apiClient.patch('/users/profile', updates);
  },

  async changePassword(currentPassword, newPassword) {
    if (USE_MOCK) return { success: true };
    return apiClient.post('/users/change-password', { currentPassword, newPassword });
  },

  async toggleTwoFactor(enabled) {
    if (USE_MOCK) return mockStore.updateProfile({ twoFactorEnabled: enabled });
    return apiClient.post('/users/2fa', { enabled });
  },
};
