import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const agreementsService = {
  async list(params) {
    if (USE_MOCK) return mockStore.listAgreements(params);
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/agreements?${query}`);
  },

  async getById(id) {
    if (USE_MOCK) return mockStore.getAgreementById(id);
    return apiClient.get(`/agreements/${id}`);
  },

  async create(data) {
    if (USE_MOCK) return mockStore.createAgreement(data);
    return apiClient.post('/agreements', data);
  },

  async update(id, updates) {
    if (USE_MOCK) return mockStore.updateAgreement(id, updates);
    return apiClient.patch(`/agreements/${id}`, updates);
  },

  async transition(id, targetStatus, actorName, details) {
    if (USE_MOCK) return mockStore.transitionAgreement(id, targetStatus, actorName, details);
    return apiClient.post(`/agreements/${id}/transition`, { targetStatus, details });
  },

  async verifyAuditChain(id) {
    if (USE_MOCK) return mockStore.verifyAuditChain(id);
    return apiClient.get(`/agreements/${id}/audit/verify`);
  },

  async tamperAuditRecord(id, recordIndex) {
    if (USE_MOCK) return mockStore.tamperAuditRecord(id, recordIndex);
    return false;
  },

  async archive(id) {
    if (USE_MOCK) return mockStore.archiveAgreement(id);
    return apiClient.post(`/agreements/${id}/archive`);
  },

  async unarchive(id) {
    if (USE_MOCK) return mockStore.unarchiveAgreement(id);
    return apiClient.post(`/agreements/${id}/unarchive`);
  },

  async listArchived() {
    if (USE_MOCK) return mockStore.listArchivedAgreements();
    return apiClient.get('/agreements/archived');
  },

  async hardDelete(id) {
    if (USE_MOCK) return mockStore.hardDeleteAgreement(id);
    return apiClient.delete(`/agreements/${id}`);
  },

  async resetDemoData() {
    if (USE_MOCK) return mockStore.reset();
    return false;
  },
};
