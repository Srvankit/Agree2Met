import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const signingService = {
  async getByToken(token) {
    if (USE_MOCK) return mockStore.getAgreementBySigningToken(token);
    return apiClient.get(`/signing/${token}`);
  },

  async submitSignature(token, data) {
    if (USE_MOCK) return mockStore.submitSignature(token, data);
    return apiClient.post(`/signing/${token}/sign`, data);
  },

  async declineSigning(token, reason) {
    if (USE_MOCK) return mockStore.declineSigning(token, reason);
    return apiClient.post(`/signing/${token}/decline`, { reason });
  },
};
