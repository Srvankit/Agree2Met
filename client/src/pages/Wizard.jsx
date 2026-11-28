import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock3,
} from 'lucide-react';
import { useWorkspace } from '../context/Workspace';
import { Button, Input, Select, Textarea, IconButton, Modal } from '../components/demo/ui';
import { Document } from '../components/demo/Document';
import { canEdit, canWrite } from '../domain/lifecycle';
import { money } from '../services/mock';
import { agreementsService } from '../services/agreementsService';
import { categoriesService } from '../services/categoriesService';
import s from './pages.module.css';

const steps = ['Details', 'Parties', 'Terms & conditions', 'Payment', 'Review', 'Finalization'];

const blank = () => ({
  title: '',
  categoryId: '',
  category: 'Service Agreement',
  description: '',
  deadline: '2026-12-15',
  signingOrder: 'PARALLEL',
  parties: [
    { name: 'Alex Morgan', email: 'alex@agree2met.com', role: 'PRIMARY', signOrder: 1, signed: false },
    { name: '', email: '', role: 'COUNTERPARTY', signOrder: 2, signed: false },
  ],
  clauses: [
    {
      sectionNumber: '1.0',
      title: 'Scope of work',
      text: 'The provider will deliver the services described in the project scope, subject to mutually agreed milestones.',
      isMandatory: true,
    },
    {
      sectionNumber: '2.0',
      title: 'Payment terms',
      text: 'Payment is due within 30 days of invoice receipt.',
      isMandatory: true,
    },
  ],
  paymentType: 'MILESTONE',
  milestones: [{ title: 'Project completion', amount: 0 }],
  value: 0,
  rowVersion: 1,
  status: 'Draft',
  org: 'studio',
  audit: [],
  files: [],
  reminders: [],
  versions: [],
  archived: false,
});

