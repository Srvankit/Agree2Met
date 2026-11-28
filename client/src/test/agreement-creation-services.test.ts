import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../services/api';
import { agreementsService } from '../services/agreementsService';
import { categoriesService } from '../services/categoriesService';

describe('Phase 5 Agreement Creation & Categories Services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('categoriesService', () => {
    it('fetches categories from GET /categories in real mode', async () => {
      const mockCats = [
        { id: 'cat-1', name: 'Non-Disclosure Agreement', slug: 'nda', iconName: 'FileText', isSystemDefault: true },
        { id: 'cat-2', name: 'Master Services Agreement', slug: 'msa', iconName: 'FileText', isSystemDefault: true },
      ];

      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockCats,
      });

      const res = await categoriesService.getCategories('org-123');
      expect(res).toEqual(mockCats);
      expect(spy).toHaveBeenCalledWith('/categories', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'org-123' },
      });
    });

    it('fetches template clauses from GET /categories/:id/template-clauses', async () => {
      const mockClauses = [
        { id: 'tc-1', sectionNumber: '1.0', title: 'Confidentiality', content: 'Clause text', isMandatory: true, displayOrder: 1 },
      ];

      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockClauses,
      });

      const res = await categoriesService.getTemplateClauses('cat-1', 'org-123');
      expect(res).toEqual(mockClauses);
      expect(spy).toHaveBeenCalledWith('/categories/cat-1/template-clauses', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'org-123' },
      });
    });
  });

  describe('agreementsService write operations', () => {
    it('creates an agreement with POST /agreements and passes Idempotency-Key', async () => {
      const payload = {
        title: 'Master Service Agreement',
        categoryId: 'cat-1',
        parties: [{ name: 'Alice', email: 'alice@example.com', role: 'PRIMARY' }],
        clauses: [{ sectionNumber: '1.0', title: 'Scope', content: 'Work scope', displayOrder: 1 }],
      };

      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-1', referenceNumber: 'A2M-2026-0001', ...payload, rowVersion: 1 },
      });

      const res = await agreementsService.createAgreement(payload, 'idem-uuid-999', 'org-123');
      expect(res.id).toBe('agr-1');
      expect(spy).toHaveBeenCalledWith('/agreements', {
        method: 'POST',
        headers: {
          'X-Organization-ID': 'org-123',
          'Idempotency-Key': 'idem-uuid-999',
        },
        body: payload,
      });
    });

    it('updates an agreement with PUT /agreements/:id including expectedRowVersion', async () => {
      const payload = {
        title: 'Updated MSA',
        expectedRowVersion: 1,
      };

      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-1', title: 'Updated MSA', rowVersion: 2 },
      });

      const res = await agreementsService.updateAgreement('agr-1', payload, 'org-123');
      expect(res.rowVersion).toBe(2);
      expect(spy).toHaveBeenCalledWith('/agreements/agr-1', {
        method: 'PUT',
        headers: { 'X-Organization-ID': 'org-123' },
        body: payload,
      });
    });

    it('autosaves an agreement with PATCH /agreements/:id/autosave', async () => {
      const payload = {
        expectedRowVersion: 2,
        title: 'Autosaved MSA Title',
      };

      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-1', rowVersion: 3, savedAt: '2026-11-28T12:00:00Z' },
      });

      const res = await agreementsService.autosaveAgreement('agr-1', payload, 'org-123');
      expect(res.rowVersion).toBe(3);
      expect(spy).toHaveBeenCalledWith('/agreements/agr-1/autosave', {
        method: 'PATCH',
        headers: { 'X-Organization-ID': 'org-123' },
        body: payload,
      });
    });

    it('transitions agreement status with PATCH /agreements/:id/status', async () => {
      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-1', status: 'PENDING_REVIEW' },
      });

      const res = await agreementsService.changeStatus('agr-1', 'PENDING_REVIEW', 'Ready for legal review', 'org-123');
      expect(res.status).toBe('PENDING_REVIEW');
      expect(spy).toHaveBeenCalledWith('/agreements/agr-1/status', {
        method: 'PATCH',
        headers: { 'X-Organization-ID': 'org-123' },
        body: { status: 'PENDING_REVIEW', reason: 'Ready for legal review' },
      });
    });

    it('duplicates an agreement with POST /agreements/:id/duplicate', async () => {
      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-copy', title: 'Master Service Agreement (Copy)', status: 'DRAFT' },
      });

      const res = await agreementsService.duplicateAgreement('agr-1', 'org-123');
      expect(res.id).toBe('agr-copy');
      expect(spy).toHaveBeenCalledWith('/agreements/agr-1/duplicate', {
        method: 'POST',
        headers: { 'X-Organization-ID': 'org-123' },
      });
    });

    it('archives and unarchives an agreement', async () => {
      const archiveSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-1', isArchived: true },
      });

      await agreementsService.archiveAgreement('agr-1', true, 'org-123');
      expect(archiveSpy).toHaveBeenCalledWith('/agreements/agr-1/archive', {
        method: 'POST',
        headers: { 'X-Organization-ID': 'org-123' },
      });

      const unarchiveSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: { id: 'agr-1', isArchived: false },
      });

      await agreementsService.archiveAgreement('agr-1', false, 'org-123');
      expect(unarchiveSpy).toHaveBeenCalledWith('/agreements/agr-1/unarchive', {
        method: 'POST',
        headers: { 'X-Organization-ID': 'org-123' },
      });
    });

    it('deletes an agreement with DELETE /agreements/:id', async () => {
      const spy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
      });

      await agreementsService.deleteAgreement('agr-1', 'org-123');
      expect(spy).toHaveBeenCalledWith('/agreements/agr-1', {
        method: 'DELETE',
        headers: { 'X-Organization-ID': 'org-123' },
      });
    });

    it('retrieves version history and specific version snapshots', async () => {
      const mockVersions = [
        { id: 'v-1', versionNumber: 1, changeSummary: 'Initial baseline', contentHash: 'abc', createdAt: '2026-11-28' },
      ];

      const listSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockVersions,
      });

      const versions = await agreementsService.getVersions('agr-1', 'org-123');
      expect(versions).toEqual(mockVersions);
      expect(listSpy).toHaveBeenCalledWith('/agreements/agr-1/versions', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'org-123' },
      });

      const mockSnapshot = {
        id: 'v-1',
        versionNumber: 1,
        content: { title: 'Agreement Title', clauses: [] },
      };

      const detailSpy = vi.spyOn(api, 'request').mockResolvedValueOnce({
        success: true,
        data: mockSnapshot,
      });

      const snapshot = await agreementsService.getVersion('agr-1', 1, 'org-123');
      expect(snapshot).toEqual(mockSnapshot);
      expect(detailSpy).toHaveBeenCalledWith('/agreements/agr-1/versions/1', {
        method: 'GET',
        headers: { 'X-Organization-ID': 'org-123' },
      });
    });
  });
});
