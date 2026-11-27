import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Users,
} from 'lucide-react';
import { Stepper } from '../../components/ui/Navigation/Stepper';
import { Button } from '../../components/ui/Button/Button';
import { IconButton } from '../../components/ui/Button/IconButton';
import { Card } from '../../components/ui/DataDisplay/Card';
import { Field } from '../../components/ui/Form/Field';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Input/Textarea';
import { Select } from '../../components/ui/Form/Select';
import { DatePicker } from '../../components/ui/Form/DatePicker';
import { Modal } from '../../components/ui/Overlay/Modal';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { agreementsService, templatesService, categoriesService } from '../../services';
import { formatCurrency, isValidEmail } from '../../utils/validators';
import styles from './AgreementWizard.module.css';

export function AgreementWizard() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const { openWithContext } = useAIAssistant();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    categoryId: 'cat-vendor',
    templateId: '',
    summary: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    expirationDate: '',
    currency: 'USD',
    value: '',
    parties: [
      {
        id: 'p-1',
        name: 'Alex Rivera',
        email: 'alex.rivera@agree2met.demo',
        role: 'Signer',
        signingOrder: 1,
        organization: 'Acme Global Technologies',
      },
    ],
    clauses: [
      { id: 'c-1', title: '1. Engagement and Purpose', content: 'This agreement governs the commercial deliverables and terms between the parties.', order: 0 },
      { id: 'c-2', title: '2. Standard of Performance', content: 'Each party shall perform all obligations with professional standard of care and in compliance with applicable law.', order: 1 },
      { id: 'c-3', title: '3. Confidentiality and Proprietary Rights', content: 'All trade secrets and technical data disclosed shall remain confidential for three (3) years.', order: 2 },
    ],
    paymentMilestones: [
      { id: 'm-1', title: 'Initial Deposit upon Execution', amount: 5000, dueDate: new Date().toISOString().slice(0, 10) },
    ],
    reminderFrequency: 'daily',
    invitationMessage: 'Please review and apply your electronic signature to the attached agreement.',
  });

  // Load existing or seed metadata
  useEffect(() => {
    async function init() {
      try {
        const [cats, tmpls] = await Promise.all([
          categoriesService.list(),
          templatesService.list(),
        ]);
        setCategories(cats);
        setTemplates(tmpls);

        if (isEdit) {
          const agr = await agreementsService.getById(id);
          setFormData({
            title: agr.title || '',
            categoryId: agr.categoryId || 'cat-vendor',
            templateId: '',
            summary: agr.summary || '',
            effectiveDate: agr.effectiveDate || '',
            expirationDate: agr.expirationDate || '',
            currency: agr.currency || 'USD',
            value: agr.value !== null ? String(agr.value) : '',
            parties: agr.parties || [],
            clauses: agr.clauses || [],
            paymentMilestones: agr.paymentMilestones || [],
            reminderFrequency: 'daily',
            invitationMessage: 'Please review and apply your electronic signature.',
          });
        }
      } catch (err) {
        console.error('Failed to init wizard:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, isEdit]);

  // Debounced autosave
  const autosaveTimeoutRef = useRef(null);
  const triggerAutosave = useCallback(() => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      // Simulate draft save
      setLastSaved(new Date().toLocaleTimeString());
      setSaving(false);
    }, 1500);
  }, []);

  const updateForm = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    triggerAutosave();
  };

  // Template prefill selector
  const handleTemplateSelect = (tmplId) => {
    const tmpl = templates.find((t) => t.id === tmplId);
    if (!tmpl) return;
    setFormData((prev) => ({
      ...prev,
      templateId: tmplId,
      title: tmpl.title,
      categoryId: tmpl.categoryId,
      summary: tmpl.description,
      clauses: (tmpl.defaultClauses || []).map((c, i) => ({ ...c, order: i })),
    }));
    addToast({ title: 'Template Loaded', message: `Prefilled with "${tmpl.title}"`, type: 'info' });
  };

  // Counterparties management
  const addParty = () => {
    const nextParty = {
      id: `p-${Date.now().toString(36)}`,
      name: '',
      email: '',
      role: 'Signer',
      signingOrder: formData.parties.length + 1,
      organization: '',
    };
    setFormData((prev) => ({ ...prev, parties: [...prev.parties, nextParty] }));
    triggerAutosave();
  };

  const updateParty = (index, field, val) => {
    setFormData((prev) => {
      const nextParties = [...prev.parties];
      nextParties[index] = { ...nextParties[index], [field]: val };
      return { ...prev, parties: nextParties };
    });
    triggerAutosave();
  };

  const removeParty = (index) => {
    if (formData.parties.length <= 1) {
      addToast({ title: 'At least one party required', type: 'warning' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      parties: prev.parties.filter((_, i) => i !== index),
    }));
    triggerAutosave();
  };

  // Clause management
  const addClause = () => {
    const newClause = {
      id: `c-${Date.now().toString(36)}`,
      title: `${formData.clauses.length + 1}. Additional Terms`,
      content: 'The parties agree to the following additional provisions...',
      order: formData.clauses.length,
    };
    setFormData((prev) => ({ ...prev, clauses: [...prev.clauses, newClause] }));
    triggerAutosave();
  };

  const updateClause = (index, field, val) => {
    setFormData((prev) => {
      const nextClauses = [...prev.clauses];
      nextClauses[index] = { ...nextClauses[index], [field]: val };
      return { ...prev, clauses: nextClauses };
    });
    triggerAutosave();
  };

  const moveClause = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= formData.clauses.length) return;

    setFormData((prev) => {
      const reordered = [...prev.clauses];
      const temp = reordered[index];
      reordered[index] = reordered[targetIdx];
      reordered[targetIdx] = temp;
      return {
        ...prev,
        clauses: reordered.map((c, i) => ({ ...c, order: i })),
      };
    });
    triggerAutosave();
  };

  const removeClause = (index) => {
    setFormData((prev) => ({
      ...prev,
      clauses: prev.clauses.filter((_, i) => i !== index),
    }));
    triggerAutosave();
  };

  // Milestone management
  const addMilestone = () => {
    const m = {
      id: `m-${Date.now().toString(36)}`,
      title: `Milestone #${formData.paymentMilestones.length + 1}`,
      amount: 1000,
      dueDate: formData.expirationDate || new Date().toISOString().slice(0, 10),
    };
    setFormData((prev) => ({
      ...prev,
      paymentMilestones: [...prev.paymentMilestones, m],
    }));
    triggerAutosave();
  };

  const updateMilestone = (index, field, val) => {
    setFormData((prev) => {
      const nextMs = [...prev.paymentMilestones];
      nextMs[index] = { ...nextMs[index], [field]: val };
      return { ...prev, paymentMilestones: nextMs };
    });
    triggerAutosave();
  };

  const removeMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      paymentMilestones: prev.paymentMilestones.filter((_, i) => i !== index),
    }));
    triggerAutosave();
  };

  // Step Validation
  const validateStep = (step) => {
    if (step === 0) {
      return formData.title.trim().length > 0 && formData.categoryId;
    }
    if (step === 1) {
      return (
        formData.parties.length > 0 &&
        formData.parties.every((p) => p.name.trim() && isValidEmail(p.email))
      );
    }
    if (step === 2) {
      return formData.clauses.length > 0;
    }
    return true;
  };

  // Final Action Handlers
  const handleFinalSubmit = async (targetStatus) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        orgId: currentOrg?.id || 'org-acme',
        status: targetStatus,
      };

      if (isEdit) {
        await agreementsService.update(id, payload);
        if (targetStatus !== 'draft') {
          await agreementsService.transition(id, targetStatus, 'Alex Rivera', 'Status updated from wizard');
        }
        addToast({ title: 'Agreement Updated', type: 'success' });
        navigate(`/app/agreements/${id}`);
      } else {
        const created = await agreementsService.create(payload);
        if (targetStatus !== 'draft') {
          await agreementsService.transition(created.id, targetStatus, 'Alex Rivera', 'Initial status dispatch');
        }
        addToast({
          title: targetStatus === 'awaiting_signatures' ? 'Invitations Sent!' : 'Agreement Saved',
          message: targetStatus === 'awaiting_signatures' ? 'Counterparties notified by email.' : 'Saved to workspace.',
          type: 'success',
        });
        navigate(`/app/agreements/${created.id}`);
      }
    } catch (err) {
      console.error('Final submit failed:', err);
      addToast({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Details', description: 'Core metadata' },
    { title: 'Counterparties', description: 'Signers & review' },
    { title: 'Terms & Clauses', description: 'Contract text' },
    { title: 'Milestones', description: 'Payment schedule' },
    { title: 'Review', description: 'Document preview' },
    { title: 'Dispatch', description: 'Send & finalize' },
  ];

  if (loading) {
    return <div className={styles.loading}>Loading contract authoring suite...</div>;
  }

  return (
    <div className={styles.wizardContainer}>
      {/* Top Bar with autosave indicator */}
      <div className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/app/agreements')}
          >
            <ArrowLeft size={16} />
            <span>Agreements</span>
          </button>
          <div className={styles.titleDivider} />
          <h2 className={styles.topTitle}>
            {isEdit ? `Edit "${formData.title || 'Draft'}"` : 'New Agreement Authoring'}
          </h2>
        </div>

        <div className={styles.topNavRight}>
          <div className={styles.autosaveBadge}>
            <Clock size={12} />
            <span>{saving ? 'Autosaving...' : lastSaved ? `Saved at ${lastSaved}` : 'Draft local'}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={Eye}
            onClick={() => setShowPreviewModal(true)}
          >
            Live Preview
          </Button>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className={styles.stepperWrapper}>
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            if (step < currentStep || validateStep(currentStep)) {
              setCurrentStep(step);
            }
          }}
        />
      </div>

      {/* STEP CONTENT BODY */}
      <div className={styles.stepBody}>
        {/* STEP 1: Basic Details */}
        {currentStep === 0 && (
          <div className={styles.stepGrid}>
            <Card title="Agreement Details" className={styles.formCard}>
              <div className={styles.formStack}>
                <Field label="Prefill from Standard Template" hint="Optional: Automatically populate clauses from a verified template">
                  <Select
                    value={formData.templateId}
                    onChange={(val) => handleTemplateSelect(val)}
                    options={[
                      { label: 'Start from scratch (blank)', value: '' },
                      ...(templates || []).map((t) => ({ label: t.title, value: t.id })),
                    ]}
                  />
                </Field>

                <Field label="Agreement Commercial Title" required hint="e.g. Master Cloud Services Agreement">
                  <Input
                    value={formData.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="Enter formal title..."
                    required
                  />
                </Field>

                <div className={styles.twoCol}>
                  <Field label="Category" required>
                    <Select
                      value={formData.categoryId}
                      onChange={(val) => updateForm('categoryId', val)}
                      options={(categories || []).map((c) => ({ label: c.name, value: c.id }))}
                    />
                  </Field>
                  <Field label="Total Value (USD)" hint="Optional monetary consideration">
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => updateForm('value', e.target.value)}
                      placeholder="e.g. 50000"
                    />
                  </Field>
                </div>

                <div className={styles.twoCol}>
                  <Field label="Effective Date" required>
                    <DatePicker
                      value={formData.effectiveDate}
                      onChange={(v) => updateForm('effectiveDate', v)}
                    />
                  </Field>
                  <Field label="Expiration Date" hint="Leave blank for open-ended contracts">
                    <DatePicker
                      value={formData.expirationDate}
                      onChange={(v) => updateForm('expirationDate', v)}
                    />
                  </Field>
                </div>

                <Field label="Summary / Commercial Intent">
                  <Textarea
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => updateForm('summary', e.target.value)}
                    placeholder="Brief description of the engagement and deliverables..."
                  />
                </Field>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: Counterparties */}
        {currentStep === 1 && (
          <div className={styles.stepGrid}>
            <Card
              title="Counterparties & Signatories"
              action={
                <Button size="sm" variant="outline" leftIcon={Plus} onClick={addParty}>
                  Add Counterparty
                </Button>
              }
            >
              <div className={styles.partiesList}>
                {formData.parties.map((party, idx) => (
                  <div key={party.id || idx} className={styles.partyItemCard}>
                    <div className={styles.partyItemHeader}>
                      <span className={styles.partyIndex}>Party #{idx + 1}</span>
                      {formData.parties.length > 1 && (
                        <IconButton
                          icon={Trash2}
                          size="sm"
                          variant="danger"
                          aria-label="Remove party"
                          onClick={() => removeParty(idx)}
                        />
                      )}
                    </div>

                    <div className={styles.partyRowGrid}>
                      <Field label="Full Legal Name" required>
                        <Input
                          value={party.name}
                          onChange={(e) => updateParty(idx, 'name', e.target.value)}
                          placeholder="e.g. Elena Rostova"
                          required
                        />
                      </Field>

                      <Field label="Email Address" required>
                        <Input
                          type="email"
                          value={party.email}
                          onChange={(e) => updateParty(idx, 'email', e.target.value)}
                          placeholder="elena@acmeglobal.demo"
                          required
                        />
                      </Field>

                      <Field label="Role in Agreement">
                        <Select
                          value={party.role}
                          onChange={(v) => updateParty(idx, 'role', v)}
                          options={[
                            { label: 'Signer (Requires Signature)', value: 'Signer' },
                            { label: 'Approver (Review Only)', value: 'Approver' },
                            { label: 'CC (Receives Copy)', value: 'CC' },
                            { label: 'Witness', value: 'Witness' },
                          ]}
                        />
                      </Field>

                      <Field label="Company / Entity">
                        <Input
                          value={party.organization || ''}
                          onChange={(e) => updateParty(idx, 'organization', e.target.value)}
                          placeholder="Acme Global Inc"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 3: Terms & Clauses */}
        {currentStep === 2 && (
          <div className={styles.stepGrid}>
            <Card
              title="Terms & Clauses Editor"
              action={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Sparkles}
                    onClick={() =>
                      openWithContext({
                        agreementTitle: formData.title,
                        category: formData.categoryId,
                      })
                    }
                  >
                    AI Copilot
                  </Button>
                  <Button size="sm" variant="primary" leftIcon={Plus} onClick={addClause}>
                    Add Clause
                  </Button>
                </div>
              }
            >
              <div className={styles.clausesList}>
                {formData.clauses.map((clause, idx) => (
                  <div key={clause.id || idx} className={styles.clauseCard}>
                    <div className={styles.clauseTop}>
                      <div className={styles.reorderControls}>
                        <button
                          type="button"
                          className={styles.reorderBtn}
                          disabled={idx === 0}
                          onClick={() => moveClause(idx, 'up')}
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.reorderBtn}
                          disabled={idx === formData.clauses.length - 1}
                          onClick={() => moveClause(idx, 'down')}
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <input
                        type="text"
                        className={styles.clauseTitleInput}
                        value={clause.title}
                        onChange={(e) => updateClause(idx, 'title', e.target.value)}
                      />

                      <IconButton
                        icon={Trash2}
                        size="sm"
                        variant="ghost"
                        aria-label="Remove clause"
                        onClick={() => removeClause(idx)}
                      />
                    </div>

                    <Textarea
                      rows={3}
                      value={clause.content}
                      onChange={(e) => updateClause(idx, 'content', e.target.value)}
                      placeholder="Clause contractual provisions..."
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 4: Payment Milestones */}
        {currentStep === 3 && (
          <div className={styles.stepGrid}>
            <Card
              title="Payment & Deliverable Milestones"
              action={
                <Button size="sm" variant="outline" leftIcon={Plus} onClick={addMilestone}>
                  Add Milestone
                </Button>
              }
            >
              <p className={styles.stepHint}>
                Attach financial payment obligations to verifiable delivery milestones. Total contract value:{' '}
                <strong>{formatCurrency(Number(formData.value) || 0)}</strong>.
              </p>

              <div className={styles.milestonesList}>
                {formData.paymentMilestones.map((m, idx) => (
                  <div key={m.id || idx} className={styles.milestoneItem}>
                    <div className={styles.milestoneRowGrid}>
                      <Field label="Milestone Title" required>
                        <Input
                          value={m.title}
                          onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                          placeholder="e.g. Deposit or Final Delivery"
                          required
                        />
                      </Field>

                      <Field label="Amount (USD)" required>
                        <Input
                          type="number"
                          value={m.amount}
                          onChange={(e) => updateMilestone(idx, 'amount', Number(e.target.value))}
                          placeholder="5000"
                          required
                        />
                      </Field>

                      <Field label="Due Date" required>
                        <DatePicker
                          value={m.dueDate}
                          onChange={(v) => updateMilestone(idx, 'dueDate', v)}
                        />
                      </Field>

                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                        <IconButton
                          icon={Trash2}
                          size="md"
                          variant="danger"
                          aria-label="Remove milestone"
                          onClick={() => removeMilestone(idx)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 5: Review & Rendered Document Preview */}
        {currentStep === 4 && (
          <div className={styles.reviewLayout}>
            {/* Left summary column */}
            <div className={styles.reviewSummary}>
              <Card title="Execution Summary">
                <div className={styles.summaryStack}>
                  <div>
                    <span className={styles.summaryLabel}>Agreement Title</span>
                    <strong className={styles.summaryVal}>{formData.title}</strong>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Total Consideration</span>
                    <strong className={styles.summaryVal}>
                      {formatCurrency(Number(formData.value) || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Signers Required</span>
                    <div className={styles.signersCount}>
                      <Users size={14} />
                      <span>{formData.parties.filter((p) => p.role === 'Signer').length} Signers</span>
                    </div>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Effective Term</span>
                    <span>
                      {formData.effectiveDate} to {formData.expirationDate || 'Open-ended'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Paginated Document Preview */}
            <div className={styles.reviewPreviewPaper}>
              <div className={styles.watermarkBadge}>DRAFT COPY</div>
              <div className={styles.paperHeader}>
                <h1 className={styles.paperTitle}>{formData.title || 'UNTITLED AGREEMENT'}</h1>
                <p className={styles.paperMeta}>
                  Dated for reference: {formData.effectiveDate || 'March 2026'}
                </p>
              </div>

              <div className={styles.paperIntro}>
                <p>
                  This Agreement (&ldquo;Agreement&rdquo;) is entered into by and between the counterparties identified below. In consideration of the mutual covenants contained herein, the parties agree as follows:
                </p>
              </div>

              <div className={styles.paperClauses}>
                {formData.clauses.map((c) => (
                  <div key={c.id} className={styles.paperClause}>
                    <h3 className={styles.paperClauseTitle}>{c.title}</h3>
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>

              {formData.paymentMilestones.length > 0 && (
                <div className={styles.paperMilestones}>
                  <h3 className={styles.paperClauseTitle}>Exhibit A: Payment Milestones</h3>
                  <table className={styles.paperTable}>
                    <thead>
                      <tr>
                        <th>Milestone</th>
                        <th>Amount</th>
                        <th>Target Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.paymentMilestones.map((m) => (
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

              <div className={styles.paperSignatures}>
                <h3 className={styles.paperClauseTitle}>Signatures and Execution</h3>
                <div className={styles.paperSignersGrid}>
                  {formData.parties.map((p) => (
                    <div key={p.id} className={styles.paperSignBox}>
                      <span className={styles.paperSignRole}>{p.role.toUpperCase()}</span>
                      <div className={styles.paperSignLine} />
                      <strong>{p.name}</strong>
                      <span>{p.organization || 'Authorized Representative'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Finalize & Dispatch */}
        {currentStep === 5 && (
          <div className={styles.stepGrid}>
            <Card title="Signing Delivery & Final Dispatch">
              <div className={styles.formStack}>
                <Field label="Automated Email Reminders" hint="Send reminders to counterparties who haven't completed their signatures">
                  <Select
                    value={formData.reminderFrequency}
                    onChange={(v) => updateForm('reminderFrequency', v)}
                    options={[
                      { label: 'Every 24 hours (Daily)', value: 'daily' },
                      { label: 'Every 3 days', value: '3days' },
                      { label: 'Weekly', value: 'weekly' },
                      { label: 'Disabled (No automated reminders)', value: 'none' },
                    ]}
                  />
                </Field>

                <Field label="Custom Invitation Message to Signers">
                  <Textarea
                    rows={3}
                    value={formData.invitationMessage}
                    onChange={(e) => updateForm('invitationMessage', e.target.value)}
                    placeholder="Message included in the automated signing email notification..."
                  />
                </Field>

                <div className={styles.dispatchActionsBox}>
                  <div className={styles.dispatchChoice}>
                    <div>
                      <strong>Send for Signatures Immediately</strong>
                      <p>Dispatches public guest signing links to all counterparties simultaneously.</p>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={Send}
                      isLoading={saving}
                      onClick={() => handleFinalSubmit('awaiting_signatures')}
                    >
                      Send Invitations
                    </Button>
                  </div>

                  <div className={styles.dispatchChoice}>
                    <div>
                      <strong>Submit for Internal Review</strong>
                      <p>Routes to General Counsel Alex Rivera before dispatching to counterparties.</p>
                    </div>
                    <Button
                      variant="secondary"
                      leftIcon={CheckCircle}
                      isLoading={saving}
                      onClick={() => handleFinalSubmit('in_review')}
                    >
                      Submit for Review
                    </Button>
                  </div>

                  <div className={styles.dispatchChoice}>
                    <div>
                      <strong>Keep as Draft</strong>
                      <p>Store in your workspace repository without notifying counterparties yet.</p>
                    </div>
                    <Button
                      variant="outline"
                      leftIcon={Save}
                      isLoading={saving}
                      onClick={() => handleFinalSubmit('draft')}
                    >
                      Save as Draft
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* STEPPER NAVIGATION CONTROLS */}
      <div className={styles.bottomNav}>
        <Button
          variant="outline"
          leftIcon={ArrowLeft}
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
        >
          Previous Step
        </Button>

        <div className={styles.bottomNavRight}>
          <Button
            variant="ghost"
            leftIcon={Save}
            onClick={() => {
              handleFinalSubmit('draft');
            }}
          >
            Save Draft
          </Button>

          {currentStep < 5 && (
            <Button
              variant="primary"
              rightIcon={ArrowRight}
              disabled={!validateStep(currentStep)}
              onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
            >
              Continue to {steps[currentStep + 1]?.title}
            </Button>
          )}
        </div>
      </div>

      {/* Floating Modal Preview for quick peek */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Live Contract Paper Preview"
        size="lg"
      >
        <div className={styles.modalPaperPreview}>
          <h2 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 8px' }}>{formData.title}</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>
            Effective: {formData.effectiveDate} • Total Consideration: {formatCurrency(Number(formData.value) || 0)}
          </p>
          <div className="document-body">
            {formData.clauses.map((c) => (
              <div key={c.id} style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{c.title}</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', lineHeight: 1.6 }}>{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
