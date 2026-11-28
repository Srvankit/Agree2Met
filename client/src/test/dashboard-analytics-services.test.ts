import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isServiceReal } from '../services/serviceMode';
import { dashboardService } from '../services/dashboardService';
import { analyticsService } from '../services/analyticsService';
import { agreementsService } from '../services/agreementsService';
import * as api from '../services/api';

describe('Frontend Dashboard & Analytics Services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Mode Resolution', () => {
    it('resolves dashboard, analytics, and agreements as real services by default', () => {
      expect(isServiceReal('dashboard')).toBe(true);
      expect(isServiceReal('analytics')).toBe(true);
      expect(isServiceReal('agreements')).toBe(true);
      expect(isServiceReal('agreements-read')).toBe(true);
      expect(dashboardService.isReal()).toBe(true);
      expect(analyticsService.isReal()).toBe(true);
      expect(agreementsService.isReal()).toBe(true);
    });
  });

  describe('Dashboard Service', () => {
    it('calls GET /dashboard/stats with X-Organization-ID header when real', async () => {
      const mockStats = {
        total: 62,
        completed: 16,
        running: 23,
        pendingSignatures: 10,
        expired: 4,
        completionRate: 25.8,
        avgTurnaroundHours: 32.5,
        deltas: {
          total: 10,
          completed: 5,
          running: 2,
          pendingSignatures: 0,
          expired: 0,
          completionRate: 2.5,
          avgTurnaroundHours: -1.2,
        },
      };

      const requestSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockStats,
      });

      const stats = await dashboardService.getStats('test-org-uuid');
      expect(stats.total).toBe(62);
      expect(stats.completed).toBe(16);
      expect(requestSpy).toHaveBeenCalledWith('/dashboard/stats', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'test-org-uuid' },
      });
    });

    it('calls GET /dashboard/deadlines with days parameter', async () => {
      const requestSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'agr-1',
            referenceNumber: 'ACM-2026-001',
            title: 'Sample SOW',
            status: 'AWAITING_SIGNATURES',
            expirationDate: '2026-12-15',
            categoryName: 'Statement of Work',
            categorySlug: 'sow',
            daysRemaining: 18,
          },
        ],
      });

      const deadlines = await dashboardService.getDeadlines(30, 'test-org-uuid');
      expect(deadlines).toHaveLength(1);
      expect(deadlines[0].daysRemaining).toBe(18);
      expect(requestSpy).toHaveBeenCalledWith('/dashboard/deadlines?days=30', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'test-org-uuid' },
      });
    });
  });

  describe('Analytics Service', () => {
    it('calls GET /analytics/overview with query parameters', async () => {
      const mockOverview = {
        summary: { totalCreated: 62, totalCompleted: 16, totalValue: 450000, completionRate: 25.8 },
        timeSeries: [{ period: '2026-11-01', created: 10, completed: 4 }],
        statusDistribution: [{ status: 'COMPLETED', count: 16, percentage: 25.8 }],
        categoryDistribution: [],
        turnaroundMetrics: { avgTurnaroundHours: 32.5, medianTurnaroundHours: 24.0, minTurnaroundHours: 6.0, maxTurnaroundHours: 96.0 },
        signerMetrics: { avgSignerResponseHours: 12.0 },
      };

      const requestSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockOverview,
      });

      const overview = await analyticsService.getOverview({ granularity: 'month' }, 'test-org-uuid');
      expect(overview.summary.totalCreated).toBe(62);
      expect(requestSpy).toHaveBeenCalledWith('/analytics/overview?granularity=month', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'test-org-uuid' },
      });
    });
  });

  describe('Agreements Service & Safe Disabled Writes', () => {
    it('calls GET /agreements with pagination and search query', async () => {
      const requestSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: [{ id: 'agr-1', referenceNumber: 'ACM-2026-001', title: 'Acme NDA', status: 'DRAFT', parties: [], totalSignersCount: 1, completedSignersCount: 0, createdAt: '2026-11-20' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const res = await agreementsService.getAgreements({ search: 'Acme', page: 1, limit: 10 }, 'test-org-uuid');
      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
      expect(requestSpy).toHaveBeenCalledWith('/agreements?page=1&limit=10&search=Acme', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'test-org-uuid' },
      });
    });

    it('calls GET /agreements/:id for single agreement detail', async () => {
      const mockDetail = {
        id: 'agr-1',
        referenceNumber: 'ACM-2026-001',
        title: 'Acme NDA',
        status: 'DRAFT',
        parties: [],
        clauses: [],
        auditTrail: { events: [], verification: { isValid: true, eventCount: 0 } },
      };

      const requestSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockDetail,
      });

      const detail = await agreementsService.getAgreementById('agr-1', 'test-org-uuid');
      expect(detail.id).toBe('agr-1');
      expect(requestSpy).toHaveBeenCalledWith('/agreements/agr-1', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'test-org-uuid' },
      });
    });

    it('enforces safe disabled writes in real mode and throws typed NOT_AVAILABLE_YET error', async () => {
      await expect(agreementsService.createAgreement()).rejects.toThrow(
        'Agreement creation will be available in an upcoming release (Phase 5).'
      );
      await expect(agreementsService.updateAgreement()).rejects.toThrow(
        'Agreement modification will be available in an upcoming release (Phase 5).'
      );
      await expect(agreementsService.deleteAgreement()).rejects.toThrow(
        'Agreement deletion will be available in an upcoming release (Phase 5).'
      );
    });
  });
});
