import { mockStore } from './mock/mockStore';
import { apiClient } from './api';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const aiService = {
  async draftClause(prompt, clauseType) {
    if (USE_MOCK) return mockStore.draftClauseWithAI(prompt, clauseType);
    return apiClient.post('/ai/draft-clause', { prompt, clauseType });
  },

  async analyzeRisks(agreementId) {
    if (USE_MOCK) return mockStore.analyzeRisksWithAI(agreementId);
    return apiClient.get(`/ai/analyze-risks?agreementId=${agreementId}`);
  },
};
