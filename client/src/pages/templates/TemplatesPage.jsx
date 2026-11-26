import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2,
  Plus,
  Search,
  Eye,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Badge } from '../../components/ui/DataDisplay/Badge';
import { Modal } from '../../components/ui/Overlay/Modal';
import { Select } from '../../components/ui/Form/Select';
import { Textarea } from '../../components/ui/Input/Textarea';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { templatesService, categoriesService } from '../../services';
import styles from './TemplatesPage.module.css';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('ALL');

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Create template modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClausesText, setNewClausesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tmplList, catList] = await Promise.all([
        templatesService.list(),
        categoriesService.list(),
      ]);
      setTemplates(tmplList || []);
      setCategories(catList || []);
      if (catList && catList.length > 0) {
        setNewCategory(catList[0].id);
      }
    } catch {
      showToast({ title: 'Failed to load templates', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (selectedCatId === 'ALL') return true;
      return t.categoryId === selectedCatId;
    });
  }, [templates, search, selectedCatId]);

  const handleUseTemplate = (template) => {
    navigate(`/app/agreements/new?template=${template.id}`);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast({ title: 'Template title is required', variant: 'warning' });
      return;
    }
    try {
      setIsSubmitting(true);
      const clauses = newClausesText
        .split('\n\n')
        .filter((block) => block.trim())
        .map((block, idx) => ({
          id: `c${idx + 1}`,
          title: `Clause ${idx + 1}`,
          content: block.trim(),
        }));

      const newTmpl = {
        id: `tmpl-${Date.now().toString(36)}`,
        title: newTitle.trim(),
        description: newDescription.trim() || 'Custom organizational agreement template.',
        categoryId: newCategory,
        orgId: currentOrg?.id || 'org-acme',
        clausesCount: clauses.length || 1,
        defaultClauses: clauses.length > 0 ? clauses : [
          { id: 'c1', title: '1. Purpose', content: 'The parties agree to the following business terms.' },
        ],
      };

      setTemplates((prev) => [newTmpl, ...prev]);
      showToast({ title: `Template "${newTmpl.title}" created`, variant: 'success' });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewClausesText('');
    } catch {
      showToast({ title: 'Could not create template', variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Template Library</h1>
          <p className={styles.subtitle}>
            Standardized, vetted agreements ready to deploy or customize for {currentOrg?.name}.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Template
        </Button>
      </div>

      {/* Search and Category Filter Pills */}
      <div className={styles.filterControls}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="Search templates by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search size={16} />}
          />
        </div>
        <div className={styles.categoryPills}>
          <button
            type="button"
            className={`${styles.catPill} ${selectedCatId === 'ALL' ? styles.catPillActive : ''}`}
            onClick={() => setSelectedCatId('ALL')}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.catPill} ${selectedCatId === cat.id ? styles.catPillActive : ''}`}
              onClick={() => setSelectedCatId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className={styles.grid}>
          <Skeleton height="220px" />
          <Skeleton height="220px" />
          <Skeleton height="220px" />
          <Skeleton height="220px" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No templates match your filters"
          description="Try choosing another category or create a custom agreement template for your team."
          actionLabel="Create Custom Template"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className={styles.grid}>
          {filteredTemplates.map((template) => {
            const cat = categories.find((c) => c.id === template.categoryId);
            return (
              <div key={template.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <FileCode2 size={20} />
                  </div>
                  {cat && <Badge variant="neutral">{cat.name}</Badge>}
                </div>
                <h3 className={styles.cardTitle}>{template.title}</h3>
                <p className={styles.cardDesc}>{template.description}</p>
                <div className={styles.cardMeta}>
                  <span>{template.clausesCount || template.defaultClauses?.length || 0} Clauses</span>
                  <span>&bull;</span>
                  <span>Standard Legal Terms</span>
                </div>
                <div className={styles.cardActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Eye size={14} />}
                    onClick={() => setPreviewTemplate(template)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight size={14} />}
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.title || 'Template Preview'}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {previewTemplate?.description}
          </p>
          <div className={styles.previewBody}>
            {(previewTemplate?.defaultClauses || []).map((clause) => (
              <div key={clause.id} className={styles.clauseBox}>
                <div className={styles.clauseTitle}>{clause.title}</div>
                <div className={styles.clauseContent}>{clause.content}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px' }}>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={<ArrowRight size={14} />}
              onClick={() => {
                const tmpl = previewTemplate;
                setPreviewTemplate(null);
                handleUseTemplate(tmpl);
              }}
            >
              Start Agreement with Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Custom Template Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Standard Template"
        size="md"
      >
        <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="template-title"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Template Title *
            </label>
            <Input
              id="template-title"
              placeholder="e.g. Mutual Data Processing Addendum (DPA)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="template-category"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Category
            </label>
            <Select
              id="template-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div>
            <label
              htmlFor="template-description"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Description
            </label>
            <Input
              id="template-description"
              placeholder="Brief summary of what this contract governs"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="template-clauses"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Clauses (Separate each clause with a blank line)
            </label>
            <Textarea
              id="template-clauses"
              rows={6}
              placeholder="Clause 1: Scope of Data Processing...&#10;&#10;Clause 2: Security Measures & Audit Rights..."
              value={newClausesText}
              onChange={(e) => setNewClausesText(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Save Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
