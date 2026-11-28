import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Share2,
  Download,
  Printer,
  Plus,
  Trash2,
  ShieldCheck,
  Send,
  Copy,
  FileText,
  Clock3,
  PenLine,
  X,
  History,
  Diff,
} from 'lucide-react';
import { useWorkspace } from '../context/Workspace';
import {
  Button,
  Badge,
  Tabs,
  Modal,
  Input,
  Select,
  EmptyState,
  Avatar,
  Textarea,
  IconButton,
  Skeleton,
} from '../components/demo/ui';
import { AgreementActions } from '../components/demo/AgreementTable';
import { Document } from '../components/demo/Document';
import { AppLink } from '../components/demo/Shell';
import { validActions, canEdit, canWrite } from '../domain/lifecycle';
import { money, dateLabel, download as mockDownload, documentText, verifyAudit } from '../services/mock';
import { isServiceReal } from '../services/serviceMode';
import { agreementsService } from '../services/agreementsService';
import s from './pages.module.css';

export function Detail({ id }) {
  const { data, editAgreement, toast } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isReal = isServiceReal('agreements') || isServiceReal('agreements-read');

  const [tab, setTab] = useState('Overview');
  const [share, setShare] = useState(false);
  const [invite, setInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ver1, setVer1] = useState('1');
  const [ver2, setVer2] = useState('1');
  const [reminder, setReminder] = useState('');
  const [verify, setVerify] = useState('');
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState('');

  // Real backend detail state
  const [realAgreement, setRealAgreement] = useState(null);
  const [realVersions, setRealVersions] = useState([]);
  const [v1Detail, setV1Detail] = useState(null);
  const [v2Detail, setV2Detail] = useState(null);
  const [loading, setLoading] = useState(isReal);
  const [error, setError] = useState(null);

  const loadRealDetail = useCallback(async () => {
    if (!isReal || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [res, versionsList] = await Promise.all([
        agreementsService.getAgreementById(id, data.org),
        agreementsService.getVersions(id, data.org).catch(() => []),
      ]);
      setRealAgreement(res);
      setRealVersions(versionsList || []);
      if (versionsList && versionsList.length > 0) {
        const latestNum = versionsList[0].versionNumber;
        const prevNum = versionsList.length > 1 ? versionsList[1].versionNumber : latestNum;
        setVer1(String(prevNum));
        setVer2(String(latestNum));
      }
    } catch (err) {
      console.warn('Failed to load agreement detail:', err);
      setError(err.message || 'Agreement not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [isReal, id, data.org]);

  useEffect(() => {
    setOrigin(window.location.origin);
    loadRealDetail();
  }, [loadRealDetail]);

  // Load version details when version selections change in real mode
  useEffect(() => {
    if (!isReal || !id || !realVersions.length) return;
    let active = true;

    async function loadVersionDetails() {
      try {
        const [d1, d2] = await Promise.all([
          agreementsService.getVersion(id, Number(ver1), data.org).catch(() => null),
          agreementsService.getVersion(id, Number(ver2), data.org).catch(() => null),
        ]);
        if (active) {
          setV1Detail(d1);
          setV2Detail(d2);
        }
      } catch (err) {
        console.warn('Failed to load version snapshots:', err);
      }
    }

    loadVersionDetails();
    return () => {
      active = false;
    };
  }, [isReal, id, ver1, ver2, realVersions, data.org]);

  const mockAgreement = data.agreements?.find((x) => x.id === id && x.org === data.org);

  if (loading) {
    return (
      <main className={s.page}>
        <Skeleton />
      </main>
    );
  }

  // Format real agreement into presentation shape
  let a = mockAgreement;
  if (isReal && realAgreement) {
    a = {
      id: realAgreement.id,
      title: realAgreement.title,
      referenceNumber: realAgreement.referenceNumber,
      client: realAgreement.parties?.[0]?.companyName || realAgreement.parties?.[0]?.name || 'Counterparty',
      category: realAgreement.category?.name || 'General Agreement',
      status:
        realAgreement.status === 'COMPLETED'
          ? 'Completed'
          : realAgreement.status === 'DRAFT'
            ? 'Draft'
            : realAgreement.status === 'PENDING_REVIEW'
              ? 'Pending Review'
              : realAgreement.status === 'AWAITING_SIGNATURES'
                ? 'Awaiting Signatures'
                : realAgreement.status === 'PARTIALLY_SIGNED'
                  ? 'Partially Signed'
                  : realAgreement.status === 'EXPIRED'
                    ? 'Expired'
                    : realAgreement.status === 'CANCELLED'
                      ? 'Cancelled'
                      : 'Sent',
      rawStatus: realAgreement.status,
      rowVersion: realAgreement.rowVersion,
      value: realAgreement.paymentTerms?.totalAmount ? Number(realAgreement.paymentTerms.totalAmount) : 0,
      deadline: realAgreement.expirationDate ? String(realAgreement.expirationDate).split('T')[0] : '2026-12-31',
      created: String(realAgreement.createdAt).split('T')[0],
      description: realAgreement.description,
      parties: (realAgreement.parties || []).map((p) => ({
        name: p.name,
        email: p.email,
        signed: p.status === 'SIGNED',
        role: p.role,
      })),
      clauses: (realAgreement.clauses || []).map((c) => ({
        title: `${c.sectionNumber} ${c.title}`,
        text: c.content,
      })),
      audit: (realAgreement.auditTrail?.events || []).map((ev) => ({
        seq: ev.seq,
        action: ev.eventType.replace(/_/g, ' '),
        actor: ev.actorName || ev.actorEmail || 'System',
        date: ev.createdAt,
        hash: ev.eventHash,
        previousHash: ev.previousEventHash,
      })),
      auditVerification: realAgreement.auditTrail?.verification,
      files: [],
      reminders: [],
      versions: realVersions.map((v) => ({
        name: `v${v.versionNumber}.0 (${v.changeSummary || 'Snapshot'})`,
        text: `Version ${v.versionNumber} committed on ${new Date(v.createdAt).toLocaleDateString()}`,
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        author: v.creator?.profile?.displayName || v.creator?.email || 'User',
      })),
      token: 'real-signing-token',
    };
  }

  if (!a) {
    return (
      <main className={s.page}>
        <EmptyState
          title="Agreement not found"
          text={error || 'It may have been deleted or belongs to another workspace.'}
        >
          <AppLink page="agreements">Back to agreements</AppLink>
        </EmptyState>
      </main>
    );
  }

  const writable = !isReal && canWrite(data.demoRole);
  const actions = isReal ? [] : validActions(a.status);

  // Status transitions
  const handleRealTransition = async (nextStatus, label) => {
    setBusy(true);
    try {
      await agreementsService.changeStatus(a.id, nextStatus, label, data.org);
      await queryClient.invalidateQueries({ queryKey: ['agreements'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast(label);
      await loadRealDetail();
    } catch (err) {
      toast(err.message || 'Failed to update agreement status');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      if (isReal) {
        const copy = await agreementsService.duplicateAgreement(a.id, data.org);
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics'] });
        toast('Agreement duplicated');
        navigate({ to: '/app/agreements/$id', params: { id: copy.id } });
      } else {
        const copy = {
          ...a,
          id: `AG-2026-${Date.now()}`,
          title: `${a.title} (copy)`,
          status: 'Draft',
          token: `demo-${Date.now()}`,
          audit: [],
          archived: false,
          parties: a.parties.map((p) => ({ ...p, signed: false })),
        };
        data.update((d) => ({ ...d, agreements: [copy, ...d.agreements] }));
        toast('Agreement duplicated');
      }
    } catch (err) {
      toast('Failed to duplicate agreement');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete “${a.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      if (isReal) {
        await agreementsService.deleteAgreement(a.id, data.org);
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics'] });
        toast('Agreement deleted');
        navigate({ to: '/app/agreements' });
      } else {
        data.update((d) => ({ ...d, agreements: d.agreements.filter((x) => x.id !== a.id) }));
        toast('Agreement deleted');
        navigate({ to: '/app/agreements' });
      }
    } catch (err) {
      toast(err.message || 'Failed to delete agreement');
    } finally {
      setBusy(false);
    }
  };

  const change = async (next) => {
    if (isReal) return;
    setBusy(true);
    await editAgreement(a.id, { status: next }, `Status changed to ${next}`);
    setBusy(false);
  };

  async function upload(e) {
    if (isReal) {
      toast('Document attachments will be available in an upcoming release (Phase 7).');
      return;
    }
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast('Demo files must be smaller than 5 MB');
        continue;
      }
      const content = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      await editAgreement(
        id,
        { files: [...(a.files || []), { id: Date.now(), name: file.name, size: file.size, content }] },
        'File uploaded'
      );
    }
    e.target.value = '';
  }

  // Compute section diff between v1 and v2 for Versions tab
  const sectionDiff = useMemo(() => {
    if (!v1Detail?.content?.clauses && !v2Detail?.content?.clauses) return [];
    const c1 = v1Detail?.content?.clauses || [];
    const c2 = v2Detail?.content?.clauses || [];

    const map1 = new Map(c1.map((c) => [c.title, c]));
    const map2 = new Map(c2.map((c) => [c.title, c]));

    const diffList = [];

    // Check clauses in V2
    for (const clause2 of c2) {
      const clause1 = map1.get(clause2.title);
      if (!clause1) {
        diffList.push({
          type: 'ADDED',
          title: clause2.title,
          sectionNumber: clause2.sectionNumber,
          v1Text: null,
          v2Text: clause2.content,
        });
      } else if (clause1.content !== clause2.content) {
        diffList.push({
          type: 'MODIFIED',
          title: clause2.title,
          sectionNumber: clause2.sectionNumber,
          v1Text: clause1.content,
          v2Text: clause2.content,
        });
      } else {
        diffList.push({
          type: 'UNCHANGED',
          title: clause2.title,
          sectionNumber: clause2.sectionNumber,
          v1Text: clause1.content,
          v2Text: clause2.content,
        });
      }
    }

    // Check deleted clauses (in V1 but not in V2)
    for (const clause1 of c1) {
      if (!map2.has(clause1.title)) {
        diffList.push({
          type: 'DELETED',
          title: clause1.title,
          sectionNumber: clause1.sectionNumber,
          v1Text: clause1.content,
          v2Text: null,
        });
      }
    }

    return diffList;
  }, [v1Detail, v2Detail]);

  return (
    <main className={s.page}>
      <AppLink page="agreements" className={s.textLink}>
        ← All agreements
      </AppLink>
      <div className={s.heading} style={{ marginTop: 18 }}>
        <div>
          <div className={s.flex}>
            <h1>{a.title}</h1>
            <Badge status={a.status} />
          </div>
          <p>
            <span className={s.reference}>{a.referenceNumber || a.id}</span> · {a.category} · Created{' '}
            {dateLabel(a.created)}
          </p>
        </div>
        <div className={s.headingActions}>
          <Button icon={Share2} onClick={() => setShare(true)}>
            Share
          </Button>
          <Button icon={Download} onClick={() => mockDownload(`${a.id}.txt`, documentText(a))}>
            Download
          </Button>
          <AgreementActions agreement={a} />
        </div>
      </div>

      <Tabs
        items={['Overview', 'Document', 'Parties', 'Activity & Audit', 'Versions', 'Files', 'Reminders']}
        value={tab}
        onChange={setTab}
      />

      <div className={s.detailContent}>
        {tab === 'Overview' && (
          <>
            <div className={s.summaryGrid}>
              <div>
                <h3>Agreement value</h3>
                <p>{money(a.value)}</p>
              </div>
              <div>
                <h3>Deadline</h3>
                <p>{dateLabel(a.deadline)}</p>
              </div>
              <div>
                <h3>Signing progress</h3>
                <p>
                  {(a.parties || []).filter((p) => p.signed).length} of {(a.parties || []).length} signed
                </p>
              </div>
            </div>

            <div className={s.chartGrid}>
              <section className={s.panel}>
                <div className={s.panelHead}>
                  <h2>Agreement details</h2>
                </div>
                <div className={`${s.panelBody} ${s.stack}`}>
                  <p>
                    {a.description ||
                      `Professional ${a.category.toLowerCase()} between ${(a.parties || []).map((p) => p.name).join(' and ')}.`}
                  </p>
                  {(a.clauses || []).map((c, i) => (
                    <div key={i}>
                      <h3>{c.title}</h3>
                      <p className={s.muted} style={{ marginTop: 8, lineHeight: 1.8 }}>
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={s.panel}>
                <div className={s.panelHead}>
                  <h2>Next steps</h2>
                </div>
                <div className={`${s.panelBody} ${s.stack}`}>
                  {isReal ? (
                    <>
                      {/* DRAFT STATE ACTIONS */}
                      {a.rawStatus === 'DRAFT' && (
                        <>
                          <Button
                            icon={PenLine}
                            onClick={() => navigate({ to: '/app/new', search: { edit: a.id } })}
                          >
                            Edit agreement
                          </Button>
                          <Button
                            variant="primary"
                            icon={Clock3}
                            disabled={busy}
                            onClick={() =>
                              handleRealTransition('PENDING_REVIEW', 'Agreement marked ready for review')
                            }
                          >
                            Mark ready for review
                          </Button>
                          <Button
                            variant="default"
                            icon={X}
                            disabled={busy}
                            onClick={() => handleRealTransition('CANCELLED', 'Agreement cancelled')}
                          >
                            Cancel agreement
                          </Button>
                          <Button variant="default" icon={Copy} disabled={busy} onClick={handleDuplicate}>
                            Duplicate agreement
                          </Button>
                          <Button variant="danger" icon={Trash2} disabled={busy} onClick={handleDelete}>
                            Delete draft
                          </Button>
                          <Button
                            variant="default"
                            icon={Send}
                            disabled={true}
                            title="Available in an upcoming release (Phase 6)"
                            aria-label="Send for signature (Available in an upcoming release Phase 6)"
                          >
                            Send for signature
                          </Button>
                        </>
                      )}

                      {/* PENDING_REVIEW STATE ACTIONS */}
                      {a.rawStatus === 'PENDING_REVIEW' && (
                        <>
                          <Button
                            icon={PenLine}
                            onClick={() => navigate({ to: '/app/new', search: { edit: a.id } })}
                          >
                            Edit agreement
                          </Button>
                          <Button
                            variant="default"
                            disabled={busy}
                            onClick={() => handleRealTransition('DRAFT', 'Agreement reopened as draft')}
                          >
                            Reopen as draft
                          </Button>
                          <Button
                            variant="default"
                            icon={X}
                            disabled={busy}
                            onClick={() => handleRealTransition('CANCELLED', 'Agreement cancelled')}
                          >
                            Cancel agreement
                          </Button>
                          <Button variant="default" icon={Copy} disabled={busy} onClick={handleDuplicate}>
                            Duplicate agreement
                          </Button>
                          <Button
                            variant="default"
                            icon={Send}
                            disabled={true}
                            title="Available in an upcoming release (Phase 6)"
                            aria-label="Send for signature (Available in an upcoming release Phase 6)"
                          >
                            Send for signature
                          </Button>
                        </>
                      )}

                      {/* CANCELLED STATE ACTIONS */}
                      {a.rawStatus === 'CANCELLED' && (
                        <>
                          <p className={s.muted}>This agreement is cancelled.</p>
                          <Button variant="default" icon={Copy} disabled={busy} onClick={handleDuplicate}>
                            Duplicate agreement
                          </Button>
                        </>
                      )}

                      {/* ACTIVE / COMPLETED SIGNING STATES */}
                      {!['DRAFT', 'PENDING_REVIEW', 'CANCELLED'].includes(a.rawStatus) && (
                        <>
                          <p className={s.muted}>
                            This agreement is in an active signing state or completed.
                          </p>
                          <Button variant="default" icon={Copy} disabled={busy} onClick={handleDuplicate}>
                            Duplicate agreement
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {writable && canEdit(a.status) && (
                        <Button onClick={() => navigate({ to: '/app/new', search: { edit: a.id } })}>
                          Edit agreement
                        </Button>
                      )}
                      {writable &&
                        actions.map((next) => (
                          <Button
                            key={next}
                            disabled={busy}
                            variant={['Sent', 'Completed'].includes(next) ? 'primary' : 'default'}
                            onClick={() => change(next)}
                          >
                            {next === 'Sent'
                              ? 'Send agreement'
                              : next === 'Draft'
                                ? 'Reopen as draft'
                                : `Mark ${next.toLowerCase()}`}
                          </Button>
                        ))}
                      {['Sent', 'Awaiting Signatures', 'Partially Signed'].includes(a.status) && (
                        <Link to="/sign/$token" params={{ token: a.token }} className={s.textLink}>
                          Open demo signing portal →
                        </Link>
                      )}
                      {!actions.length && <p className={s.muted}>This agreement is finalized.</p>}
                    </>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === 'Document' && (
          <>
            <div className={s.toolbar}>
              <Button icon={Printer} onClick={() => window.print()}>
                Print / Save PDF
              </Button>
            </div>
            <Document agreement={a} />
          </>
        )}

        {tab === 'Parties' && (
          <section className={s.panel}>
            {(a.parties || []).map((p, i) => (
              <div key={i} className={s.notification}>
                <Avatar name={p.name} />
                <div style={{ flex: 1 }}>
                  <h3>{p.name}</h3>
                  <p>
                    {p.email} ·{' '}
                    {p.signed ? 'Signed' : p.revoked ? 'Invitation revoked' : 'Signature pending'}
                  </p>
                </div>
                {writable && !p.signed && (
                  <>
                    <Button
                      icon={Send}
                      disabled={p.revoked}
                      onClick={() => editAgreement(id, {}, `Demo invitation resent to ${p.name}`)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        editAgreement(
                          id,
                          {
                            parties: a.parties.map((x, j) =>
                              j === i ? { ...x, revoked: !x.revoked } : x
                            ),
                          },
                          p.revoked ? 'Invitation restored' : 'Invitation revoked'
                        )
                      }
                    >
                      {p.revoked ? 'Restore' : 'Revoke'}
                    </Button>
                  </>
                )}
              </div>
            ))}
            {writable && (
              <div className={s.panelBody}>
                <Button icon={Plus} onClick={() => setInvite(true)}>
                  Invite party
                </Button>
              </div>
            )}
          </section>
        )}

        {tab === 'Activity & Audit' && (
          <>
            <div className={s.toolbar}>
              <Button
                icon={ShieldCheck}
                onClick={async () => {
                  if (isReal && a.auditVerification) {
                    setVerify(
                      a.auditVerification.isValid
                        ? `Cryptographic SHA-256 chain verified — ${a.auditVerification.eventCount} immutable events, sequence continuity confirmed.`
                        : `Chain verification failed: ${a.auditVerification.reason}`
                    );
                    return;
                  }
                  setVerify('Verifying SHA-256 chain…');
                  try {
                    setVerify(
                      (await verifyAudit(a.audit))
                        ? `Chain verified — ${a.audit.length} events, no tampering detected.`
                        : 'Chain verification failed: an event was modified.'
                    );
                  } catch {
                    setVerify('Verification needs a secure browser connection.');
                  }
                }}
              >
                Verify chain
              </Button>
              {verify && <span role="status">{verify}</span>}
            </div>

            {a.audit?.length ? (
              a.audit.map((event, i) => (
                <div className={s.auditRow} key={i}>
                  <h3>
                    {event.seq ? `#${event.seq} ` : ''}
                    {event.action}
                  </h3>
                  <p>
                    {event.actor} · {new Date(event.date).toLocaleString()}
                  </p>
                  <div className={s.hash}>SHA-256 {event.hash}</div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No audit events yet"
                text="Updates and signing actions create hash-chained events."
              />
            )}
          </>
        )}

        {tab === 'Versions' && (
          <>
            {isReal ? (
              <>
                <div className={s.toolbar}>
                  <Select
                    label="Base version"
                    value={ver1}
                    onChange={(e) => setVer1(e.target.value)}
                    options={realVersions.map((v) => ({
                      label: `v${v.versionNumber}.0 — ${v.changeSummary || 'Snapshot'} (${new Date(v.createdAt).toLocaleDateString()})`,
                      value: String(v.versionNumber),
                    }))}
                  />
                  <Select
                    label="Compare with version"
                    value={ver2}
                    onChange={(e) => setVer2(e.target.value)}
                    options={realVersions.map((v) => ({
                      label: `v${v.versionNumber}.0 — ${v.changeSummary || 'Snapshot'} (${new Date(v.createdAt).toLocaleDateString()})`,
                      value: String(v.versionNumber),
                    }))}
                  />
                </div>

                <div className={s.summaryGrid} style={{ padding: '10px 0' }}>
                  <div>
                    <h3>Version {ver1} snapshot</h3>
                    <p style={{ fontSize: 13 }}>
                      {v1Detail ? (
                        <>
                          Created by {v1Detail.creator?.profile?.displayName || v1Detail.creator?.email} on{' '}
                          {new Date(v1Detail.createdAt).toLocaleDateString()}
                          <br />
                          <small className={s.hash}>Hash: {v1Detail.contentHash?.slice(0, 16)}…</small>
                        </>
                      ) : (
                        'Select a version'
                      )}
                    </p>
                  </div>
                  <div>
                    <h3>Version {ver2} snapshot</h3>
                    <p style={{ fontSize: 13 }}>
                      {v2Detail ? (
                        <>
                          Created by {v2Detail.creator?.profile?.displayName || v2Detail.creator?.email} on{' '}
                          {new Date(v2Detail.createdAt).toLocaleDateString()}
                          <br />
                          <small className={s.hash}>Hash: {v2Detail.contentHash?.slice(0, 16)}…</small>
                        </>
                      ) : (
                        'Select a version'
                      )}
                    </p>
                  </div>
                  <div>
                    <h3>Diff status</h3>
                    <p style={{ fontSize: 13 }}>
                      {ver1 === ver2 ? 'Identical versions selected' : `${sectionDiff.length} clauses analyzed`}
                    </p>
                  </div>
                </div>

                <div className={s.stack} style={{ marginTop: 20 }}>
                  <h2>Side-by-Side Clause Comparison</h2>
                  {sectionDiff.length > 0 ? (
                    sectionDiff.map((d, i) => (
                      <div key={i} className={s.panel} style={{ marginBottom: 12 }}>
                        <div className={s.panelHead}>
                          <h3>
                            {d.sectionNumber} {d.title}
                          </h3>
                          <span
                            className={
                              d.type === 'ADDED'
                                ? s.success
                                : d.type === 'DELETED'
                                  ? s.error
                                  : d.type === 'MODIFIED'
                                    ? s.notice
                                    : s.muted
                            }
                            style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}
                          >
                            {d.type}
                          </span>
                        </div>
                        <div className={s.formGrid} style={{ padding: 16 }}>
                          <div>
                            <small className={s.muted}>Version {ver1}</small>
                            <p style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                              {d.v1Text || <i className={s.muted}>Clause did not exist in v{ver1}</i>}
                            </p>
                          </div>
                          <div>
                            <small className={s.muted}>Version {ver2}</small>
                            <p style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                              {d.v2Text || <i className={s.muted}>Clause was removed in v{ver2}</i>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No versions to compare"
                      text="Edit and save this agreement to create multiple version snapshots."
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={s.toolbar}>
                  <Select
                    label="First version"
                    value={ver1}
                    onChange={(e) => setVer1(e.target.value)}
                    options={(a.versions || []).map((v, i) => ({ label: v.name, value: String(i) }))}
                  />
                  <Select
                    label="Compare with"
                    value={ver2}
                    onChange={(e) => setVer2(e.target.value)}
                    options={(a.versions || []).map((v, i) => ({ label: v.name, value: String(i) }))}
                  />
                </div>
                <div className={s.formGrid}>
                  {[ver1, ver2].map((index, i) => (
                    <div key={i} className={s.document}>
                      <h2>{a.versions?.[Number(index)]?.name ?? 'No second version'}</h2>
                      <p>
                        {a.versions?.[Number(index)]?.text ??
                          'Edit and save this agreement to create another version.'}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'Files' && (
          <section className={s.panel}>
            <div className={s.panelBody}>
              {writable && (
                <Input label="Upload files (demo, up to 5 MB)" type="file" onChange={upload} />
              )}
              <div className={s.stack}>
                {a.files?.length ? (
                  a.files.map((f) => (
                    <div className={s.notification} key={f.id}>
                      <FileText />
                      <div style={{ flex: 1 }}>
                        <h3>{f.name}</h3>
                        <p>{Math.round(f.size / 1024)} KB</p>
                      </div>
                      <Button
                        icon={Download}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = f.content;
                          link.download = f.name;
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                      {writable && (
                        <IconButton
                          icon={Trash2}
                          label="Delete file"
                          onClick={() =>
                            editAgreement(
                              id,
                              { files: a.files.filter((x) => x.id !== f.id) },
                              'File deleted'
                            )
                          }
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No files attached"
                    text="Supporting files stay in this browser in demo mode."
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {tab === 'Reminders' && (
          <section className={s.panel}>
            <div className={`${s.panelBody} ${s.stack}`}>
              {writable && (
                <form
                  className={s.flex}
                  onSubmit={(e) => {
                    e.preventDefault();
                    editAgreement(
                      id,
                      { reminders: [...(a.reminders || []), { date: reminder, id: Date.now() }] },
                      'Demo reminder added'
                    );
                    setReminder('');
                  }}
                >
                  <Input
                    type="datetime-local"
                    label="Reminder date"
                    value={reminder}
                    required
                    onChange={(e) => setReminder(e.target.value)}
                  />
                  <Button type="submit" icon={Plus}>
                    Add reminder
                  </Button>
                </form>
              )}
              <p className={s.muted}>
                {isReal
                  ? 'Automated email reminders will be configurable in an upcoming release.'
                  : 'Demo reminders appear here; no email will be sent.'}
              </p>
              {(a.reminders || []).map((r) => (
                <div className={s.between} key={r.id}>
                  <span>
                    <Clock3 size={14} /> {new Date(r.date).toLocaleString()}
                  </span>
                  {writable && (
                    <IconButton
                      icon={Trash2}
                      label="Remove reminder"
                      onClick={() =>
                        editAgreement(
                          id,
                          { reminders: a.reminders.filter((x) => x.id !== r.id) },
                          'Reminder removed'
                        )
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal open={share} onClose={() => setShare(false)} title="Share agreement">
        <p className={s.muted}>
          {isReal
            ? 'Direct document view link for authorized workspace members.'
            : 'This demo link works in this browser, where the agreement is stored.'}
        </p>
        <Input
          readOnly
          aria-label="Signing link"
          value={isReal ? `${origin}/app/agreements/${a.id}` : `${origin}/sign/${a.token}`}
        />
        <Button
          variant="primary"
          icon={Copy}
          onClick={() =>
            navigator.clipboard
              .writeText(
                isReal
                  ? `${window.location.origin}/app/agreements/${a.id}`
                  : `${window.location.origin}/sign/${a.token}`
              )
              .then(() => toast('Link copied to clipboard'))
              .catch(() => toast('Clipboard unavailable; select and copy the link.'))
          }
        >
          Copy link
        </Button>
      </Modal>

      <Modal open={invite} onClose={() => setInvite(false)} title="Invite a party">
        <form
          className={s.stack}
          onSubmit={(e) => {
            e.preventDefault();
            if (isReal) {
              toast('Party invitation emails will be sent via live SMTP in Phase 6.');
              setInvite(false);
              return;
            }
            editAgreement(
              id,
              { parties: [...(a.parties || []), { name, email, signed: false }] },
              'Party invited (demo)'
            );
            setInvite(false);
            setName('');
            setEmail('');
          }}
        >
          <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className={s.muted}>
            {isReal
              ? 'Counterparty invitations require signing order configuration (Phase 6).'
              : 'Demo invitation only; no email is sent.'}
          </p>
          <Button type="submit" variant="primary" icon={Send}>
            Invite
          </Button>
        </form>
      </Modal>
    </main>
  );
}
