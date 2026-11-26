import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  Lock,
  ArrowRight,
  PenTool,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { Modal } from '../../components/ui/Overlay/Modal';
import { SignaturePad } from '../../components/ui/SignaturePad/SignaturePad';
import { Checkbox } from '../../components/ui/Form/Checkbox';
import { Select } from '../../components/ui/Form/Select';
import { Textarea } from '../../components/ui/Input/Textarea';
import { useToast } from '../../context/ToastContext';
import { signingService } from '../../services';
import { formatCurrency, formatDate } from '../../utils/validators';
import styles from './PublicSigning.module.css';

export function PublicSigningPage() {
  const { token } = useParams();
  const { addToast } = useToast();

  const [agreement, setAgreement] = useState(null);
  const [signerParty, setSignerParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Flow states: 'consent' | 'reading' | 'signed' | 'completed' | 'declined'
  const [stage, setStage] = useState('consent');
  const [hasConsented, setHasConsented] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('Incorrect terms or numbers');
  const [declineNotes, setDeclineNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const documentRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await signingService.getByToken(token);
      setAgreement(res.agreement);
      setSignerParty(res.party);
      if (res.party.status === 'signed') {
        setStage('completed');
      } else if (res.party.status === 'declined') {
        setStage('declined');
      }
    } catch (err) {
      setError(err.message || 'Signing link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Electronic Consent Acceptance
  const handleAcceptConsent = () => {
    if (!hasConsented) {
      addToast({ title: 'Consent Required', message: 'You must check the electronic consent box to proceed.', type: 'warning' });
      return;
    }
    setStage('reading');
    addToast({ title: 'Consent Recorded', message: 'You may now review the terms and apply your signature.', type: 'info' });
  };

  // Stamp Signature from modal
  const handleApplySignature = (sig) => {
    if (!sig) {
      addToast({ title: 'Signature Required', message: 'Please draw, type, or upload your signature.', type: 'warning' });
      return;
    }
    setSignatureData(sig);
    setIsSignModalOpen(false);
    setStage('signed');
    addToast({ title: 'Signature Stamped', message: 'Review your signature below and click "Complete & Submit".', type: 'success' });
  };

  // Final Submit
  const handleCompleteSubmission = async () => {
    setSubmitting(true);
    try {
      await signingService.submitSignature(token, {
        signerName: signerParty.name,
        signatureData,
        ipAddress: '198.51.100.88',
      });
      setStage('completed');
      addToast({
        title: 'Agreement Executed!',
        message: 'Your electronic signature was recorded with SHA-256 cryptographic proof.',
        type: 'success',
      });
    } catch (err) {
      addToast({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Decline Submission
  const handleDecline = async () => {
    setSubmitting(true);
    try {
      await signingService.declineSigning(token, `${declineReason} - ${declineNotes}`);
      setIsDeclineModalOpen(false);
      setStage('declined');
      addToast({ title: 'Signing Declined', message: 'The agreement creator has been notified.', type: 'info' });
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading secure signing session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <AlertTriangle size={36} className={styles.errorIcon} />
          <h2>Unable to Load Agreement</h2>
          <p>{error}</p>
          <Link to="/" className={styles.errorHomeBtn}>
            Return to Agree2Met Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signingPortal}>
      {/* Top Portal Trust Bar */}
      <header className={styles.portalHeader}>
        <div className={styles.portalHeaderContainer}>
          <div className={styles.brandGroup}>
            <Logo size="md" />
            <div className={styles.secureBadge}>
              <Lock size={12} />
              <span>256-Bit Encrypted • Tamper-Evident SHA-256 Trail</span>
            </div>
          </div>

          <div className={styles.signerInfoBadge}>
            <span className={styles.signerLabel}>Signer:</span>
            <strong>{signerParty?.name}</strong>
            <span className={styles.signerEmail}>({signerParty?.email})</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={styles.mainContent}>
        {/* STAGE 1: Electronic Consent Gate */}
        {stage === 'consent' && (
          <div className={styles.consentOverlay}>
            <div className={styles.consentCard}>
              <div className={styles.consentIconBox}>
                <ShieldCheck size={36} className={styles.consentIcon} />
              </div>
              <h1 className={styles.consentTitle}>Electronic Record & Signature Consent</h1>
              <p className={styles.consentSubtitle}>
                You have been invited by <strong>Acme Global Technologies</strong> to review and electronically execute:
              </p>
              <div className={styles.agreementTitlePill}>{agreement.title}</div>

              <div className={styles.consentTermsBox}>
                <p>
                  By checking the consent box below, you confirm that you can access this electronic document and agree to conduct transactions electronically using Simple Electronic Signatures (SES).
                </p>
                <p>
                  You understand that applying your signature to this record creates a tamper-evident audit record containing your timestamp, IP address, and cryptographic SHA-256 hash.
                </p>
              </div>

              <div className={styles.consentCheckboxWrapper}>
                <Checkbox
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  label={
                    <strong style={{ color: 'var(--color-text)' }}>
                      I consent to transact electronically and to apply my electronic signature to this document.
                    </strong>
                  }
                />
              </div>

              <div className={styles.consentActionsRow}>
                <Button
                  variant="outline"
                  onClick={() => setIsDeclineModalOpen(true)}
                >
                  Decline to Sign
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                  disabled={!hasConsented}
                  onClick={handleAcceptConsent}
                >
                  Review & Sign Document
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2 & 3: Document Reader & Signature Stamping */}
        {(stage === 'reading' || stage === 'signed') && (
          <div className={styles.readerLayout}>
            {/* Document Paper View */}
            <div ref={documentRef} className={`${styles.paperDocument} document-body`}>
              <div className={styles.docHeader}>
                <h1 className={styles.docMainTitle}>{agreement.title}</h1>
                <p className={styles.docMetaSubtitle}>
                  Document ID: {agreement.number} • Effective: {agreement.effectiveDate}
                </p>
              </div>

              <p className={styles.docIntro}>
                This Agreement is entered into by and between the undersigned parties. The parties agree to the following terms and contractual obligations:
              </p>

              <div className={styles.docClauses}>
                {agreement.clauses.map((clause) => (
                  <div key={clause.id} className={styles.clauseSection}>
                    <h3 className={styles.clauseTitle}>{clause.title}</h3>
                    <p className={styles.clauseText}>{clause.content}</p>
                  </div>
                ))}
              </div>

              {agreement.paymentMilestones?.length > 0 && (
                <div className={styles.milestonesSection}>
                  <h3 className={styles.clauseTitle}>Exhibit A: Financial Milestones</h3>
                  <table className={styles.milestoneTable}>
                    <thead>
                      <tr>
                        <th>Milestone Description</th>
                        <th>Amount</th>
                        <th>Target Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreement.paymentMilestones.map((m) => (
                        <tr key={m.id}>
                          <td>{m.title}</td>
                          <td>{formatCurrency(m.amount)}</td>
                          <td>{m.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatures Area */}
              <div className={styles.signaturesArea}>
                <h3 className={styles.clauseTitle}>Signatures and Execution</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#64748b' }}>
                  By signing below, the parties confirm agreement to all terms set forth above.
                </p>

                <div className={styles.signersGrid}>
                  {agreement.parties.map((p) => {
                    const isCurrentSigner = p.email === signerParty?.email;
                    const hasLocalSignature = isCurrentSigner && signatureData;

                    return (
                      <div key={p.id} className={styles.signatureBox}>
                        <span className={styles.signRole}>{p.role.toUpperCase()}</span>
                        <div
                          className={`${styles.signatureSlot} ${isCurrentSigner && !hasLocalSignature ? styles.activeSigningSlot : ''}`}
                          onClick={isCurrentSigner && !hasLocalSignature ? () => setIsSignModalOpen(true) : undefined}
                          role={isCurrentSigner && !hasLocalSignature ? 'button' : undefined}
                          tabIndex={isCurrentSigner && !hasLocalSignature ? 0 : undefined}
                        >
                          {hasLocalSignature ? (
                            <div className={styles.signatureApplied}>
                              <img src={signatureData} alt="Signature" className={styles.sigImg} />
                              <span className={styles.verifiedStamp}>
                                Electronically Stamped • {new Date().toLocaleTimeString()}
                              </span>
                            </div>
                          ) : p.status === 'signed' ? (
                            <div className={styles.signatureApplied}>
                              <span style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '26px' }}>
                                {p.name}
                              </span>
                              <span className={styles.verifiedStamp}>
                                Executed on {formatDate(p.signedAt)}
                              </span>
                            </div>
                          ) : isCurrentSigner ? (
                            <div className={styles.clickToSignPrompt}>
                              <PenTool size={16} />
                              <span>Click to Sign Here</span>
                            </div>
                          ) : (
                            <span className={styles.pendingPlaceholder}>
                              Pending signature ({p.name})
                            </span>
                          )}
                        </div>

                        <div className={styles.signLine} />
                        <strong>{p.name}</strong>
                        <span>{p.email}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className={styles.stickyActionFooter}>
              <div className={styles.stickyFooterContent}>
                <div className={styles.footerLeft}>
                  <span className={styles.progressText}>
                    {signatureData ? '✓ 1 of 1 signature placed' : '0 of 1 signature placed'}
                  </span>
                </div>

                <div className={styles.footerRight}>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeclineModalOpen(true)}
                  >
                    Decline to Sign
                  </Button>

                  {!signatureData ? (
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={PenTool}
                      onClick={() => setIsSignModalOpen(true)}
                    >
                      Sign Document
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={CheckCircle}
                      isLoading={submitting}
                      onClick={handleCompleteSubmission}
                    >
                      Complete & Submit Agreement
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 4: Completed Confirmation */}
        {stage === 'completed' && (
          <div className={styles.completionContainer}>
            <div className={styles.completionCard}>
              <div className={styles.successIconBox}>
                <CheckCircle size={48} className={styles.successIcon} />
              </div>
              <h1 className={styles.completionTitle}>Agreement Successfully Executed!</h1>
              <p className={styles.completionSubtitle}>
                Your electronic signature was captured and anchored into the tamper-evident SHA-256 audit log.
              </p>

              <div className={styles.completionDetailsCard}>
                <div className={styles.detailRow}>
                  <span>Agreement:</span>
                  <strong>{agreement.title} ({agreement.number})</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Signed by:</span>
                  <strong>{signerParty?.name} ({signerParty?.email})</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Cryptographic Hash:</span>
                  <code className={styles.hashBadge}>
                    {agreement.auditTrail?.[agreement.auditTrail.length - 1]?.hash?.substring(0, 32)}...
                  </code>
                </div>
              </div>

              <div className={styles.completionActions}>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={Download}
                  onClick={() => addToast({ title: 'Downloading Executed PDF', type: 'success' })}
                >
                  Download Signed Copy (PDF)
                </Button>
                <Button
                  variant="outline"
                  leftIcon={ShieldCheck}
                  onClick={() => addToast({ title: 'Audit Certificate Exported', type: 'info' })}
                >
                  Download Audit Certificate
                </Button>
              </div>

              <div className={styles.createAccountCTA}>
                <p>Want to manage agreements and track electronic signatures for your own business?</p>
                <Link to="/register" className={styles.ctaLink}>
                  Create Free Agree2Met Account →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 5: Declined Screen */}
        {stage === 'declined' && (
          <div className={styles.completionContainer}>
            <div className={styles.completionCard}>
              <div className={styles.declinedIconBox}>
                <XCircle size={48} className={styles.declinedIcon} />
              </div>
              <h1 className={styles.completionTitle}>Signing Declined</h1>
              <p className={styles.completionSubtitle}>
                You have declined to execute <strong>{agreement.title}</strong>. The contract originator has been notified of your response.
              </p>
              <div className={styles.createAccountCTA}>
                <Link to="/" className={styles.ctaLink}>
                  Return to Agree2Met Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Signature Capture Modal */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Apply Electronic Signature"
        description="Choose your preferred signing method"
        size="md"
        footer={
          <Button variant="outline" onClick={() => setIsSignModalOpen(false)}>
            Cancel
          </Button>
        }
      >
        <SignaturePad
          signerName={signerParty?.name}
          onChange={(dataUrl) => {
            if (dataUrl) handleApplySignature(dataUrl);
          }}
        />
      </Modal>

      {/* Decline to Sign Modal */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        title="Decline Agreement"
        description="Please indicate why you are declining to sign this agreement"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={submitting}
              onClick={handleDecline}
            >
              Confirm Decline
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Reason for Declining
            </label>
            <Select
              value={declineReason}
              onChange={setDeclineReason}
              options={[
                { label: 'Incorrect terms or numbers', value: 'Incorrect terms or numbers' },
                { label: 'Unauthorized signatory', value: 'Unauthorized signatory' },
                { label: 'Negotiations ongoing / terms changed', value: 'Negotiations ongoing' },
                { label: 'Withdrawing from transaction', value: 'Withdrawing from transaction' },
                { label: 'Other', value: 'Other' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Optional Notes to Agreement Originator
            </label>
            <Textarea
              rows={3}
              value={declineNotes}
              onChange={(e) => setDeclineNotes(e.target.value)}
              placeholder="Provide context on why you are declining..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
