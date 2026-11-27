import { load, persist } from './mock/mockStore';
import { apiClient } from './api';
import { isServiceReal } from './serviceMode';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  display_name?: string;
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

export const authService = {
  async getSession(): Promise<UserSession | null> {
    if (!isServiceReal('auth')) {
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

    try {
      const res = await apiClient.get('/auth/me');
      const data = res.data;
      if (!data) return null;

      const primaryOrg = data.organizations?.[0];
      return {
        id: data.id,
        name: data.profile?.displayName || `${data.profile?.firstName || ''} ${data.profile?.lastName || ''}`.trim() || data.email,
        display_name: data.profile?.displayName || data.email,
        email: data.email,
        role: primaryOrg?.role || 'MEMBER',
        avatar_url: data.profile?.avatarUrl,
        organizations: data.organizations,
      };
    } catch {
      return null;
    }
  },

  async login(email: string, password?: string): Promise<{ user: UserSession }> {
    if (!isServiceReal('auth')) {
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
    const u = res.data?.user;
    const session = await this.getSession();

    return {
      user: session || {
        id: u?.id || '',
        name: u?.profile?.displayName || u?.email || email,
        display_name: u?.profile?.displayName || u?.email || email,
        email: u?.email || email,
        role: 'OWNER',
      },
    };
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    organizationName?: string;
  }): Promise<{ message: string }> {
    if (!isServiceReal('auth')) {
      const state = load();
      const name = `${data.firstName} ${data.lastName}`.trim();
      state.profile = { name, email: data.email };
      persist(state);
      return {
        message: 'If this email is not already registered, a verification link has been sent.',
      };
    }

    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async logout(): Promise<void> {
    if (!isServiceReal('auth')) {
      return;
    }
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout network failures
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!isServiceReal('auth')) {
      return { message: 'Email verified successfully.' };
    }
    const res = await apiClient.post('/auth/verify-email', { token });
    return res.data;
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    if (!isServiceReal('auth')) {
      return { message: 'Verification link resent.' };
    }
    const res = await apiClient.post('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!isServiceReal('auth')) {
      return { message: 'Password reset link sent.' };
    }
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    if (!isServiceReal('auth')) {
      return { message: 'Password reset successfully.' };
    }
    const res = await apiClient.post('/auth/reset-password', { token, password });
    return res.data;
  },

  async getSessions(): Promise<{ sessions: any[] }> {
    if (!isServiceReal('auth')) {
      return {
        sessions: [
          {
            id: 'sess-current-demo',
            userAgent: 'Current Browser Session (Demo)',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString(),
            isCurrent: true,
          },
        ],
      };
    }
    const res = await apiClient.get('/auth/sessions');
    return res.data;
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    if (!isServiceReal('auth')) {
      return { message: 'Session revoked.' };
    }
    const res = await apiClient.delete(`/auth/sessions/${sessionId}`);
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
