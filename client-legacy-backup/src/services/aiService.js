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

  async chat(prompt) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        reply: `Regarding "${prompt}": Under standard commercial contracting standards, obligations should be explicitly bounded by time, materiality thresholds, and reciprocal remedies. In electronic agreements, ensure party consent and audit log integrity are documented before signing.`,
        disclaimer: 'Agree2Met AI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional.',
      };
    }
    return apiClient.post('/ai/chat', { prompt });
  },
};