export function Wizard({ edit }) {
  const { data, update, toast, editAgreement } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isWriteReal = agreementsService.isWriteReal();

  const existing = data.agreements?.find((a) => a.id === edit);
  const [draft, setDraft] = useState(() => (existing ? structuredClone(existing) : blank()));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [autosave, setAutosave] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [categories, setCategories] = useState([]);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [serverAgreement, setServerAgreement] = useState(null);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Load categories from API or mock
  useEffect(() => {
    let active = true;
    categoriesService
      .getCategories(data.org)
      .then((cats) => {
        if (!active || !cats?.length) return;
        setCategories(cats);
        setDraft((d) => {
          if (!d.categoryId) {
            return {
              ...d,
              categoryId: cats[0].id,
              category: cats[0].name,
            };
          }
          return d;
        });
      })
      .catch((err) => {
        console.warn('Failed to load categories:', err);
      });
    return () => {
      active = false;
    };
  }, [data.org]);

  // Load agreement if editing in real mode or from localStorage if new
  useEffect(() => {
    let active = true;
    async function init() {
      if (edit) {
        if (isWriteReal) {
          try {
            const real = await agreementsService.getAgreementById(edit, data.org);
            if (active && real) {
              setServerAgreement(real);
              setDraft({
                id: real.id,
                title: real.title,
                categoryId: real.category?.id || '',
                category: real.category?.name || 'General Agreement',
                description: real.description || '',
                deadline: real.expirationDate ? String(real.expirationDate).split('T')[0] : '2026-12-31',
                signingOrder: real.signingOrder || 'PARALLEL',
                parties: (real.parties || []).map((p, idx) => ({
                  name: p.name,
                  email: p.email,
                  role: p.role || (idx === 0 ? 'PRIMARY' : 'COUNTERPARTY'),
                  signOrder: p.signingSequence || idx + 1,
                  signed: p.status === 'SIGNED',
                })),
                clauses: (real.clauses || []).map((c, idx) => ({
                  sectionNumber: c.sectionNumber || `${idx + 1}.0`,
                  title: c.title,
                  text: c.content,
                  isMandatory: Boolean(c.isMandatory),
                })),
                paymentType: real.paymentTerms?.paymentSchedule || 'MILESTONE',
                milestones: (real.paymentTerms?.milestones || []).map((m) => ({
                  title: m.name,
                  amount: m.amount || 0,
                })),
                value: Number(real.paymentTerms?.totalAmount || 0),
                rowVersion: real.rowVersion || 1,
                status: real.status === 'DRAFT' ? 'Draft' : real.status,
                versions: [],
                audit: [],
                files: [],
                reminders: [],
                archived: Boolean(real.isArchived),
              });
            }
          } catch (err) {
            console.warn('Failed to fetch real agreement for edit:', err);
          }
        }
      } else {
        try {
          const raw = localStorage.getItem('agree2met-wizard');
          if (raw) setDraft(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    }
    init();
    return () => {
      active = false;
    };
  }, [edit, isWriteReal, data.org]);

  // Debounced Autosave (2s)
  useEffect(() => {
    if (!loaded) return;
    setAutosave('Saving…');

    const timer = setTimeout(async () => {
      try {
        const cur = draftRef.current;
        // Mock / local storage save
        localStorage.setItem(
          edit ? `agree2met-wizard-${edit}` : 'agree2met-wizard',
          JSON.stringify(cur)
        );

        // Real mode autosave if agreement exists on server
        if (isWriteReal && (cur.id || edit)) {
          const targetId = cur.id || edit;
          const totalVal = (cur.milestones || []).reduce((sum, m) => sum + Number(m.amount || 0), 0);
          const autosaveRes = await agreementsService.autosaveAgreement(
            targetId,
            {
              expectedRowVersion: cur.rowVersion,
              title: cur.title,
              description: cur.description || null,
              categoryId: cur.categoryId || undefined,
              signingOrder: cur.signingOrder,
              expirationDate: cur.deadline ? new Date(cur.deadline + 'T23:59:59Z').toISOString() : null,
              parties: (cur.parties || []).map((p, idx) => ({
                name: p.name,
                email: p.email,
                role: p.role || (idx === 0 ? 'PRIMARY' : 'COUNTERPARTY'),
                signingSequence: p.signOrder || idx + 1,
              })),
              clauses: (cur.clauses || []).map((c, idx) => ({
                sectionNumber: c.sectionNumber || `${idx + 1}.0`,
                title: c.title,
                content: c.text,
                isMandatory: Boolean(c.isMandatory),
                displayOrder: idx + 1,
              })),
              paymentTerms: {
                totalAmount: totalVal,
                currency: 'USD',
                paymentSchedule: cur.paymentType || 'MILESTONE',
                milestones: (cur.milestones || []).map((m) => ({
                  name: m.title,
                  amount: Number(m.amount) || 0,
                  percentage: totalVal > 0 ? Math.round(((Number(m.amount) || 0) / totalVal) * 100) : 0,
                  status: 'PENDING',
                })),
              },
            },
            data.org
          );

          setDraft((d) => ({ ...d, rowVersion: autosaveRes.rowVersion }));
        }

        setAutosave('All changes saved');
      } catch (err) {
        if (err.status === 409 || err.code === 'CONCURRENT_MODIFICATION') {
          setAutosave('Conflict detected');
          setConflictModalOpen(true);
        } else {
          setAutosave('Failed to save — Retry');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [draft, loaded, edit, isWriteReal, data.org]);

  function change(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError('');
  }

  function item(key, index, field, value) {
    change(
      key,
      draft[key].map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function applyCategoryTemplate(catId) {
    if (!catId) return;
    try {
      const templateClauses = await categoriesService.getTemplateClauses(catId, data.org);
      if (templateClauses && templateClauses.length > 0) {
        change(
          'clauses',
          templateClauses.map((tc, idx) => ({
            sectionNumber: tc.sectionNumber || `${idx + 1}.0`,
            title: tc.title,
            text: tc.content,
            isMandatory: tc.isMandatory,
          }))
        );
        toast('Category template clauses applied');
      }
    } catch {
      toast('Failed to load category clauses');
    }
  }

  function validate(index) {
    if (index === 0 && (!draft.title.trim() || !draft.deadline)) {
      return 'Add an agreement name and deadline.';
    }
    if (
      index === 1 &&
      (draft.parties.length < 2 ||
        draft.parties.some((p) => !p.name.trim() || !/^\S+@\S+\.\S+$/.test(p.email)))
    ) {
      return 'Add at least two parties with a name and valid email.';
    }
    if (
      index === 2 &&
      (!draft.clauses.length || draft.clauses.some((c) => !c.title.trim() || !c.text.trim()))
    ) {
      return 'Each clause needs a heading and text.';
    }
    if (
      index === 3 &&
      draft.milestones.some(
        (m) => !m.title.trim() || !Number.isFinite(Number(m.amount)) || Number(m.amount) < 0
      )
    ) {
      return 'Add a milestone name and a non-negative amount.';
    }
    return '';
  }

  function next() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setStep((v) => Math.min(5, v + 1));
  }

  async function handleReloadLatest() {
    const targetId = draft.id || edit;
    if (!targetId) {
      setConflictModalOpen(false);
      return;
    }
    try {
      const fresh = await agreementsService.getAgreementById(targetId, data.org);
      setDraft((d) => ({
        ...d,
        rowVersion: fresh.rowVersion,
        title: fresh.title,
        description: fresh.description || '',
        clauses: (fresh.clauses || []).map((c, idx) => ({
          sectionNumber: c.sectionNumber || `${idx + 1}.0`,
          title: c.title,
          text: c.content,
          isMandatory: Boolean(c.isMandatory),
        })),
      }));
      setConflictModalOpen(false);
      toast('Reloaded latest server version');
    } catch {
      toast('Failed to reload agreement');
    }
  }

  async function handleKeepMyVersion() {
    const targetId = draft.id || edit;
    if (!targetId) {
      setConflictModalOpen(false);
      return;
    }
    try {
      const fresh = await agreementsService.getAgreementById(targetId, data.org);
      setDraft((d) => ({ ...d, rowVersion: fresh.rowVersion }));
      setConflictModalOpen(false);
      toast('Updated base version. Local changes retained.');
    } catch {
      toast('Failed to resolve conflict');
    }
  }

  async function save(actionType = 'DRAFT') {
    if (sending) return;

    // Validate all 4 initial steps for review or send
    if (actionType === 'REVIEW' || actionType === 'SEND') {
      for (let i = 0; i < 4; i++) {
        const message = validate(i);
        if (message) {
          setStep(i);
          setError(message);
          return;
        }
      }
    }

    setSending(true);
    setError('');

    const value = draft.milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

    // REAL BACKEND WRITE
    if (isWriteReal) {
      try {
        const payload = {
          title: draft.title.trim(),
          description: draft.description?.trim() || null,
          categoryId: draft.categoryId || undefined,
          signingOrder: draft.signingOrder || 'PARALLEL',
          expirationDate: draft.deadline ? new Date(draft.deadline + 'T23:59:59Z').toISOString() : null,
          parties: draft.parties.map((p, idx) => ({
            name: p.name.trim(),
            email: p.email.trim().toLowerCase(),
            role: p.role || (idx === 0 ? 'PRIMARY' : 'COUNTERPARTY'),
            partyType: 'EXTERNAL',
            signingSequence: p.signOrder || idx + 1,
          })),
          clauses: draft.clauses.map((c, idx) => ({
            sectionNumber: c.sectionNumber || `${idx + 1}.0`,
            title: c.title.trim(),
            content: (c.text || '').trim(),
            isMandatory: Boolean(c.isMandatory),
            displayOrder: idx + 1,
          })),
          paymentTerms: {
            totalAmount: value,
            currency: 'USD',
            paymentSchedule: draft.paymentType || 'MILESTONE',
            milestones: draft.milestones.map((m) => ({
              name: m.title.trim(),
              amount: Number(m.amount) || 0,
              percentage: value > 0 ? Math.round(((Number(m.amount) || 0) / value) * 100) : 0,
              status: 'PENDING',
            })),
          },
        };

        let targetId = draft.id || edit;

        if (targetId) {
          await agreementsService.updateAgreement(
            targetId,
            { ...payload, expectedRowVersion: draft.rowVersion },
            data.org
          );
        } else {
          const idempotencyKey = crypto.randomUUID();
          const created = await agreementsService.createAgreement(payload, idempotencyKey, data.org);
          targetId = created.id;
        }

        if (actionType === 'REVIEW') {
          await agreementsService.changeStatus(targetId, 'PENDING_REVIEW', 'Marked ready for review', data.org);
        }

        // Cache Invalidation
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics'] });

        localStorage.removeItem(edit ? `agree2met-wizard-${edit}` : 'agree2met-wizard');
        toast(actionType === 'REVIEW' ? 'Agreement marked ready for review' : 'Draft saved');
        navigate({ to: '/app/agreements/$id', params: { id: targetId } });
        return;
      } catch (err) {
        if (err.status === 409 || err.code === 'CONCURRENT_MODIFICATION') {
          setConflictModalOpen(true);
          setError('Conflict: This agreement was modified in another session.');
        } else {
          setError(err.message || 'Failed to save agreement.');
        }
        setSending(false);
        return;
      }
    }

    // MOCK WRITE
    const id = existing?.id ?? `AG-2026-${Date.now()}`;
    const a = {
      ...draft,
      id,
      org: data.org,
      value,
      status: actionType === 'SEND' ? 'Sent' : actionType === 'REVIEW' ? 'Pending Review' : 'Draft',
      client: draft.parties[1]?.name || 'New client',
      created: existing?.created ?? new Date().toISOString().slice(0, 10),
      token: existing?.token ?? `demo-${Date.now()}`,
      versions: [
        ...draft.versions,
        {
          name: `Version ${draft.versions.length + 1}`,
          date: new Date().toISOString().slice(0, 10),
          text: draft.clauses.map((c) => `${c.title}: ${c.text}`).join('\n'),
        },
      ],
    };

    if (existing) {
      await editAgreement(
        id,
        a,
        actionType === 'SEND' ? 'Agreement sent (demo)' : actionType === 'REVIEW' ? 'Marked ready for review' : 'Draft saved'
      );
    } else {
      update((d) => ({
        ...d,
        agreements: [a, ...d.agreements],
        notifications:
          actionType === 'SEND'
            ? [{ id: Date.now(), title: 'Agreement sent (demo)', text: a.title, read: false, agreement: id }, ...d.notifications]
            : d.notifications,
      }));
      toast(
        actionType === 'SEND'
          ? 'Agreement sent in demo mode'
          : actionType === 'REVIEW'
            ? 'Agreement marked ready for review'
            : 'Draft saved'
      );
    }

    localStorage.removeItem(edit ? `agree2met-wizard-${edit}` : 'agree2met-wizard');
    navigate({ to: '/app/agreements/$id', params: { id } });
  }

  if (!canWrite(data.demoRole) || (existing && !canEdit(existing.status))) {
    return (
      <main className={s.page}>
        <div className={s.error}>This agreement cannot be edited in its current state or role.</div>
      </main>
    );
  }

  const preview = {
    ...draft,
    value: draft.milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0),
  };

  const categoryOptions = categories.length
    ? categories.map((c) => ({ label: c.name, value: c.id }))
    : data.categories || ['Service Agreement'];

  return (
    <main className={s.page}>
      <div className={s.heading}>
        <div>
          <h1>{existing || edit ? 'Edit agreement' : 'Create an agreement'}</h1>
          <p>Bring the details together. Make it official.</p>
        </div>
        <div className={s.headingActions}>
          <span className={s.muted}>{autosave}</span>
          <Button icon={Save} disabled={sending} onClick={() => save('DRAFT')}>
            Save draft
          </Button>
        </div>
      </div>

      <div className={s.steps}>
        {steps.map((label, i) => (
          <div className={`${s.step} ${i <= step ? s.stepCurrent : ''}`} key={label}>
            <b>{i < step ? <CheckCircle2 size={13} /> : i + 1}</b>
            {label}
          </div>
        ))}
      </div>

      <div className={s.wizardGrid}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>{steps[step]}</h2>
            <span className={s.muted}>Step {step + 1} of 6</span>
          </div>

          <form
            className={`${s.panelBody} ${s.stack}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 5) {
                save(isWriteReal ? 'DRAFT' : 'SEND');
              } else {
                next();
              }
            }}
          >
            {error && (
              <div role="alert" className={s.error}>
                {error}
              </div>
            )}

            {/* Step 0: Details */}
            {step === 0 && (
              <>
                <Input
                  label="Agreement name"
                  placeholder="e.g. Master Services Agreement"
                  value={draft.title}
                  onChange={(e) => change('title', e.target.value)}
                  required
                />
                <div className={s.formGrid}>
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={draft.categoryId || draft.category}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.id === e.target.value);
                      if (selectedCat) {
                        change('categoryId', selectedCat.id);
                        change('category', selectedCat.name);
                      } else {
                        change('category', e.target.value);
                      }
                    }}
                  />
                  <Input
                    label="Deadline / Expiration date"
                    type="date"
                    value={draft.deadline}
                    onChange={(e) => change('deadline', e.target.value)}
                    required
                  />
                </div>
                <div className={s.formGrid}>
                  <Select
                    label="Signing order"
                    options={[
                      { label: 'Parallel (sign anytime)', value: 'PARALLEL' },
                      { label: 'Sequential (sign in order)', value: 'SEQUENTIAL' },
                    ]}
                    value={draft.signingOrder}
                    onChange={(e) => change('signingOrder', e.target.value)}
                  />
                </div>
                <Textarea
                  label="Description / Project scope"
                  placeholder="Project context and an executive summary of this agreement…"
                  value={draft.description}
                  onChange={(e) => change('description', e.target.value)}
                />
              </>
            )}

            {/* Step 1: Parties */}
            {step === 1 && (
              <>
                {draft.parties.map((p, i) => (
                  <div className={s.clause} key={i}>
                    <div className={s.between}>
                      <h3>
                        Party {i + 1} ({p.role || (i === 0 ? 'PRIMARY' : 'COUNTERPARTY')})
                      </h3>
                      {i > 1 && (
                        <IconButton
                          icon={Trash2}
                          label="Remove party"
                          onClick={() =>
                            change(
                              'parties',
                              draft.parties.filter((_, j) => j !== i)
                            )
                          }
                        />
                      )}
                    </div>
                    <div className={s.formGrid}>
                      <Input
                        label="Full name / organization"
                        value={p.name}
                        required
                        onChange={(e) => item('parties', i, 'name', e.target.value)}
                      />
                      <Input
                        label="Email address"
                        type="email"
                        required
                        value={p.email}
                        onChange={(e) => item('parties', i, 'email', e.target.value)}
                      />
                    </div>
                    <div className={s.formGrid} style={{ marginTop: 8 }}>
                      <Select
                        label="Role"
                        options={[
                          { label: 'Primary (Creator)', value: 'PRIMARY' },
                          { label: 'Counterparty (Signer)', value: 'COUNTERPARTY' },
                          { label: 'Viewer (CC only)', value: 'VIEWER' },
                        ]}
                        value={p.role || (i === 0 ? 'PRIMARY' : 'COUNTERPARTY')}
                        onChange={(e) => item('parties', i, 'role', e.target.value)}
                      />
                      <Input
                        label="Signing sequence"
                        type="number"
                        min="1"
                        value={p.signOrder || i + 1}
                        onChange={(e) => item('parties', i, 'signOrder', Number(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  icon={Plus}
                  onClick={() =>
                    change('parties', [
                      ...draft.parties,
                      {
                        name: '',
                        email: '',
                        role: 'COUNTERPARTY',
                        signOrder: draft.parties.length + 1,
                        signed: false,
                      },
                    ])
                  }
                >
                  Add party
                </Button>
              </>
            )}

            {/* Step 2: Terms & Conditions */}
            {step === 2 && (
              <>
                <Select
                  label="Apply category template"
                  options={[
                    { label: 'Choose a category template to prefill clauses…', value: '' },
                    ...categories.map((c) => ({ label: `${c.name} Template`, value: c.id })),
                  ]}
                  onChange={(e) => {
                    if (e.target.value) {
                      applyCategoryTemplate(e.target.value);
                    }
                  }}
                />
                {draft.clauses.map((c, i) => (
                  <div className={`${s.clause} ${s.stack}`} key={i}>
                    <div className={s.between}>
                      <b>
                        Section {c.sectionNumber || `${i + 1}.0`}
                        {c.isMandatory ? ' (Mandatory)' : ''}
                      </b>
                      <div className={s.flex}>
                        <IconButton
                          icon={ChevronUp}
                          label="Move clause up"
                          disabled={i === 0}
                          onClick={() => {
                            const a = [...draft.clauses];
                            [a[i - 1], a[i]] = [a[i], a[i - 1]];
                            change('clauses', a);
                          }}
                        />
                        <IconButton
                          icon={ChevronDown}
                          label="Move clause down"
                          disabled={i === draft.clauses.length - 1}
                          onClick={() => {
                            const a = [...draft.clauses];
                            [a[i], a[i + 1]] = [a[i + 1], a[i]];
                            change('clauses', a);
                          }}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Remove clause"
                          onClick={() =>
                            change(
                              'clauses',
                              draft.clauses.filter((_, j) => j !== i)
                            )
                          }
                        />
                      </div>
                    </div>
                    <Input
                      label="Heading"
                      value={c.title}
                      required
                      onChange={(e) => item('clauses', i, 'title', e.target.value)}
                    />
                    <Textarea
                      label="Clause text"
                      required
                      value={c.text}
                      onChange={(e) => item('clauses', i, 'text', e.target.value)}
                    />
                    <label className={s.checkRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(c.isMandatory)}
                        onChange={(e) => item('clauses', i, 'isMandatory', e.target.checked)}
                      />
                      Standard mandatory clause
                    </label>
                  </div>
                ))}
                <Button
                  icon={Plus}
                  onClick={() =>
                    change('clauses', [
                      ...draft.clauses,
                      {
                        sectionNumber: `${draft.clauses.length + 1}.0`,
                        title: '',
                        text: '',
                        isMandatory: false,
                      },
                    ])
                  }
                >
                  Add clause
                </Button>
              </>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <>
                <div className={s.formGrid}>
                  <Select
                    label="Payment schedule / type"
                    options={[
                      { label: 'Milestone-based', value: 'MILESTONE' },
                      { label: 'Fixed price', value: 'FIXED' },
                      { label: 'Hourly rate', value: 'HOURLY' },
                      { label: 'Net 30 invoice', value: 'NET_30' },
                    ]}
                    value={draft.paymentType}
                    onChange={(e) => change('paymentType', e.target.value)}
                  />
                  <Input label="Currency" value="USD" disabled />
                </div>

                {draft.milestones.map((m, i) => (
                  <div key={i} className={s.formGrid}>
                    <Input
                      label="Milestone name"
                      value={m.title}
                      required
                      onChange={(e) => item('milestones', i, 'title', e.target.value)}
                    />
                    <div className={s.flex}>
                      <Input
                        label="Amount (USD)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.amount}
                        onChange={(e) => item('milestones', i, 'amount', e.target.value)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Remove milestone"
                        onClick={() =>
                          change(
                            'milestones',
                            draft.milestones.filter((_, j) => j !== i)
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                <Button
                  icon={Plus}
                  onClick={() =>
                    change('milestones', [...draft.milestones, { title: '', amount: 0 }])
                  }
                >
                  Add milestone
                </Button>

                <div className={s.between}>
                  <b>Total agreement value</b>
                  <b>{money(preview.value)}</b>
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <>
                <div className={s.notice}>
                  Your agreement is ready for review. Confirm the names, clauses, and payment terms before finalizing.
                </div>
                <h3>{draft.title || 'Untitled Agreement'}</h3>
                <p>
                  <b>Category:</b> {draft.category} · <b>Deadline:</b> {draft.deadline}
                </p>
                <p>
                  <b>Parties:</b>{' '}
                  {draft.parties.map((p) => `${p.name} (${p.email}) [${p.role || 'COUNTERPARTY'}]`).join(' ↔ ')}
                </p>
                <p>
                  <b>Terms:</b> {draft.clauses.length} clauses · {draft.milestones.length} milestones ·{' '}
                  {money(preview.value)}
                </p>
                <Button onClick={() => setStep(0)}>Edit details</Button>
              </>
            )}

            {/* Step 5: Finalization */}
            {step === 5 && (
              <>
                {isWriteReal ? (
                  <div className={s.notice}>
                    Review your agreement before finalizing. In this phase (Phase 5), you can save your agreement as a
                    draft or mark it ready for internal review. Live invitation sending and e-signatures will be enabled
                    in Phase 6.
                  </div>
                ) : (
                  <div className={s.notice}>
                    Demo delivery creates a shareable signing link. No invitation emails will be sent.
                  </div>
                )}

                <h3>Ready to finalize?</h3>
                <p>
                  <b>Signers:</b> {draft.parties.map((p) => p.email).join(', ')}
                </p>

                <label className={s.checkRow}>
                  <input type="checkbox" required />
                  I have reviewed the agreement and confirm the details are correct.
                </label>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                  <Button icon={Save} disabled={sending} onClick={() => save('DRAFT')}>
                    Save as draft
                  </Button>
                  <Button icon={Clock3} disabled={sending} onClick={() => save('REVIEW')}>
                    Mark ready for review
                  </Button>
                  <Button
                    variant="primary"
                    icon={Send}
                    disabled={isWriteReal || sending}
                    title={isWriteReal ? 'Available in an upcoming release (Phase 6)' : 'Send agreement (demo)'}
                    aria-label="Send for signature"
                    onClick={() => {
                      if (!isWriteReal) save('SEND');
                    }}
                  >
                    Send for signature
                  </Button>
                </div>
              </>
            )}

            <div className={s.between} style={{ marginTop: 24 }}>
              <Button icon={ArrowLeft} disabled={step === 0} onClick={() => setStep((v) => v - 1)}>
                Back
              </Button>
              {step < 5 && (
                <Button type="button" variant="primary" icon={ArrowRight} onClick={next}>
                  Continue
                </Button>
              )}
            </div>
          </form>
        </section>

        <aside>
          <div className={s.heading}>
            <h3>Live document preview</h3>
            <span className={s.eyebrow}>{draft.status || 'Draft'}</span>
          </div>
          <Document agreement={preview} />
        </aside>
      </div>

      {/* Concurrent Modification Conflict Modal */}
      <Modal
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="Concurrent Modification Conflict"
      >
        <div className={s.stack}>
          <div className={s.error} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={20} />
            <span>This agreement was modified in another session. Your local changes conflict with the latest server version.</span>
          </div>
          <p>
            You can reload the latest server version (discarding conflicting local changes) or keep your version
            (re-basing your edits onto the current server row version).
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="default" onClick={handleReloadLatest}>
              Reload latest
            </Button>
            <Button variant="primary" onClick={handleKeepMyVersion}>
              Keep my version
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
