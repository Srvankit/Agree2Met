import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const organizationsService = {
  async list() {
    if (USE_MOCK) return mockStore.getOrganizations();
    return apiClient.get('/organizations');
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
    if (USE_MOCK) return mockStore.getOrgMembers(orgId);
    return apiClient.get(`/organizations/${orgId}/members`);
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
