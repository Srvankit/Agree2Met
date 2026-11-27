import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  LayoutGrid,
  List,
  Download,
  Share2,
  Archive,
  MoreVertical,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { IconButton } from '../../components/ui/Button/IconButton';
import { Card } from '../../components/ui/DataDisplay/Card';
import { StatusBadge } from '../../components/ui/DataDisplay/StatusBadge';
import { AvatarGroup } from '../../components/ui/DataDisplay/AvatarGroup';
import { Table } from '../../components/ui/DataDisplay/Table';
import { FilterBar } from '../../components/ui/Navigation/FilterBar';
import { Pagination } from '../../components/ui/Navigation/Pagination';
import { Dropdown } from '../../components/ui/Overlay/Dropdown';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { agreementsService, categoriesService } from '../../services';
import { formatCurrency, formatRelativeTime } from '../../utils/validators';
import styles from './Agreements.module.css';

export function AgreementsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrg } = useOrganization();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [agreements, setAgreements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter and pagination states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadAgreements = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const res = await agreementsService.list({
        orgId: currentOrg.id,
        search,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        page: currentPage,
        pageSize,
      });
      setAgreements(res.items || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch agreements:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, search, statusFilter, categoryFilter, currentPage, pageSize]);

  useEffect(() => {
    categoriesService.list().then(setCategories);
  }, []);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  const handleArchive = async (id, title) => {
    await agreementsService.archive(id);
    addToast({ title: 'Agreement Archived', message: `"${title}" moved to archive.`, type: 'info' });
    loadAgreements();
  };

  const handleBulkArchive = async () => {
    for (const id of selectedIds) {
      await agreementsService.archive(id);
    }
    addToast({ title: 'Bulk Archive Complete', message: `Archived ${selectedIds.length} agreements.`, type: 'info' });
    setSelectedIds([]);
    loadAgreements();
  };

  const handleBulkRemind = () => {
    addToast({
      title: 'Signature Reminders Dispatched',
      message: `Notification sent to all pending signers across ${selectedIds.length} contracts.`,
      type: 'success',
    });
  };

  const tableColumns = [
    {
      key: 'title',
      label: 'Agreement & ID',
      sortable: true,
      render: (row) => (
        <div
          className={styles.clickableCell}
          onClick={() => navigate(`/app/agreements/${row.id}`)}
        >
          <span className={styles.tableNumber}>{row.number}</span>
          <span className={styles.tableTitle}>{row.title}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'parties',
      label: 'Parties',
      render: (row) => (
        <AvatarGroup
          users={(row.parties || []).map((p) => ({ name: p.name }))}
          max={3}
          size="sm"
        />
      ),
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (row) => formatCurrency(row.value),
    },
    {
      key: 'updatedAt',
      label: 'Last Modified',
      sortable: true,
      render: (row) => (
        <span className={styles.dateCell}>{formatRelativeTime(row.updatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Dropdown
          align="right"
          trigger={<IconButton icon={MoreVertical} size="sm" variant="ghost" aria-label="Row options" />}
          items={[
            {
              id: 'view',
              label: 'View Agreement',
              icon: ExternalLink,
              onClick: () => navigate(`/app/agreements/${row.id}`),
            },
            {
              id: 'edit',
              label: 'Edit Draft Terms',
              icon: Sparkles,
              onClick: () => navigate(`/app/agreements/${row.id}/edit`),
            },
            {
              id: 'share',
              label: 'Share Guest Signing Link',
              icon: Share2,
              onClick: () => {
                const token = row.parties[0]?.token || 'tok_demo';
                navigator.clipboard.writeText(`${window.location.origin}/sign/${token}`);
                addToast({ title: 'Signing Link Copied', type: 'info' });
              },
            },
            { divider: true },
            {
              id: 'archive',
              label: 'Move to Archive',
              icon: Archive,
              danger: true,
              onClick: () => handleArchive(row.id, row.title),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Agreements Repository</h1>
          <p className={styles.subtitle}>
            Showing {totalItems} total contracts across all lifecycle stages.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              title="Table view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => navigate('/app/agreements/new')}
          >
            New Agreement
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by title, number, or counterparty..."
        filters={[
          {
            id: 'status',
            label: 'All Statuses',
            value: statusFilter,
            options: [
              { label: 'Draft', value: 'draft' },
              { label: 'In Review', value: 'in_review' },
              { label: 'Approved', value: 'approved' },
              { label: 'Awaiting Signatures', value: 'awaiting_signatures' },
              { label: 'Partially Signed', value: 'partially_signed' },
              { label: 'Signed', value: 'signed' },
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
              { label: 'Expired', value: 'expired' },
              { label: 'Disputed', value: 'disputed' },
            ],
            onChange: (v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            },
          },
          {
            id: 'category',
            label: 'All Categories',
            value: categoryFilter,
            options: (categories || []).map((c) => ({ label: c.name, value: c.id })),
            onChange: (v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            },
          },
        ]}
        activeCount={(statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0)}
        onClearAll={() => {
          setStatusFilter('');
          setCategoryFilter('');
          setSearch('');
          setCurrentPage(1);
        }}
      />

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBanner}>
          <div className={styles.bulkLeft}>
            <CheckSquare size={16} className={styles.bulkCheckIcon} />
            <span>
              <strong>{selectedIds.length}</strong> agreements selected
            </span>
          </div>
          <div className={styles.bulkRight}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={Send}
              onClick={handleBulkRemind}
            >
              Send Reminders
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={Download}
              onClick={() => addToast({ title: `Exported ${selectedIds.length} PDFs`, type: 'success' })}
            >
              Download
            </Button>
            <Button
              size="sm"
              variant="danger"
              leftIcon={Archive}
              onClick={handleBulkArchive}
            >
              Archive
            </Button>
          </div>
        </div>
      )}

      {/* Data Views */}
      {loading ? (
        <div className={styles.loadingBox}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="52px" borderRadius="8px" />
          ))}
        </div>
      ) : agreements.length === 0 ? (
        <EmptyState
          title="No agreements match your filter"
          description="Try broadening your search or resetting active status filters."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setCategoryFilter('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === 'table' ? (
        <Card noPadding>
          <Table
            columns={tableColumns}
            data={agreements}
            selectable
            selectedKeys={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </Card>
      ) : (
        /* Grid / Card View */
        <div className={styles.cardGrid}>
          {agreements.map((agr) => (
            <Card
              key={agr.id}
              className={styles.gridCard}
              onClick={() => navigate(`/app/agreements/${agr.id}`)}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardDocNumber}>{agr.number}</span>
                <StatusBadge status={agr.status} size="sm" />
              </div>

              <h3 className={styles.cardTitle}>{agr.title}</h3>
              <p className={styles.cardSummary}>{agr.summary || 'Standard terms as agreed.'}</p>

              <div className={styles.cardMeta}>
                <div>
                  <span className={styles.cardMetaLabel}>Contract Value</span>
                  <strong className={styles.cardMetaValue}>{formatCurrency(agr.value)}</strong>
                </div>
                <AvatarGroup
                  users={(agr.parties || []).map((p) => ({ name: p.name }))}
                  max={2}
                  size="sm"
                />
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardTimestamp}>
                  Updated {formatRelativeTime(agr.updatedAt)}
                </span>
                <ChevronRight size={16} className={styles.cardArrow} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && agreements.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
