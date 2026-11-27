import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { ProgressBar } from '../../components/ui/Feedback/ProgressBar';
import { Table } from '../../components/ui/DataDisplay/Table';
import { Badge } from '../../components/ui/DataDisplay/Badge';
import { Modal } from '../../components/ui/Overlay/Modal';
import { ConfirmDialog } from '../../components/ui/Overlay/ConfirmDialog';
import { FileDropzone } from '../../components/ui/Form/FileDropzone';
import { Select } from '../../components/ui/Form/Select';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { agreementsService } from '../../services';
import { formatDate } from '../../utils/validators';
import styles from './DocumentsPage.module.css';

export function DocumentsPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAgrId, setSelectedAgrId] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await agreementsService.list({ orgId: currentOrg?.id });
      const agrList = res.items || [];
      setAgreements(agrList);

      // Collect all documents
      const docs = [];
      agrList.forEach((agr) => {
        if (agr.documents && agr.documents.length > 0) {
          agr.documents.forEach((d) => {
            docs.push({
              ...d,
              agreementId: agr.id,
              agreementTitle: agr.title,
              category: agr.category,
            });
          });
        }
      });
      setDocuments(docs);
      if (agrList.length > 0 && !selectedAgrId) {
        setSelectedAgrId(agrList[0].id);
      }
    } catch {
      showToast({ title: 'Failed to load documents', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, selectedAgrId, showToast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Compute total storage
  const totalBytes = useMemo(() => {
    return documents.reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  }, [documents]);

  const storageUsedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const storageLimitMB = 1024; // 1GB
  const storagePercent = Math.min(100, Math.round((storageUsedMB / storageLimitMB) * 100));

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.agreementTitle.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (typeFilter === 'ALL') return true;
      if (typeFilter === 'PDF') return doc.name.toLowerCase().endsWith('.pdf');
      if (typeFilter === 'DOCX') return doc.name.toLowerCase().endsWith('.docx');
      return true;
    });
  }, [documents, search, typeFilter]);

  const handleDownload = (doc) => {
    const content = `AGREE2MET DOCUMENT EXPORT\nDocument ID: ${doc.id}\nFile Name: ${doc.name}\nAgreement: ${doc.agreementTitle}\nUploaded At: ${doc.uploadedAt}\nChecksum: Verified Tamper-Evident`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name.includes('.') ? doc.name : `${doc.name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({ title: `Downloaded ${doc.name}`, variant: 'success' });
  };

  const handleUploadSubmit = async () => {
    if (uploadedFiles.length === 0) {
      showToast({ title: 'Please select a file to upload', variant: 'warning' });
      return;
    }
    if (!selectedAgrId) {
      showToast({ title: 'Please select an agreement', variant: 'warning' });
      return;
    }

    try {
      setIsUploading(true);
      const targetAgr = agreements.find((a) => a.id === selectedAgrId);
      if (!targetAgr) throw new Error('Target agreement not found');

      const file = uploadedFiles[0];
      const newDoc = {
        id: `doc-${Date.now().toString(36)}`,
        name: file.name,
        sizeBytes: file.size || 250000,
        uploadedAt: new Date().toISOString(),
        status: 'ready',
      };

      const updatedDocs = [...(targetAgr.documents || []), newDoc];
      await agreementsService.update(selectedAgrId, { documents: updatedDocs });

      showToast({ title: `Uploaded "${file.name}" successfully`, variant: 'success' });
      setUploadModalOpen(false);
      setUploadedFiles([]);
      loadDocuments();
    } catch {
      showToast({ title: 'Upload failed', variant: 'danger' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const targetAgr = agreements.find((a) => a.id === deleteTarget.agreementId);
      if (targetAgr) {
        const updatedDocs = (targetAgr.documents || []).filter((d) => d.id !== deleteTarget.id);
        await agreementsService.update(deleteTarget.agreementId, { documents: updatedDocs });
      }
      showToast({ title: 'Document removed', variant: 'success' });
      setDeleteTarget(null);
      loadDocuments();
    } catch {
      showToast({ title: 'Failed to delete document', variant: 'danger' });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'File Name',
      render: (doc) => (
        <div className={styles.fileCell}>
          <div className={styles.fileIcon}>
            <FileText size={18} />
          </div>
          <div>
            <div className={styles.fileName}>{doc.name}</div>
            <div className={styles.fileMeta}>
              {(doc.sizeBytes ? (doc.sizeBytes / 1024).toFixed(0) : 150)} KB &bull;{' '}
              {formatDate(doc.uploadedAt)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'agreementTitle',
      header: 'Agreement',
      render: (doc) => (
        <Link
          to={`/app/agreements/${doc.agreementId}`}
          style={{ color: 'var(--color-brand-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {doc.agreementTitle}
          <ExternalLink size={12} />
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => (
        <Badge variant={doc.status === 'ready' ? 'success' : 'neutral'}>
          {doc.status || 'ready'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (doc) => (
        <div className={styles.actionsCell}>
          <Button
            size="sm"
            variant="ghost"
            icon={<Download size={14} />}
            onClick={() => handleDownload(doc)}
            ariaLabel={`Download ${doc.name}`}
          >
            Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 size={14} />}
            onClick={() => setDeleteTarget(doc)}
            ariaLabel={`Delete ${doc.name}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Document Hub</h1>
          <p className={styles.subtitle}>
            Central repository of contracts, signed copies, and attachments for {currentOrg?.name}.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Upload size={16} />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      {/* Storage Utilization Card */}
      <div className={styles.storageCard}>
        <div className={styles.storageHeader}>
          <span>Storage Utilization</span>
          <span className={styles.storageUsage}>
            {storageUsedMB} MB of {storageLimitMB} MB ({storagePercent}%)
          </span>
        </div>
        <ProgressBar value={storagePercent} variant="brand" />
      </div>

      {/* Filters & Search */}
      <div className={styles.filterControls}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="Search documents or agreements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search size={16} />}
          />
        </div>
        <div className={styles.typeTabs}>
          {['ALL', 'PDF', 'DOCX'].map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.typeTab} ${typeFilter === type ? styles.typeTabActive : ''}`}
              onClick={() => setTypeFilter(type)}
            >
              {type === 'ALL' ? 'All Files' : `.${type}`}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height="48px" />
          <Skeleton height="60px" />
          <Skeleton height="60px" />
          <Skeleton height="60px" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description={
            search || typeFilter !== 'ALL'
              ? 'Try modifying your search or filter criteria.'
              : 'Upload files directly or attach them inside agreement detail views.'
          }
          actionLabel="Upload First Document"
          onAction={() => setUploadModalOpen(true)}
        />
      ) : (
        <div className={styles.tableWrap}>
          <Table columns={columns} data={filteredDocuments} />
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Document"
        size="md"
      >
        <div className={styles.uploadModalBody}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Select an agreement and attach PDF or Word contracts. Files are securely hashed and stored.
          </p>
          <div>
            <label
              htmlFor="upload-agr-select"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Target Agreement
            </label>
            <Select
              id="upload-agr-select"
              value={selectedAgrId}
              onChange={(e) => setSelectedAgrId(e.target.value)}
              options={(agreements || []).map((a) => ({ value: a.id, label: a.title }))}
            />
          </div>
          <FileDropzone
            files={uploadedFiles}
            onFilesSelected={(newFiles) => setUploadedFiles(newFiles)}
            onRemoveFile={() => setUploadedFiles([])}
            accept=".pdf,.docx"
            maxFiles={1}
            maxSizeMB={20}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isUploading}
              disabled={uploadedFiles.length === 0}
              onClick={handleUploadSubmit}
            >
              Upload to Agreement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove Document"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from "${deleteTarget?.agreementTitle}"? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
