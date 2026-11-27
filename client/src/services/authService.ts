import { load, persist } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  display_name?: string;
}

export const authService = {
  async getSession(): Promise<UserSession | null> {
    if (USE_MOCK) {
      const state = load();
      if (!state.profile) return null;
      return {
        id: 'usr-demo-01',
        name: state.profile.name || 'Alex Morgan',
        display_name: state.profile.name || 'Alex Morgan',
        email: state.profile.email || 'alex@agree2met.com',
        role: state.demoRole || 'Owner',
      };
    }
    const res = await apiClient.get('/auth/me');
    return res.data?.user || null;
  },

  async login(email: string, password?: string): Promise<{ user: UserSession }> {
    if (USE_MOCK) {
      const state = load();
      const user: UserSession = {
        id: 'usr-demo-01',
        name: email === 'alex@agree2met.com' ? 'Alex Morgan' : email.split('@')[0],
        display_name: email === 'alex@agree2met.com' ? 'Alex Morgan' : email.split('@')[0],
        email,
        role: state.demoRole || 'Owner',
      };
      state.profile = { name: user.name, email: user.email };
      persist(state);
      return { user };
    }
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  async register(data: { name: string; email: string; password?: string }): Promise<{ user: UserSession }> {
    if (USE_MOCK) {
      const state = load();
      const user: UserSession = {
        id: `usr-demo-${Date.now()}`,
        name: data.name,
        display_name: data.name,
        email: data.email,
        role: 'Owner',
      };
      state.profile = { name: data.name, email: data.email };
      persist(state);
      return { user };
    }
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await apiClient.post('/auth/logout');
  },

  async updateProfile(updates: Partial<UserSession>): Promise<UserSession> {
    if (USE_MOCK) {
      const state = load();
      state.profile = { ...state.profile, ...updates };
      if (updates.role) state.demoRole = updates.role;
      persist(state);
      return {
        id: 'usr-demo-01',
        name: state.profile.name,
        display_name: state.profile.name,
        email: state.profile.email,
        role: state.demoRole || 'Owner',
      };
    }
    const res = await apiClient.patch('/users/me', updates);
    return res.data;
  },

  async switchRole(role: string): Promise<UserSession> {
    const state = load();
    state.demoRole = role;
    persist(state);
    return {
      id: 'usr-demo-01',
      name: state.profile?.name || 'Alex Morgan',
      display_name: state.profile?.name || 'Alex Morgan',
      email: state.profile?.email || 'alex@agree2met.com',
      role,
    };
  },
};
