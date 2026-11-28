import { request, ApiError } from './api';
import { isServiceReal } from './serviceMode';
import { load as loadMock, persist as persistMock, appendAudit } from './mock/index';

export interface AgreementCategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  isSystemDefault: boolean;
}

export interface AgreementPartyItem {
  id?: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  role: string;
  partyType?: string;
  status?: string;
  signingSequence?: number;
  signedAt?: string;
}

export interface AgreementClauseItem {
  id?: string;
  sectionNumber: string;
  title: string;
  content: string;
  isStandardClause?: boolean;
  isMandatory?: boolean;
  displayOrder: number;
}

export interface AgreementPaymentMilestone {
  name: string;
  percentage: number;
  amount?: number;
  status?: 'PENDING' | 'PAID';
}

export interface AgreementPaymentTerms {
  totalAmount?: number | null;
  currency?: string;
  paymentSchedule?: string;
  billingNotes?: string | null;
  milestones?: AgreementPaymentMilestone[];
}

export interface AgreementListItem {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  rowVersion?: number;
  category: {
    id: string;
    name: string;
    slug: string;
    iconName: string;
  };
  parties: AgreementPartyItem[];
  paymentTerms?: AgreementPaymentTerms;
  totalSignersCount: number;
  completedSignersCount: number;
  effectiveDate?: string;
  expirationDate?: string;
  isArchived?: boolean;
  createdAt: string;
}

export interface AgreementDetailItem extends AgreementListItem {
  description?: string;
  rowVersion: number;
  clauses: AgreementClauseItem[];
  versionCount?: number;
  auditTrail: {
    events: Array<{
      id: string;
      seq?: number;
      eventType: string;
      actorType: string;
      actorName: string;
      actorEmail: string;
      previousEventHash: string;
      eventHash: string;
      payload: any;
      createdAt: string;
    }>;
    verification: {
      isValid: boolean;
      eventCount: number;
      tamperedEventId?: string;
      reason?: string;
    };
  };
}

export interface AgreementVersionItem {
  id: string;
  versionNumber: number;
  changeSummary?: string;
  contentHash: string;
  createdAt: string;
  creator: {
    id: string;
    email: string;
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
}

export interface AgreementVersionDetailItem extends AgreementVersionItem {
  content: {
    title: string;
    description?: string;
    categoryId?: string;
    signingOrder?: string;
    effectiveDate?: string;
    expirationDate?: string;
    parties: AgreementPartyItem[];
    clauses: AgreementClauseItem[];
    paymentTerms?: AgreementPaymentTerms;
  };
}

export interface CreateAgreementInput {
  title: string;
  description?: string;
  categoryId?: string;
  signingOrder?: 'PARALLEL' | 'SEQUENTIAL';
  effectiveDate?: string | null;
  expirationDate?: string | null;
  parties?: AgreementPartyItem[];
  clauses?: AgreementClauseItem[];
  paymentTerms?: AgreementPaymentTerms | null;
  changeSummary?: string;
}

export interface UpdateAgreementInput extends CreateAgreementInput {
  expectedRowVersion: number;
}

export interface AutosaveAgreementInput {
  expectedRowVersion: number;
  title?: string;
  description?: string | null;
  categoryId?: string;
  signingOrder?: 'PARALLEL' | 'SEQUENTIAL';
  effectiveDate?: string | null;
  expirationDate?: string | null;
  parties?: AgreementPartyItem[];
  clauses?: AgreementClauseItem[];
  paymentTerms?: AgreementPaymentTerms | null;
}

export interface ListAgreementsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  sortBy?: 'createdAt' | 'title' | 'status' | 'expirationDate';
  sortOrder?: 'asc' | 'desc';
}

