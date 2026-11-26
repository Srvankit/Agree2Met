import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const authService = {
  async getSession() {
    if (USE_MOCK) return mockStore.getCurrentUser();
    return apiClient.get('/auth/me');
  },

  async login(email, password) {
    if (USE_MOCK) return mockStore.login(email, password);
    return apiClient.post('/auth/login', { email, password });
  },

  async register(data) {
    if (USE_MOCK) return mockStore.register(data);
    return apiClient.post('/auth/register', data);
  },

  async logout() {
    if (USE_MOCK) return { success: true };
    return apiClient.post('/auth/logout');
  },

  async forgotPassword(email) {
    if (USE_MOCK) return { success: true, message: `Reset link sent to ${email}` };
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    if (USE_MOCK) return { success: true };
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },

  async verifyEmail(token) {
    if (USE_MOCK) return { success: true };
    return apiClient.post('/auth/verify-email', { token });
  },
};
