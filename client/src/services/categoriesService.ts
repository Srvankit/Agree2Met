import { request } from './api';
import { isServiceReal } from './serviceMode';
import { load as loadMock } from './mock/index';

export interface CategoryClauseItem {
  id: string;
  sectionNumber: string;
  title: string;
  content: string;
  isMandatory: boolean;
  displayOrder: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  isSystemDefault: boolean;
  _count?: { templateClauses: number };
}

export const categoriesService = {
  isReal(): boolean {
    return isServiceReal('categories');
  },

  async getCategories(orgId?: string): Promise<CategoryItem[]> {
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

    const res = await request<{ data: CategoryItem[] }>('/categories', {
      method: 'GET',
      headers,
    });
    return res.data;
  },

  async getTemplateClauses(categoryId: string, orgId?: string): Promise<CategoryClauseItem[]> {
    if (!this.isReal()) {
      return [
        {
          id: 'mock-clause-1',
          sectionNumber: '1.0',
          title: 'Scope of Agreement',
          content: 'The parties agree to the terms, obligations, and deliverables set forth in this agreement.',
          isMandatory: true,
          displayOrder: 1,
        },
        {
          id: 'mock-clause-2',
          sectionNumber: '2.0',
          title: 'Confidentiality',
          content: 'Each party agrees to maintain strict confidentiality regarding all proprietary information disclosed.',
          isMandatory: true,
          displayOrder: 2,
        },
      ];
    }

    const headers: Record<string, string> = {};
    if (orgId) headers['X-Organization-ID'] = orgId;

    const res = await request<{ data: CategoryClauseItem[] }>(`/categories/${categoryId}/template-clauses`, {
      method: 'GET',
      headers,
    });
    return res.data;
  },
};
