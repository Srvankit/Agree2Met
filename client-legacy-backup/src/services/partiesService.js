import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const partiesService = {
  async addParty(agreementId, party) {
    if (USE_MOCK) {
      const agr = await mockStore.getAgreementById(agreementId);
      const newParty = {
        id: `p-${Date.now().toString(36)}`,
        ...party,
        status: 'pending',
        token: `tok_${Math.random().toString(36).substring(2, 12)}`,
      };
      agr.parties.push(newParty);
      await mockStore.updateAgreement(agreementId, { parties: agr.parties });
      return newParty;
    }
    return apiClient.post(`/agreements/${agreementId}/parties`, party);
  },

  async removeParty(agreementId, partyId) {
    if (USE_MOCK) {
      const agr = await mockStore.getAgreementById(agreementId);
      const filtered = agr.parties.filter((p) => p.id !== partyId);
      await mockStore.updateAgreement(agreementId, { parties: filtered });
      return { success: true };
    }
    return apiClient.delete(`/agreements/${agreementId}/parties/${partyId}`);
  },
};
