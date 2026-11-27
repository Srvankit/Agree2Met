import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const organizationsService = {
  async list() {
    if (USE_MOCK) {
      const items = await mockStore.getOrganizations();
      return Array.isArray(items) ? items : [];
    }
    const res = await apiClient.get('/organizations');
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  },

  async getCurrent() {
    if (USE_MOCK) return mockStore.getCurrentOrganization();
    return apiClient.get('/organizations/current');
  },

  async switch(orgId) {
    if (USE_MOCK) return mockStore.switchOrganization(orgId);
    return apiClient.post(`/organizations/${orgId}/switch`);
  },

  async getMembers(orgId) {
    if (USE_MOCK) {
      const members = await mockStore.getOrgMembers(orgId);
      return Array.isArray(members) ? members : [];
    }
    const res = await apiClient.get(`/organizations/${orgId}/members`);
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  },

  async inviteMember(data) {
    if (USE_MOCK) return mockStore.inviteOrgMember(data);
    return apiClient.post('/organizations/members/invite', data);
  },

  async updateMemberRole(memberId, role) {
    if (USE_MOCK) return mockStore.updateOrgMemberRole(memberId, role);
    return apiClient.patch(`/organizations/members/${memberId}`, { role });
  },

  async removeMember(memberId) {
    if (USE_MOCK) return mockStore.removeOrgMember(memberId);
    return apiClient.delete(`/organizations/members/${memberId}`);
  },
};
