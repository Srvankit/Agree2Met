import { apiClient } from './api';
import { load, persist } from './mock/mockStore';
import { isServiceReal } from './serviceMode';

export const userService = {
  async getProfile() {
    if (!isServiceReal('users')) {
      const state = load();
      return {
        user: {
          id: 'usr-demo-01',
          email: state.profile?.email || 'alex@agree2met.com',
          isEmailVerified: true,
        },
        profile: {
          firstName: state.profile?.name?.split(' ')[0] || 'Alex',
          lastName: state.profile?.name?.split(' ')[1] || 'Morgan',
          displayName: state.profile?.name || 'Alex Morgan',
          avatarUrl: '',
          jobTitle: 'Head of Legal Operations',
          themePreference: 'system',
        },
      };
    }
    const res = await apiClient.get('/users/profile');
    return res.data;
  },

  async updateProfile(updates: any) {
    if (!isServiceReal('users')) {
      const state = load();
      const name = updates.displayName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim() || state.profile?.name;
      state.profile = { ...state.profile, name, ...updates };
      persist(state);
      return { profile: state.profile };
    }
    const res = await apiClient.put('/users/profile', updates);
    return res.data;
  },

  async uploadAvatar(file: File) {
    if (!isServiceReal('users')) {
      return { avatarUrl: URL.createObjectURL(file) };
    }
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post('/users/avatar', formData);
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    if (!isServiceReal('users')) {
      return { message: 'Password updated successfully (demo).' };
    }
    const res = await apiClient.put('/users/password', { currentPassword, newPassword });
    return res.data;
  },

  async exportUserData() {
    if (!isServiceReal('users')) {
      const state = load();
      return {
        exportedAt: new Date().toISOString(),
        demoData: state,
      };
    }
    const res = await apiClient.post('/users/export-data');
    return res.data;
  },

  async deleteAccount(confirmation: string, password: string) {
    if (!isServiceReal('users')) {
      return { message: 'Account deleted (demo).' };
    }
    const res = await apiClient.delete('/users/account', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation, password }),
    } as any);
    return res.data;
  },
};