export const agreementsService = {
  isReal(): boolean {
    return isServiceReal('agreements') || isServiceReal('agreements-read');
  },

  isWriteReal(): boolean {
    return isServiceReal('agreements') || isServiceReal('agreements-write');
  },

  async getCategories(orgId?: string): Promise<AgreementCategoryItem[]> {
    if (!this.isReal()) {
      const mockData = loadMock();
      return (mockData.categories || []).map((name: string, i: number) => ({
        id: `mock-cat-${i + 1}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        iconName: 'FileText',
        isSystemDefault: true,
      }));
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: AgreementCategoryItem[] }>('/agreement-categories', {
      method: 'GET',
      headers,
    });
    return res.data;
  },

  async getAgreements(
    params?: ListAgreementsParams,
    orgId?: string
  ): Promise<{ data: AgreementListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    if (!this.isReal()) {
      const mockData = loadMock();
      const rawList = mockData.agreements || [];
      return {
        data: rawList.map((a: any) => ({
          id: a.id,
          referenceNumber: a.id,
          title: a.title,
          status: a.status.toUpperCase().replace(/\s+/g, '_'),
          rowVersion: a.rowVersion || 1,
          category: {
            id: 'mock-cat',
            name: a.category,
            slug: (a.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            iconName: 'FileText',
          },
          parties: [{ id: 'p1', name: a.client, email: 'client@example.com', role: 'SIGNER', status: 'PENDING', signingSequence: 1 }],
          paymentTerms: { totalAmount: a.value || 0, currency: 'USD', paymentSchedule: 'MILESTONE' },
          totalSignersCount: 2,
          completedSignersCount: a.status === 'Completed' ? 2 : 1,
          isArchived: a.archived || false,
          createdAt: a.created || new Date().toISOString(),
        })),
        meta: {
          total: rawList.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: Math.ceil(rawList.length / (params?.limit || 10)) || 1,
        },
      };
    }

    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ data: AgreementListItem[]; meta: any }>(`/agreements${queryString}`, {
      method: 'GET',
      headers,
    });
    return { data: res.data, meta: res.meta };
  },

  async getAgreementById(id: string, orgId?: string): Promise<AgreementDetailItem> {
    if (!this.isReal()) {
      const mockData = loadMock();
      const a = (mockData.agreements || []).find((x: any) => x.id === id);
      if (!a) throw new ApiError('Agreement not found in mock store.', 404, 'NOT_FOUND');
      return {
        id: a.id,
        referenceNumber: a.id,
        title: a.title,
        status: a.status.toUpperCase().replace(/\s+/g, '_'),
        rowVersion: a.rowVersion || 1,
        category: { id: 'mock-cat', name: a.category, slug: 'cat', iconName: 'FileText' },
        parties: a.parties || [],
        clauses: (a.clauses || []).map((c: any, i: number) => ({
          sectionNumber: `${i + 1}.0`,
          title: c.title || `Clause ${i + 1}`,
          content: c.text || c.content || '',
          displayOrder: i + 1,
        })),
        paymentTerms: { totalAmount: a.value || 0, currency: 'USD', paymentSchedule: 'MILESTONE' },
        totalSignersCount: 2,
        completedSignersCount: a.status === 'Completed' ? 2 : 1,
        isArchived: a.archived || false,
        createdAt: a.created,
        versionCount: a.versions?.length || 1,
        auditTrail: { events: a.audit || [], verification: { isValid: true, eventCount: a.audit?.length || 0 } },
      };
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: AgreementDetailItem }>(`/agreements/${id}`, {
      method: 'GET',
      headers,
    });
    return res.data;
  },

  async createAgreement(
    payload: CreateAgreementInput,
    idempotencyKey?: string,
    orgId?: string
  ): Promise<AgreementDetailItem> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

      const res = await request<{ data: AgreementDetailItem }>('/agreements', {
        method: 'POST',
        headers,
        body: payload,
      });
      return res.data;
    }

    // Mock Mode Creation
    const mockData = loadMock();
    const id = `AG-2026-${Date.now()}`;
    const newMock = {
      id,
      title: payload.title,
      description: payload.description,
      status: 'Draft',
      category: 'General Agreement',
      value: payload.paymentTerms?.totalAmount || 0,
      client: payload.parties?.[0]?.name || 'Counterparty',
      parties: payload.parties || [],
      clauses: payload.clauses || [],
      created: new Date().toISOString().slice(0, 10),
      rowVersion: 1,
      audit: [{ action: 'Agreement created', actor: 'Alex Morgan', date: new Date().toISOString(), hash: 'mock-hash' }],
      versions: [{ name: 'v1.0 (Initial)', text: 'Initial draft.' }],
      archived: false,
    };
    mockData.agreements = [newMock, ...(mockData.agreements || [])];
    persistMock(mockData);
    return this.getAgreementById(id);
  },

  async updateAgreement(
    id: string,
    payload: UpdateAgreementInput,
    orgId?: string
  ): Promise<AgreementDetailItem> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: AgreementDetailItem }>(`/agreements/${id}`, {
        method: 'PUT',
        headers,
        body: payload,
      });
      return res.data;
    }

    // Mock Mode Update
    const mockData = loadMock();
    const a = (mockData.agreements || []).find((x: any) => x.id === id);
    if (!a) throw new ApiError('Agreement not found in mock store.', 404, 'NOT_FOUND');
    a.title = payload.title;
    a.description = payload.description;
    a.parties = payload.parties || a.parties;
    a.clauses = payload.clauses || a.clauses;
    a.rowVersion = (a.rowVersion || 1) + 1;
    persistMock(mockData);
    return this.getAgreementById(id);
  },

  async autosaveAgreement(
    id: string,
    payload: AutosaveAgreementInput,
    orgId?: string
  ): Promise<{ id: string; rowVersion: number; savedAt: string }> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: { id: string; rowVersion: number; savedAt: string } }>(
        `/agreements/${id}/autosave`,
        {
          method: 'PATCH',
          headers,
          body: payload,
        }
      );
      return res.data;
    }

    // Mock Mode Autosave
    const mockData = loadMock();
    const a = (mockData.agreements || []).find((x: any) => x.id === id);
    if (a) {
      if (payload.title) a.title = payload.title;
      if (payload.parties) a.parties = payload.parties;
      if (payload.clauses) a.clauses = payload.clauses;
      a.rowVersion = (a.rowVersion || 1) + 1;
      persistMock(mockData);
      return { id, rowVersion: a.rowVersion, savedAt: new Date().toISOString() };
    }
    return { id, rowVersion: (payload.expectedRowVersion || 1) + 1, savedAt: new Date().toISOString() };
  },

  async changeStatus(
    id: string,
    status: string,
    reason?: string,
    orgId?: string
  ): Promise<AgreementDetailItem> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: AgreementDetailItem }>(`/agreements/${id}/status`, {
        method: 'PATCH',
        headers,
        body: { status, reason },
      });
      return res.data;
    }

    // Mock Mode Status Change
    const mockData = loadMock();
    const a = (mockData.agreements || []).find((x: any) => x.id === id);
    if (!a) throw new ApiError('Agreement not found in mock store.', 404, 'NOT_FOUND');
    a.status = status;
    const event = await appendAudit(a, `Status transitioned to ${status}${reason ? `: ${reason}` : ''}`);
    a.audit = [...(a.audit || []), event];
    persistMock(mockData);
    return this.getAgreementById(id);
  },

  async duplicateAgreement(id: string, orgId?: string): Promise<AgreementDetailItem> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: AgreementDetailItem }>(`/agreements/${id}/duplicate`, {
        method: 'POST',
        headers,
      });
      return res.data;
    }

    // Mock Mode Duplication
    const mockData = loadMock();
    const a = (mockData.agreements || []).find((x: any) => x.id === id);
    if (!a) throw new ApiError('Agreement not found in mock store.', 404, 'NOT_FOUND');
    const newId = `AG-2026-${Date.now()}`;
    const copy = {
      ...structuredClone(a),
      id: newId,
      title: `Copy of ${a.title}`,
      status: 'Draft',
      rowVersion: 1,
      archived: false,
    };
    mockData.agreements = [copy, ...(mockData.agreements || [])];
    persistMock(mockData);
    return this.getAgreementById(newId);
  },

  async archiveAgreement(id: string, archive = true, orgId?: string): Promise<AgreementDetailItem> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: AgreementDetailItem }>(
        `/agreements/${id}/${archive ? 'archive' : 'unarchive'}`,
        {
          method: 'POST',
          headers,
        }
      );
      return res.data;
    }

    // Mock Mode Archive
    const mockData = loadMock();
    const a = (mockData.agreements || []).find((x: any) => x.id === id);
    if (a) {
      a.archived = archive;
      persistMock(mockData);
    }
    return this.getAgreementById(id);
  },

  async deleteAgreement(id: string, orgId?: string): Promise<void> {
    if (this.isWriteReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      await request(`/agreements/${id}`, {
        method: 'DELETE',
        headers,
      });
      return;
    }

    // Mock Mode Delete
    const mockData = loadMock();
    mockData.agreements = (mockData.agreements || []).filter((x: any) => x.id !== id);
    persistMock(mockData);
  },

  async getVersions(id: string, orgId?: string): Promise<AgreementVersionItem[]> {
    if (this.isReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: AgreementVersionItem[] }>(`/agreements/${id}/versions`, {
        method: 'GET',
        headers,
      });
      return res.data;
    }

    // Mock Mode Versions
    return [
      {
        id: 'mock-v1',
        versionNumber: 1,
        changeSummary: 'Initial version created',
        contentHash: '0'.repeat(64),
        createdAt: new Date().toISOString(),
        creator: {
          id: 'usr-1',
          email: 'alex@agree2met.com',
          profile: { displayName: 'Alex Morgan' },
        },
      },
    ];
  },

  async getVersion(
    id: string,
    versionNumber: number,
    orgId?: string
  ): Promise<AgreementVersionDetailItem> {
    if (this.isReal()) {
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Organization-ID'] = orgId;

      const res = await request<{ data: AgreementVersionDetailItem }>(
        `/agreements/${id}/versions/${versionNumber}`,
        {
          method: 'GET',
          headers,
        }
      );
      return res.data;
    }

    // Mock Mode Version Detail
    return {
      id: `mock-v${versionNumber}`,
      versionNumber,
      changeSummary: 'Mock version snapshot',
      contentHash: '0'.repeat(64),
      createdAt: new Date().toISOString(),
      creator: {
        id: 'usr-1',
        email: 'alex@agree2met.com',
        profile: { displayName: 'Alex Morgan' },
      },
      content: {
        title: 'Mock Agreement Title',
        description: 'Mock Description',
        parties: [],
        clauses: [],
      },
    };
  },
};
