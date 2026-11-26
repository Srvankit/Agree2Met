import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const versionsService = {
  async getVersions(agreementId) {
    if (USE_MOCK) {
      const agr = await mockStore.getAgreementById(agreementId);
      return agr.versions || [];
    }
    return apiClient.get(`/agreements/${agreementId}/versions`);
  },

  async createSnapshot(agreementId, summary) {
    if (USE_MOCK) {
      const agr = await mockStore.getAgreementById(agreementId);
      const user = await mockStore.getCurrentUser();
      const nextVer = `v${agr.versions.length + 1}.0`;
      const versionObj = {
        version: nextVer,
        createdAt: new Date().toISOString(),
        author: user.name,
        summary: summary || 'Manual snapshot saved',
      };
      agr.versions.push(versionObj);
      await mockStore.updateAgreement(agreementId, { versions: agr.versions });
      return versionObj;
    }
    return apiClient.post(`/agreements/${agreementId}/versions`, { summary });
  },
};
