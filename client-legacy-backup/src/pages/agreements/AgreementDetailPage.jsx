import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Plus,
  Send,
  CheckCircle,
  Copy,
  Clock,
  MessageSquare,
  FileText,
  Users,
  Paperclip,
  History,
  Info,
} from 'lucide-react';
import { Tabs } from '../../components/ui/Navigation/Tabs';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/DataDisplay/Card';
import { StatusBadge } from '../../components/ui/DataDisplay/StatusBadge';
import { Avatar } from '../../components/ui/DataDisplay/Avatar';
import { KeyValue } from '../../components/ui/DataDisplay/KeyValue';
import { ProgressBar } from '../../components/ui/Feedback/ProgressBar';
import { Modal } from '../../components/ui/Overlay/Modal';
import { FileDropzone } from '../../components/ui/Form/FileDropzone';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { agreementsService, versionsService, documentsService } from '../../services';
import { getAvailableNextStatuses, STATUS_META } from '../../domain/agreementLifecycle';
import { formatCurrency, formatDate } from '../../utils/validators';
import styles from './AgreementDetail.module.css';

export function AgreementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { addToast } = useToast();

  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationTimeMs, setVerificationTimeMs] = useState(null);

  // Modals & sub-states
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState('');
  const [comments, setComments] = useState([
    {
      id: 'comm-1',
      author: 'Alex Rivera',
      role: 'General Counsel',
      timestamp: '2 hours ago',
      content: 'Reviewed indemnification terms with outside counsel. Clause 3 has been adjusted to standard 12-month liability cap.',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  const loadAgreement = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agreementsService.getById(id);
      setAgreement(data);
      // Run initial cryptographic verification
      const startTime = performance.now();
      const res = await agreementsService.verifyAuditChain(id);
      setVerificationTimeMs(Math.round(performance.now() - startTime));
      setVerificationResult(res);
    } catch (err) {
      console.error('Failed to load agreement:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAgreement();
  }, [loadAgreement]);

  // Transition handler
  const handleTransition = async (nextStatus) => {
    try {
      const updated = await agreementsService.transition(
        id,
        nextStatus,
        `${user?.name || 'User'} (${user?.role || 'Member'})`,
        `Transitioned to ${nextStatus.replace(/_/g, ' ')}`
      );
      setAgreement(updated);
      addToast({
        title: 'Status Updated',
        message: `Contract is now ${STATUS_META[nextStatus]?.label || nextStatus}`,
        type: 'success',
      });
      // Re-verify audit trail
      const res = await agreementsService.verifyAuditChain(id);
      setVerificationResult(res);
    } catch (err) {
      addToast({ title: 'Transition Blocked', message: err.message, type: 'error' });
    }
  };

  // Cryptographic audit chain verification
  const handleVerifyChain = async () => {
    setVerifying(true);
    const start = performance.now();
    try {
      const res = await agreementsService.verifyAuditChain(id);
      const elapsed = Math.round(performance.now() - start);
      setVerificationTimeMs(elapsed);
      setVerificationResult(res);
      if (res.isValid) {
        addToast({
          title: 'Integrity Verified',
          message: `All ${res.verifiedCount} cryptographic hash records valid (${elapsed}ms).`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Cryptographic Warning',
          message: res.error,
          type: 'error',
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  // Simulate tamper for dev demo
  const handleSimulateTamper = async () => {
    await agreementsService.tamperAuditRecord(id, 0);
    const res = await agreementsService.verifyAuditChain(id);
    setVerificationResult(res);
    addToast({
      title: 'Tamper Simulated',
      message: 'Record #1 was intentionally modified. Cryptographic chain detected mismatch!',
      type: 'warning',
    });
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
    addToast({ title: 'Signing Link Copied', message: 'URL copied to clipboard.', type: 'info' });
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotSummary.trim()) return;
    await versionsService.createSnapshot(id, snapshotSummary);
    setSnapshotSummary('');
    setIsSnapshotModalOpen(false);
    addToast({ title: 'Version Snapshot Saved', type: 'success' });
    loadAgreement();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: user?.name || 'Alex Rivera',
        role: user?.title || 'Legal Counsel',
        timestamp: 'Just now',
        content: newComment,
      },
    ]);
    setNewComment('');
    addToast({ title: 'Note Added', type: 'info' });
  };

  if (loading || !agreement) {
    return <div className={styles.loading}>Loading contract details & audit history...</div>;
  }

  const availableNextStatuses = getAvailableNextStatuses(agreement.status, user?.role || 'ADMIN');
  const signedPartiesCount = agreement.parties.filter((p) => p.status === 'signed').length;
  const signingProgress = Math.round((signedPartiesCount / (agreement.parties.length || 1)) * 100);

  return (
    <div className={styles.container}>
      {/* Top Header Bar */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/app/agreements')}
          >
            <ArrowLeft size={16} />
            <span>Repository</span>
          </button>
          <div className={styles.headerTitleGroup}>
            <div className={styles.metaBadgeRow}>
              <span className={styles.docNumber}>{agreement.number}</span>
              <StatusBadge status={agreement.status} />
              <span className={styles.categoryPill}>{agreement.categoryId.replace('cat-', '')}</span>
            </div>
            <h1 className={styles.title}>{agreement.title}</h1>
          </div>
        </div>

        {/* Action Controls & Transitions */}
        <div className={styles.headerRight}>
          {(availableNextStatuses || []).map((nextStatus) => {
            const meta = STATUS_META[nextStatus];
            const isDanger = ['cancelled', 'terminated', 'disputed'].includes(nextStatus);
            return (
              <Button
                key={nextStatus}
                variant={isDanger ? 'danger' : 'primary'}
                onClick={() => handleTransition(nextStatus)}
              >
                {meta?.label || nextStatus}
              </Button>
            );
          })}

          <Button
            variant="outline"
            leftIcon={Download}
            onClick={() => addToast({ title: 'Exporting PDF', message: 'Downloading execution copy with certificates...', type: 'success' })}
          >
            Export PDF
          </Button>

          <Button
            variant="ghost"
            leftIcon={Share2}
            onClick={() => handleCopyLink(agreement.parties?.[0]?.token || 'tok_demo')}
          >
            Share Link
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', icon: Info },
          { id: 'document', label: 'Document Paper', icon: FileText },
          { id: 'parties', label: `Parties (${agreement.parties?.length || 0})`, icon: Users },
          { id: 'audit', label: 'Audit Trail & Crypto', icon: ShieldCheck },
          { id: 'versions', label: `Versions (${agreement.versions?.length || 1})`, icon: History },
          { id: 'files', label: 'Files', icon: Paperclip },
          { id: 'comments', label: `Notes (${comments?.length || 0})`, icon: MessageSquare },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className={styles.tabGrid}>
          <div className={styles.colMain}>
            <Card title="Contract Metadata">
              <div className={styles.metadataGrid}>
                <KeyValue label="Contract ID" value={agreement.number} isMono />
                <KeyValue label="Commercial Consideration" value={formatCurrency(agreement.value)} />
                <KeyValue label="Effective Date" value={agreement.effectiveDate} />
                <KeyValue label="Expiration Term" value={agreement.expirationDate || 'Open-ended'} />
                <KeyValue label="Total Signatures Required" value={`${signedPartiesCount} of ${agreement.parties?.length || 0} completed`} />
                <KeyValue label="Organization Workspace" value={currentOrg?.name || 'Acme Global'} />
              </div>

              {agreement.summary && (
                <div className={styles.summaryBox}>
                  <span className={styles.summaryLabel}>Commercial Scope</span>
                  <p>{agreement.summary}</p>
                </div>
              )}
            </Card>

            <Card title="Execution Progress">
              <ProgressBar
                value={signingProgress}
                max={100}
                label={`Signatures Executed (${signedPartiesCount}/${agreement.parties?.length || 0})`}
              />
            </Card>

            {/* Payment Milestones if present */}
            {agreement.paymentMilestones?.length > 0 && (
              <Card title="Payment & Deliverable Milestones">
                <div className={styles.milestonesTable}>
                  {(agreement.paymentMilestones || []).map((m) => (
                    <div key={m.id} className={styles.milestoneRow}>
                      <div>
                        <strong>{m.title}</strong>
                        <span>Due: {m.dueDate}</span>
                      </div>
                      <div className={styles.milestoneRight}>
                        <strong>{formatCurrency(m.amount)}</strong>
                        <span className={`${styles.milestoneStatus} ${styles[m.status]}`}>
                          {m.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className={styles.colSidebar}>
            <Card title="Counterparties Status">
              <div className={styles.partiesSummaryList}>
                {(agreement.parties || []).map((p) => {
                  const isSigned = p.status === 'signed';
                  return (
                    <div key={p.id} className={styles.partySummaryItem}>
                      <Avatar name={p.name} size="sm" />
                      <div className={styles.partySummaryInfo}>
                        <strong>{p.name}</strong>
                        <span>{p.email}</span>
                        <div className={styles.partyStatusPill}>
                          {isSigned ? (
                            <span className={styles.signedPill}>
                              <CheckCircle size={10} /> Signed ({formatDate(p.signedAt)})
                            </span>
                          ) : (
                            <span className={styles.pendingPill}>
                              <Clock size={10} /> Awaiting Signature
                            </span>
                          )}
                        </div>
                      </div>
                      {!isSigned && (
                        <button
                          type="button"
                          className={styles.copyTokenBtn}
                          onClick={() => handleCopyLink(p.token)}
                          title="Copy direct guest signing link"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Cryptographic Health Card */}
            <Card title="Integrity Proof">
              <div className={styles.cryptoHealthCard}>
                <div className={styles.cryptoHealthHeader}>
                  {verificationResult?.isValid ? (
                    <ShieldCheck size={28} className={styles.validShield} />
                  ) : (
                    <ShieldAlert size={28} className={styles.invalidShield} />
                  )}
                  <div>
                    <strong>
                      {verificationResult?.isValid ? 'Hash Chain Valid' : 'Integrity Mismatch'}
                    </strong>
                    <span className={styles.cryptoSub}>
                      {verificationResult?.verifiedCount} events verified ({verificationTimeMs || 8}ms)
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('audit')}
                >
                  Inspect Full Audit Trail
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT PAPER */}
      {activeTab === 'document' && (
        <div className={styles.documentTabWrapper}>
          <div className={styles.documentActions}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={() => window.print()}
            >
              Print Document
            </Button>
          </div>

          <div className={`${styles.paperDocument} document-body`}>
            <div className={styles.paperHeader}>
              <h1 className={styles.paperMainTitle}>{agreement.title}</h1>
              <p className={styles.paperMetaSubtitle}>
                Agreement Reference: {agreement.number} • Effective: {agreement.effectiveDate}
              </p>
            </div>

            <p className={styles.paperPreamble}>
              This Agreement is entered into by and between the counterparties specified below. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties covenant and agree as follows:
            </p>

            <div className={styles.paperClausesBlock}>
              {(agreement.clauses || []).map((clause) => (
                <div key={clause.id} className={styles.clauseItem}>
                  <h3 className={styles.clauseHeading}>{clause.title}</h3>
                  <p className={styles.clauseContent}>{clause.content}</p>
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div className={styles.paperSignaturesSection}>
              <h3 className={styles.clauseHeading}>In Witness Whereof</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: '#64748b' }}>
                The parties hereto have executed this digital agreement through authorized electronic signatures.
              </p>

              <div className={styles.signersGrid}>
                {(agreement.parties || []).map((p) => (
                  <div key={p.id} className={styles.signatureBox}>
                    <span className={styles.signRole}>{p.role.toUpperCase()}</span>
                    <div className={styles.signatureSlot}>
                      {p.status === 'signed' ? (
                        <div className={styles.capturedSignature}>
                          {p.signatureUrl ? (
                            <img src={p.signatureUrl} alt={`Signature of ${p.name}`} className={styles.sigImage} />
                          ) : (
                            <span className={styles.typedSignatureText}>{p.name}</span>
                          )}
                          <span className={styles.signedVerificationNote}>
                            Electronically executed • {formatDate(p.signedAt)} • IP: {p.ipAddress || '198.51.100.44'}
                          </span>
                        </div>
                      ) : (
                        <div className={styles.pendingSignatureSlot}>
                          <span>Pending Signature from {p.name}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.signatureUnderline} />
                    <strong>{p.name}</strong>
                    <span>{p.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARTIES */}
      {activeTab === 'parties' && (
        <Card title="Agreement Parties & Verification Records">
          <div className={styles.partiesFullList}>
            {(agreement.parties || []).map((party, idx) => {
              const isSigned = party.status === 'signed';
              return (
                <div key={party.id || idx} className={styles.partyCardFull}>
                  <div className={styles.partyCardHeader}>
                    <div className={styles.partyLeft}>
                      <Avatar name={party.name} size="md" />
                      <div>
                        <h3 className={styles.partyFullName}>{party.name}</h3>
                        <span className={styles.partyEmail}>{party.email}</span>
                      </div>
                    </div>
                    <div className={styles.partyRight}>
                      <StatusBadge status={isSigned ? 'signed' : 'awaiting_signatures'} size="sm" />
                    </div>
                  </div>

                  <div className={styles.partyDetailsGrid}>
                    <KeyValue label="Role" value={party.role} />
                    <KeyValue label="Signing Order" value={`Position #${party.signingOrder}`} />
                    <KeyValue
                      label="Execution Timestamp"
                      value={party.signedAt ? formatDate(party.signedAt) : 'Pending signature'}
                    />
                    <KeyValue
                      label="Signer IP Address"
                      value={party.ipAddress || '198.51.100.44'}
                      isMono
                    />
                  </div>

                  {!isSigned && (
                    <div className={styles.partyActionRow}>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={Copy}
                        onClick={() => handleCopyLink(party.token)}
                      >
                        Copy Guest Signing Portal Link
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={Send}
                        onClick={() =>
                          addToast({
                            title: 'Invitation Dispatched',
                            message: `Signing reminder re-sent to ${party.email}`,
                            type: 'success',
                          })
                        }
                      >
                        Resend Email Invitation
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 4: ACTIVITY & AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className={styles.auditTab}>
          {/* Integrity Banner */}
          <div className={`${styles.integrityBanner} ${verificationResult?.isValid ? styles.bannerValid : styles.bannerInvalid}`}>
            <div className={styles.bannerLeft}>
              {verificationResult?.isValid ? (
                <ShieldCheck size={28} className={styles.validShield} />
              ) : (
                <ShieldAlert size={28} className={styles.invalidShield} />
              )}
              <div>
                <h3 className={styles.bannerTitle}>
                  {verificationResult?.isValid
                    ? 'Cryptographic Chain Integrity: VALID'
                    : 'Cryptographic Chain Integrity: INVALID'}
                </h3>
                <p className={styles.bannerSubtitle}>
                  {verificationResult?.isValid
                    ? `All ${verificationResult?.verifiedCount} audit events linked by verified SHA-256 digests in real time (${verificationTimeMs || 8}ms).`
                    : verificationResult?.error}
                </p>
              </div>
            </div>

            <div className={styles.bannerActions}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={RotateCcw}
                isLoading={verifying}
                onClick={handleVerifyChain}
              >
                Verify Chain Now
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSimulateTamper}
                title="Intentionally modifies a record to demonstrate tamper detection"
              >
                Simulate Tamper
              </Button>
            </div>
          </div>

          {/* Audit Records Timeline */}
          <div className={styles.auditTimeline}>
            {agreement.auditTrail?.map((record, index) => (
              <div key={record.id || index} className={styles.auditRecordCard}>
                <div className={styles.recordHeader}>
                  <div className={styles.recordActionGroup}>
                    <span className={styles.recordIndex}>#{index + 1}</span>
                    <strong className={styles.recordAction}>{record.action}</strong>
                  </div>
                  <span className={styles.recordTime}>
                    {formatDate(record.timestamp, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className={styles.recordDetails}>{record.details}</p>

                <div className={styles.recordFooter}>
                  <span className={styles.recordActor}>Actor: {record.actor}</span>
                  <div className={styles.hashBlock}>
                    <span className={styles.hashLabel}>SHA-256:</span>
                    <span
                      className={styles.hashValue}
                      title={`Click to copy: ${record.hash}`}
                      onClick={() => {
                        navigator.clipboard.writeText(record.hash);
                        addToast({ title: 'Full 64-char Hash Copied', type: 'info' });
                      }}
                    >
                      {record.hash ? `${record.hash.substring(0, 16)}...${record.hash.substring(48)}` : 'GENESIS'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: VERSIONS & DIFF */}
      {activeTab === 'versions' && (
        <Card
          title="Document Version History"
          action={
            <Button
              size="sm"
              variant="outline"
              leftIcon={Plus}
              onClick={() => setIsSnapshotModalOpen(true)}
            >
              Create Version Snapshot
            </Button>
          }
        >
          <div className={styles.versionsList}>
            {agreement.versions?.map((ver, idx) => (
              <div key={idx} className={styles.versionCard}>
                <div className={styles.versionHeader}>
                  <div className={styles.versionBadge}>{ver.version}</div>
                  <div className={styles.versionMeta}>
                    <strong>{ver.author}</strong>
                    <span>{formatDate(ver.createdAt)}</span>
                  </div>
                </div>
                <p className={styles.versionSummary}>{ver.summary}</p>
                <div className={styles.diffPreview}>
                  <span className={styles.diffAdded}>+ Added standard IP indemnification and survival covenants</span>
                  <span className={styles.diffModified}>~ Modified Clause 2 payment schedule from Net 15 to Net 30</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 6: FILES */}
      {activeTab === 'files' && (
        <div className={styles.filesTab}>
          <Card title="Contract Files & Execution Documents">
            <div className={styles.filesList}>
              {agreement.documents?.map((doc) => (
                <div key={doc.id} className={styles.fileItem}>
                  <div className={styles.fileLeft}>
                    <FileText size={20} className={styles.fileIcon} />
                    <div>
                      <strong>{doc.name}</strong>
                      <span>{Math.round(doc.sizeBytes / 1024)} KB • Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Download}
                    onClick={() => addToast({ title: `Downloaded ${doc.name}`, type: 'success' })}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px' }}>
              <span className={styles.uploadTitle}>Attach Exhibits or Supplemental Addenda:</span>
              <FileDropzone
                accept="application/pdf,image/png,image/jpeg"
                onDrop={async (files) => {
                  await documentsService.upload(id, files[0]);
                  addToast({ title: 'File Attached', message: files[0].name, type: 'success' });
                  loadAgreement();
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: INTERNAL NOTES */}
      {activeTab === 'comments' && (
        <Card title="Internal Legal & Deal Notes">
          <div className={styles.commentsList}>
            {(comments || []).map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <Avatar name={c.author} size="sm" />
                <div className={styles.commentBody}>
                  <div className={styles.commentHeader}>
                    <strong>{c.author}</strong>
                    <span className={styles.commentRole}>({c.role})</span>
                    <span className={styles.commentTime}>{c.timestamp}</span>
                  </div>
                  <p className={styles.commentText}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className={styles.commentForm}>
            <textarea
              className={styles.commentInput}
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add internal counsel note or compliance remark..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="submit" variant="primary" size="sm" disabled={!newComment.trim()}>
                Post Internal Note
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Snapshot Modal */}
      <Modal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Create Version Snapshot"
        description="Preserve document state with descriptive change log"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSnapshotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSnapshot}>
              Save Snapshot
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Summary of Changes</label>
          <input
            type="text"
            className={styles.snapshotInput}
            value={snapshotSummary}
            onChange={(e) => setSnapshotSummary(e.target.value)}
            placeholder="e.g. Incorporated counterparty redlines on liability cap"
          />
        </div>
      </Modal>
    </div>
  );
}
