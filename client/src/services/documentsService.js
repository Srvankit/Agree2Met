import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const documentsService = {
  async listByAgreement(agreementId) {
    if (USE_MOCK) {
      const agr = await mockStore.getAgreementById(agreementId);
      return agr.documents || [];
    }
    return apiClient.get(`/agreements/${agreementId}/documents`);
  },

  async upload(agreementId, file) {
    if (USE_MOCK) {
      const agr = await mockStore.getAgreementById(agreementId);
      const doc = {
        id: `doc-${Date.now().toString(36)}`,
        name: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'ready',
      };
      agr.documents.push(doc);
      await mockStore.updateAgreement(agreementId, { documents: agr.documents });
      return doc;
    }
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/agreements/${agreementId}/documents`, formData);
  },
};
