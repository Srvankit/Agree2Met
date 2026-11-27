import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Trash2,
  FileText,
} from 'lucide-react';
import { Card } from '../../components/ui/DataDisplay/Card';
import { StatusBadge } from '../../components/ui/DataDisplay/StatusBadge';
import { Button } from '../../components/ui/Button/Button';
import { Table } from '../../components/ui/DataDisplay/Table';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { Banner } from '../../components/ui/Feedback/Banner';
import { ConfirmDialog } from '../../components/ui/Overlay/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { agreementsService } from '../../services';
import { formatCurrency, formatRelativeTime } from '../../utils/validators';
import styles from './Archive.module.css';

export function ArchivePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadArchived = useCallback(async () => {
    setLoading(true);
    try {
      const items = await agreementsService.listArchived();
      setArchived(items);
    } catch (err) {
      console.error('Failed to load archived contracts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  const handleUnarchive = async (id, title) => {
    await agreementsService.unarchive(id);
    addToast({
      title: 'Agreement Restored',
      message: `"${title}" has been restored to your active repository.`,
      type: 'success',
    });
    loadArchived();
  };

  const handleHardDelete = async () => {
    if (!deleteTarget) return;
    await agreementsService.hardDelete(deleteTarget.id);
    addToast({
      title: 'Permanently Deleted',
      message: `"${deleteTarget.title}" and its hash chain have been permanently removed.`,
      type: 'error',
    });
    setDeleteTarget(null);
    loadArchived();
  };

  const tableColumns = [
    {
      key: 'title',
      label: 'Agreement',
      render: (row) => (
        <div>
          <span className={styles.docNumber}>{row.number}</span>
          <div className={styles.docTitle}>{row.title}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Archived Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'value',
      label: 'Value',
      render: (row) => formatCurrency(row.value),
    },
    {
      key: 'archivedAt',
      label: 'Archived Date',
      render: (row) => formatRelativeTime(row.archivedAt || row.updatedAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={RotateCcw}
            onClick={() => handleUnarchive(row.id, row.title)}
          >
            Restore
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={Trash2}
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Archived Agreements</h1>
          <p className={styles.subtitle}>
            Agreements moved out of active repository. Retained for 90 days before permanent deletion.
          </p>
        </div>
      </div>

      <Banner
        variant="info"
        title="90-Day Retention Compliance Policy"
        message="Archived agreements retain their complete cryptographic SHA-256 audit logs until permanent deletion. Restoring an agreement returns it to active state with a RESTORED audit event."
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>Loading archived records...</p>
        </div>
      ) : archived.length === 0 ? (
        <EmptyState
          title="Archive is empty"
          description="You have no archived agreements. Agreements you archive from the repository will appear here."
          action={
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileText}
              onClick={() => navigate('/app/agreements')}
            >
              Go to Agreements Repository
            </Button>
          }
        />
      ) : (
        <Card noPadding>
          <Table columns={tableColumns} data={archived} />
        </Card>
      )}

      {/* Permanent Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleHardDelete}
        title="Permanently Delete Agreement?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All document copies, electronic signatures, and cryptographic audit records will be irreversibly erased.`}
        confirmText="Permanently Erase"
        isDanger
      />
    </div>
  );
}
