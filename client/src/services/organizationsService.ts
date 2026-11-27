import { apiClient } from './api';
import { load, persist } from './mock/mockStore';
import { isServiceReal } from './serviceMode';

export const organizationsService = {
  async getOrganizations() {
    if (!isServiceReal('organizations')) {
      const state = load();
      return {
        organizations: [
          {
            id: 'org-demo-01',
            name: state.orgName || 'Acme Corporation',
            slug: 'acme-corp',
            role: state.demoRole || 'Owner',
          },
        ],
      };
    }
    const res = await apiClient.get('/organizations');
    return res.data;
  },

  async createOrganization(name: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      state.orgName = name;
      persist(state);
      return { organization: { id: `org-${Date.now()}`, name, role: 'Owner' } };
    }
    const res = await apiClient.post('/organizations', { name });
    return res.data;
  },

  async getOrganizationById(id: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      return {
        id,
        name: state.orgName || 'Acme Corporation',
        slug: 'acme-corp',
        currentUserRole: state.demoRole || 'Owner',
      };
    }
    const res = await apiClient.get(`/organizations/${id}`);
    return res.data?.organization || res.data;
  },

  async getMembers(orgId?: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      return {
        members: state.members || [
          {
            id: 'mem-1',
            name: 'Alex Morgan',
            email: 'alex@agree2met.com',
            role: state.demoRole || 'Owner',
          },
        ],
        invitations: state.invitations || [],
      };
    }
    const endpoint = orgId ? `/organizations/${orgId}/members` : '/organizations/default/members';
    const res = await apiClient.get(endpoint);
    return res.data;
  },

  async inviteMember(orgId: string, email: string, role: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      const newInv = {
        id: `inv-${Date.now()}`,
        email,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      state.invitations = [...(state.invitations || []), newInv];
      persist(state);
      return { message: 'Invitation sent successfully.', invitation: newInv };
    }
    const res = await apiClient.post(`/organizations/${orgId}/members`, { email, role });
    return res.data;
  },

  async acceptInvitation(token: string) {
    if (!isServiceReal('organizations')) {
      return { message: 'Invitation accepted.' };
    }
    const res = await apiClient.post('/organizations/invitations/accept', { token });
    return res.data;
  },

  async updateMemberRole(orgId: string, memberId: string, role: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      state.members = (state.members || []).map((m: any) =>
        m.id === memberId ? { ...m, role } : m
      );
      persist(state);
      return { message: 'Member role updated.' };
    }
    const res = await apiClient.patch(`/organizations/${orgId}/members/${memberId}`, { role });
    return res.data;
  },

  async removeMember(orgId: string, memberId: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      state.members = (state.members || []).filter((m: any) => m.id !== memberId);
      persist(state);
      return { message: 'Member removed.' };
    }
    const res = await apiClient.delete(`/organizations/${orgId}/members/${memberId}`);
    return res.data;
  },

  async resendInvitation(orgId: string, invitationId: string) {
    if (!isServiceReal('organizations')) {
      return { message: 'Invitation resent.' };
    }
    const res = await apiClient.post(`/organizations/${orgId}/invitations/${invitationId}/resend`);
    return res.data;
  },

  async revokeInvitation(orgId: string, invitationId: string) {
    if (!isServiceReal('organizations')) {
      const state = load();
      state.invitations = (state.invitations || []).filter((i: any) => i.id !== invitationId);
      persist(state);
      return { message: 'Invitation revoked.' };
    }
    const res = await apiClient.delete(`/organizations/${orgId}/invitations/${invitationId}`);
    return res.data;
  },
};
