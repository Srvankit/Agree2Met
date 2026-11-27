import { request, ApiError } from './api';
import { isServiceReal } from './serviceMode';
import { load as loadMock } from './mock/index';

export interface AgreementCategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  isSystemDefault: boolean;
}

export interface AgreementPartyItem {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  role: string;
  status: string;
  signingSequence: number;
  signedAt?: string;
}

export interface AgreementListItem {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  category: {
    id: string;
    name: string;
    slug: string;
    iconName: string;
  };
  parties: AgreementPartyItem[];
  paymentTerms?: {
    totalAmount: number;
    currency: string;
    paymentSchedule: string;
  };
  totalSignersCount: number;
  completedSignersCount: number;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
}

export interface AgreementDetailItem extends AgreementListItem {
  description?: string;
  clauses: Array<{
    id: string;
    sectionNumber: string;
    title: string;
    content: string;
    isStandardClause: boolean;
    isMandatory: boolean;
    displayOrder: number;
  }>;
  auditTrail: {
    events: Array<{
      id: string;
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
        category: { id: 'mock-cat', name: a.category, slug: 'cat', iconName: 'FileText' },
        parties: [],
        clauses: [],
        totalSignersCount: 2,
        completedSignersCount: 1,
        createdAt: a.created,
        auditTrail: { events: [], verification: { isValid: true, eventCount: 0 } },
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

  // Safe Disabled Writes for Phase 4: Never fake writes silently in real mode!
  async createAgreement(): Promise<never> {
    if (this.isReal()) {
      throw new ApiError(
        'Agreement creation will be available in an upcoming release (Phase 5).',
        501,
        'NOT_AVAILABLE_YET'
      );
    }
    throw new ApiError('Mock write not supported directly here.', 501);
  },

  async updateAgreement(): Promise<never> {
    if (this.isReal()) {
      throw new ApiError(
        'Agreement modification will be available in an upcoming release (Phase 5).',
        501,
        'NOT_AVAILABLE_YET'
      );
    }
    throw new ApiError('Mock write not supported directly here.', 501);
  },

  async deleteAgreement(): Promise<never> {
    if (this.isReal()) {
      throw new ApiError(
        'Agreement deletion will be available in an upcoming release (Phase 5).',
        501,
        'NOT_AVAILABLE_YET'
      );
    }
    throw new ApiError('Mock write not supported directly here.', 501);
  },
};
