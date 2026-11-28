import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Plus,
  Trash2,
  PenLine,
  FileText,
  Download,
  Check,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  Mail,
  Info,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useWorkspace } from '../context/Workspace';
import {
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  EmptyState,
  Tabs,
  IconButton,
  Avatar,
  Badge,
} from '../components/demo/ui';
import { AgreementLink } from '../components/demo/Shell';
import { ActivityChart, CategoryBars, StatusDonut } from '../components/demo/Charts';
import { stats, download, documentText, dateLabel } from '../services/mock';
import { canManage } from '../domain/lifecycle';
import { organizationsService } from '../services/organizationsService';
import { analyticsService } from '../services/analyticsService';
import { dashboardService } from '../services/dashboardService';
import { isServiceReal } from '../services/serviceMode';
import s from './pages.module.css';

export function Supporting({ page }) {
  const { data, update, toast, user } = useWorkspace();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('All');
  const [range, setRange] = useState('This month');
  const [view, setView] = useState('Calendar');
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);

  // Real service modes
  const isOrgReal = isServiceReal('organizations');
  const isAnalyticsReal = isServiceReal('analytics');
  const isDashboardReal = isServiceReal('dashboard');

  const [realMembers, setRealMembers] = useState([]);
  const [realInvitations, setRealInvitations] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [realAnalytics, setRealAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [realDeadlines, setRealDeadlines] = useState([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const rows = data.agreements.filter((a) => a.org === data.org && !a.archived);

  // RBAC permission check
  const currentUserRole = (user?.role || data.demoRole || 'Member').toUpperCase();
  const admin = isOrgReal
    ? ['OWNER', 'ADMIN'].includes(currentUserRole)
    : canManage(data.demoRole);

  const titles = {
    documents: 'Documents',
    templates: 'Templates',
    deadlines: 'Deadlines',
    notifications: 'Notifications',
    analytics: 'Analytics',
    team: 'Team',
  };

  const loadTeamData = async () => {
    if (!isOrgReal) return;
    setLoadingTeam(true);
    try {
      const res = await organizationsService.getMembers(data.org || undefined);
      setRealMembers(res.members || []);
      setRealInvitations(res.invitations || []);
    } catch (e) {
      console.warn('Failed to load team members:', e);
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadAnalyticsData = async () => {
    if (!isAnalyticsReal) return;
    setLoadingAnalytics(true);
    try {
      const res = await analyticsService.getOverview({ granularity: 'month' }, data.org);
      setRealAnalytics(res);
    } catch (e) {
      console.warn('Failed to load analytics overview:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadDeadlinesData = async () => {
    if (!isDashboardReal) return;
    setLoadingDeadlines(true);
    try {
      const res = await dashboardService.getDeadlines(60, data.org);
      setRealDeadlines(res);
    } catch (e) {
      console.warn('Failed to load deadlines:', e);
    } finally {
      setLoadingDeadlines(false);
    }
  };

  useEffect(() => {
    if (page === 'team' && isOrgReal) {
      loadTeamData();
    } else if (page === 'analytics' && isAnalyticsReal) {
      loadAnalyticsData();
    } else if (page === 'deadlines' && isDashboardReal) {
      loadDeadlinesData();
    }
  }, [page, isOrgReal, isAnalyticsReal, isDashboardReal, data.org]);

  async function exportCSV() {
    if (isAnalyticsReal) {
      try {
        const blob = await analyticsService.exportCsv({}, data.org);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agree2met-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast('Analytics exported successfully.');
      } catch {
        toast('Failed to export analytics CSV.');
      }
    } else {
      download(
        'agree2met-analytics.csv',
        `Metric,Value\n${Object.entries(stats(rows))
          .map(([key, value]) => `${key},${value}`)
          .join('\n')}`,
        'text/csv'
      );
    }
  }

  async function save(e) {
    e.preventDefault();
    if (page === 'templates') {
      if (
        data.categories.some(
          (c) => c.toLowerCase() === name.trim().toLowerCase() && c !== editing
        )
      ) {
        toast('A category with that name already exists');
        return;
      }
      update((d) => ({
        ...d,
        categories: editing
          ? d.categories.map((c) => (c === editing ? name.trim() : c))
          : [...d.categories, name.trim()],
      }));
      toast(editing ? 'Category updated' : 'Category created');
    } else {
      // Team invitation
      if (isOrgReal) {
        try {
          await organizationsService.inviteMember(
            data.org || 'default',
            email.trim(),
            role.toUpperCase()
          );
          toast(`Invitation sent to ${email.trim()}`);
          await loadTeamData();
        } catch (err) {
          toast(err?.message || 'Failed to send invitation');
        }
      } else {
        update((d) => ({
          ...d,
          team: [
            ...d.team,
            { id: Date.now(), name: name.trim(), email, role, status: 'Invited' },
          ],
        }));
        toast('Team invitation created (demo)');
      }
    }
    setOpen(false);
    setName('');
    setEmail('');
    setEditing(null);
  }

  async function handleRoleChange(memberId, newRole) {
    if (isOrgReal) {
      try {
        await organizationsService.updateMemberRole(
          data.org || 'default',
          memberId,
          newRole.toUpperCase()
        );
        toast('Member role updated');
        await loadTeamData();
      } catch (err) {
        toast(err?.message || 'Failed to update member role');
      }
    } else {
      update((d) => ({
        ...d,
        team: d.team.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      }));
      toast('Demo role updated');
    }
  }

  async function handleRemoveMember(memberId, memberName) {
    if (!confirm(`Remove ${memberName} from the team?`)) return;

    if (isOrgReal) {
      try {
        await organizationsService.removeMember(data.org || 'default', memberId);
        toast('Member removed');
        await loadTeamData();
      } catch (err) {
        toast(err?.message || 'Failed to remove member');
      }
    } else {
      update((d) => ({
        ...d,
        team: d.team.filter((m) => m.id !== memberId),
      }));
      toast('Member removed');
    }
  }

  function moveMonth(direction) {
    const date = new Date(year, month + direction, 1);
    setMonth(date.getMonth());
    setYear(date.getFullYear());
  }

  return (
    <main className={s.page}>
      <div className={s.heading}>
        <div>
          <h1>{titles[page]}</h1>
          <p>
            {
              {
                documents: 'Your agreement documents, all in one place.',
                templates: 'A strong starting point for every agreement.',
                deadlines: 'Stay one step ahead of what’s next.',
                notifications: 'Updates that keep everyone on the same page.',
                analytics: 'The bigger picture behind your agreements.',
                team: 'Good agreements start with great people.',
              }[page]
            }
          </p>
        </div>
        <div className={s.headingActions}>
          {page === 'analytics' && (
            <>
              <Select
                aria-label="Analytics range"
                options={['This month', 'Last 7 days']}
                value={range}
                onChange={(e) => setRange(e.target.value)}
              />
              <Button icon={Download} onClick={exportCSV}>
                Export CSV
              </Button>
            </>
          )}
          {['templates', 'team'].includes(page) && admin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setName('');
                setOpen(true);
              }}
            >
              {page === 'team' ? 'Invite member' : 'New category'}
            </Button>
          )}
          {page === 'notifications' && (
            <Button
              icon={Check}
              onClick={() => {
                update((d) => ({
                  ...d,
                  notifications: d.notifications.map((n) => ({ ...n, read: true })),
                }));
                toast('All notifications marked read');
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {page === 'documents' && (
        <>
          <div className={s.toolbar}>
            <div className={s.search}>
              <Search />
              <Input
                placeholder="Search documents…"
                aria-label="Search documents"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={s.listCards}>
            {rows
              .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
              .map((a) => (
                <article className={s.agreementCard} key={a.id}>
                  <FileText className={s.muted} />
                  <AgreementLink id={a.id}>
                    <h3>{a.title}</h3>
                  </AgreementLink>
                  <p>
                    {a.id} · {a.category}
                  </p>
                  <Badge status={a.status} />
                  <Button icon={Download} onClick={() => download(`${a.id}.txt`, documentText(a))}>
                    Download document
                  </Button>
                </article>
              ))}
          </div>
          {!rows.some((a) => a.title.toLowerCase().includes(search.toLowerCase())) && (
            <EmptyState title="No documents found" />
          )}
        </>
      )}

      {page === 'templates' && (
        <>
          <div className={s.listCards}>
            {data.categories.map((category, i) => (
              <article className={s.agreementCard} key={category}>
                <div className={s.between}>
                  <FileText className={s.muted} />
                  <span className={s.eyebrow}>Template {String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3>{category}</h3>
                <p>Scope, payment terms, confidentiality and termination.</p>
                <div className={s.between}>
                  <Button
                    onClick={() => {
                      localStorage.setItem(
                        'agree2met-wizard',
                        JSON.stringify({
                          title: '',
                          category,
                          description: '',
                          deadline: '2026-12-15',
                          parties: [
                            { name: data.profile.name, email: data.profile.email, signed: false },
                            { name: '', email: '', signed: false },
                          ],
                          clauses: [
                            {
                              title: `${category} scope`,
                              text: `The parties agree to the deliverables, duties and scope described in this ${category.toLowerCase()}.`,
                            },
                            {
                              title: 'Confidentiality',
                              text: 'Both parties will protect confidential information and use it only for the purposes of this agreement.',
                            },
                          ],
                          milestones: [{ title: 'Completion', amount: 0 }],
                          value: 0,
                          status: 'Draft',
                          audit: [],
                          versions: [],
                          files: [],
                          reminders: [],
                          archived: false,
                        })
                      );
                      navigate({ to: '/app/new' });
                    }}
                  >
                    Use template
                  </Button>
                  {admin && (
                    <div className={s.flex}>
                      <IconButton
                        icon={PenLine}
                        label={`Edit ${category}`}
                        onClick={() => {
                          setEditing(category);
                          setName(category);
                          setOpen(true);
                        }}
                      />
                      <IconButton
                        icon={Trash2}
                        label={`Delete ${category}`}
                        onClick={() => {
                          if (confirm(`Delete the ${category} category? Existing agreements will not change.`)) {
                            update((d) => ({
                              ...d,
                              categories: d.categories.filter((c) => c !== category),
                            }));
                            toast('Category deleted');
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!data.categories.length && (
            <EmptyState
              title="No categories yet"
              text="Create your first category to organize reusable agreements."
            />
          )}
        </>
      )}

      {page === 'deadlines' && (
        <>
          <div className={s.toolbar}>
            <Button
              icon={view === 'Calendar' ? List : CalendarDays}
              onClick={() => setView(view === 'Calendar' ? 'List' : 'Calendar')}
            >
              {view === 'Calendar' ? 'List view' : 'Calendar view'}
            </Button>
            <div className={s.flex}>
              <IconButton icon={ChevronLeft} label="Previous month" onClick={() => moveMonth(-1)} />
              <b>
                {new Date(year, month).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </b>
              <IconButton icon={ChevronRight} label="Next month" onClick={() => moveMonth(1)} />
            </div>
          </div>
          {view === 'Calendar' ? (
            <div className={s.calendar}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div className={s.calendarHeader} key={day}>
                  {day}
                </div>
              ))}
              {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
                <div key={`blank${i}`} className={s.calendarCell} />
              ))}
              {Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
                const day = i + 1;
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return (
                  <div key={day} className={s.calendarCell}>
                    {day}
                    {rows
                      .filter((a) => a.deadline === key)
                      .map((a) => (
                        <AgreementLink key={a.id} id={a.id} title={a.title}>
                          {a.title}
                        </AgreementLink>
                      ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <section className={s.panel}>
              {[...rows]
                .sort((a, b) => a.deadline.localeCompare(b.deadline))
                .map((a) => (
                  <div key={a.id} className={s.notification}>
                    <CalendarDays size={20} />
                    <div style={{ flex: 1 }}>
                      <AgreementLink id={a.id}>
                        <h3>{a.title}</h3>
                      </AgreementLink>
                      <p>
                        {dateLabel(a.deadline)} · {a.client}
                      </p>
                    </div>
                    <Badge status={a.status} />
                    <AgreementLink id={a.id} className={s.textLink}>
                      Set reminder →
                    </AgreementLink>
                  </div>
                ))}
            </section>
          )}
        </>
      )}

      {page === 'notifications' && (
        <>
          <Tabs items={['All', 'Unread']} value={tab} onChange={setTab} />
          <section className={s.panel}>
            {data.notifications
              .filter((n) => tab === 'All' || !n.read)
              .map((n) => (
                <div
                  key={n.id}
                  className={`${s.notification} ${!n.read ? s.notificationUnread : ''}`}
                >
                  <div style={{ flex: 1 }}>
                    {n.agreement ? (
                      <AgreementLink id={n.agreement}>
                        <h3>{n.title}</h3>
                      </AgreementLink>
                    ) : (
                      <h3>{n.title}</h3>
                    )}
                    <p>{n.text}</p>
                  </div>
                  <Button
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        notifications: d.notifications.map((x) =>
                          x.id === n.id ? { ...x, read: !x.read } : x
                        ),
                      }))
                    }
                  >
                    {n.read ? 'Mark unread' : 'Mark read'}
                  </Button>
                </div>
              ))}
            {!data.notifications.some((n) => tab === 'All' || !n.read) && (
              <EmptyState title="You’re all caught up" text="No unread notifications." />
            )}
          </section>
        </>
      )}

      {page === 'analytics' &&
        (() => {
          const filtered = rows.filter(
            (a) => range === 'This month' || a.created >= '2026-11-20'
          );
          const metric = stats(filtered);
          return (
            <>
              <div className={s.grid}>
                {[
                  ['Total agreements', isAnalyticsReal && realAnalytics ? realAnalytics.summary.totalCreated : metric.total, 'Total agreements created in this workspace within the selected range.'],
                  ['Completion rate', isAnalyticsReal && realAnalytics ? `${realAnalytics.summary.completionRate}%` : `${metric.rate}%`, 'Percentage of resolved agreements signed: completed / (completed + rejected + cancelled + expired).'],
                  ['Completed', isAnalyticsReal && realAnalytics ? realAnalytics.summary.totalCompleted : metric.completed, 'Total agreements fully signed and legally executed.'],
                  ['Avg turnaround', isAnalyticsReal && realAnalytics ? `${realAnalytics.turnaroundMetrics.avgTurnaroundHours}h` : '32.5h', 'Average time from agreement creation to completion in hours.'],
                  ['Total value', isAnalyticsReal && realAnalytics ? `$${Number(realAnalytics.summary.totalValue).toLocaleString()}` : `$${(metric.total * 15000).toLocaleString()}`, 'Total monetary contract value across payment milestones.'],
                ].map(([label, value, definition]) => (
                  <section className={s.metric} key={label}>
                    <div className={s.metricTop}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{label}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Definition of ${label}`}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: 'var(--muted-foreground, #64748b)',
                                }}
                              >
                                <Info size={13} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" style={{ maxWidth: '240px', fontSize: '11px', lineHeight: '1.4' }}>
                              <p>{definition}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className={s.metricNumber}>{value}</div>
                  </section>
                ))}
              </div>
              <div className={s.chartGrid}>
                <section className={s.panel}>
                  <div className={s.panelHead}>
                    <h2>Agreement trends</h2>
                  </div>
                  <div className={s.panelBody}>
                    <ActivityChart rows={filtered} />
                  </div>
                </section>
                <section className={s.panel}>
                  <div className={s.panelHead}>
                    <h2>Status breakdown</h2>
                  </div>
                  <StatusDonut rows={filtered} />
                </section>
              </div>
              <section className={s.panel}>
                <div className={s.panelHead}>
                  <h2>Category performance</h2>
                </div>
                <div className={s.panelBody}>
                  <CategoryBars rows={filtered} />
                </div>
              </section>
            </>
          );
        })()}

      {page === 'team' && (
        <>
          <div className={s.notice}>
            {isOrgReal
              ? `Signed in as ${user?.name || user?.email || 'User'} (${currentUserRole}). Real organization access controls apply.`
              : 'Demo team permissions apply only to simulated workspace actions. Real account profiles remain private.'}
          </div>

          {!isOrgReal && (
            <div className={s.toolbar}>
              <Select
                label="Preview demo role"
                options={['Owner', 'Admin', 'Member', 'Viewer']}
                value={data.demoRole}
                onChange={(e) => update((d) => ({ ...d, demoRole: e.target.value }))}
              />
            </div>
          )}

          <section className={s.panel}>
            {isOrgReal ? (
              <>
                {realMembers.map((member) => {
                  const mName =
                    member.user?.profile?.displayName ||
                    `${member.user?.profile?.firstName || ''} ${member.user?.profile?.lastName || ''}`.trim() ||
                    member.user?.email ||
                    'Team Member';
                  const mEmail = member.user?.email || '';
                  const mRole = member.role;
                  const isOwner = mRole === 'OWNER';

                  return (
                    <div key={member.id} className={s.notification}>
                      <Avatar name={mName} />
                      <div style={{ flex: 1 }}>
                        <h3>{mName}</h3>
                        <p>{mEmail} · Active</p>
                      </div>
                      {admin && !isOwner ? (
                        <Select
                          aria-label={`Role for ${mName}`}
                          options={['ADMIN', 'MEMBER', 'VIEWER']}
                          value={mRole}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        />
                      ) : (
                        <b>{mRole}</b>
                      )}
                      {admin && !isOwner && (
                        <IconButton
                          icon={Trash2}
                          label={`Remove ${mName}`}
                          onClick={() => handleRemoveMember(member.id, mName)}
                        />
                      )}
                    </div>
                  );
                })}

                {realInvitations.map((inv) => (
                  <div key={inv.id} className={s.notification}>
                    <Avatar name={inv.email} />
                    <div style={{ flex: 1 }}>
                      <h3>{inv.email}</h3>
                      <p>Invited as {inv.role} · Pending</p>
                    </div>
                    <b>{inv.role}</b>
                  </div>
                ))}
              </>
            ) : (
              data.team.map((member) => (
                <div key={member.id} className={s.notification}>
                  <Avatar name={member.name} />
                  <div style={{ flex: 1 }}>
                    <h3>{member.name}</h3>
                    <p>
                      {member.email} · {member.status}
                    </p>
                  </div>
                  {admin && member.role !== 'Owner' ? (
                    <Select
                      aria-label={`Role for ${member.name}`}
                      options={['Admin', 'Member', 'Viewer']}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    />
                  ) : (
                    <b>{member.role}</b>
                  )}
                  {admin && member.role !== 'Owner' && (
                    <IconButton
                      icon={Trash2}
                      label={`Remove ${member.name}`}
                      onClick={() => handleRemoveMember(member.id, member.name)}
                    />
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          page === 'templates'
            ? editing
              ? 'Edit category'
              : 'New category'
            : 'Invite team member'
        }
      >
        <form className={s.stack} onSubmit={save}>
          <Input
            label={page === 'templates' ? 'Category name' : 'Full name'}
            value={name}
            required={page === 'templates' || !isOrgReal}
            onChange={(e) => setName(e.target.value)}
          />
          {page === 'team' && (
            <>
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select
                label="Role"
                options={isOrgReal ? ['ADMIN', 'MEMBER', 'VIEWER'] : ['Admin', 'Member', 'Viewer']}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <p className={s.muted}>
                {isOrgReal
                  ? 'An email invitation link will be sent to this address.'
                  : 'This is a demo invitation; no email is sent.'}
              </p>
            </>
          )}
          <Button type="submit" variant="primary">
            {editing
              ? 'Save changes'
              : page === 'templates'
                ? 'Create category'
                : 'Invite member'}
          </Button>
        </form>
      </Modal>
    </main>
  );
}
