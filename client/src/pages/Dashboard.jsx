import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Files,
  CheckCircle2,
  Activity,
  PenLine,
  Clock3,
  Sparkles,
  Plus,
  Download,
  FileText,
} from 'lucide-react';
import { useWorkspace } from '../context/Workspace';
import { Button, Avatar, Modal, Skeleton, EmptyState } from '../components/demo/ui';
import { AgreementTable } from '../components/demo/AgreementTable';
import { ActivityChart, StatusDonut, CategoryBars } from '../components/demo/Charts';
import { AppLink, AgreementLink } from '../components/demo/Shell';
import { stats as mockStats, download as mockDownload } from '../services/mock';
import { isServiceReal } from '../services/serviceMode';
import { dashboardService } from '../services/dashboardService';
import { analyticsService } from '../services/analyticsService';
import { AI } from './AI';
import s from './pages.module.css';

export function Dashboard() {
  const { data, user, profile, toast } = useWorkspace();
  const navigate = useNavigate();
  const isReal = isServiceReal('dashboard');

  const [range, setRange] = useState('This month');
  const [ai, setAi] = useState(false);
  const [loading, setLoading] = useState(isReal);
  const [error, setError] = useState(null);

  // Real dashboard state
  const [realStats, setRealStats] = useState(null);
  const [realDeadlines, setRealDeadlines] = useState([]);
  const [realRecent, setRealRecent] = useState([]);
  const [realActivity, setRealActivity] = useState([]);

  const loadRealDashboard = useCallback(async () => {
    if (!isReal) return;
    setLoading(true);
    setError(null);
    try {
      const [statsData, deadlinesData, recentData, activityData] = await Promise.all([
        dashboardService.getStats(data.org),
        dashboardService.getDeadlines(30, data.org),
        dashboardService.getRecent(5, data.org),
        dashboardService.getActivity(1, 5, data.org),
      ]);
      setRealStats(statsData);
      setRealDeadlines(deadlinesData);
      setRealRecent(recentData);
      setRealActivity(activityData.data);
    } catch (err) {
      console.error('Failed to load real dashboard metrics:', err);
      setError(err.message || 'Unable to load live dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [isReal, data.org]);

  useEffect(() => {
    loadRealDashboard();
  }, [loadRealDashboard]);

  // Mock workspace data fallback
  const all = data.agreements?.filter((a) => a.org === data.org && !a.archived) || [];
  const rows = all.filter((a) => (range === 'Last 7 days' ? a.created >= '2026-11-20' : true));
  const fallbackMetric = mockStats(rows);

  const metric = isReal && realStats ? realStats : fallbackMetric;
  const totalAgreements = metric.total ?? 0;
  const completedCount = metric.completed ?? 0;
  const runningCount = metric.running ?? 0;
  const pendingCount = metric.pendingSignatures ?? metric.pending ?? 0;
  const expiredCount = metric.expired ?? 0;
  const completionRate = metric.completionRate ?? metric.rate ?? 0;

  const metrics = [
    [
      'Total agreements',
      totalAgreements,
      Files,
      isReal && realStats ? `${realStats.deltas.total > 0 ? '+' : ''}${realStats.deltas.total}% MoM` : `${data.categories?.length || 9} categories`,
    ],
    [
      'Completed',
      completedCount,
      CheckCircle2,
      `${completionRate}% completion rate`,
    ],
    [
      'In progress',
      runningCount,
      Activity,
      isReal && realStats ? `${realStats.deltas.running > 0 ? '+' : ''}${realStats.deltas.running}% MoM` : 'Active agreements',
    ],
    [
      'Pending signatures',
      pendingCount,
      PenLine,
      'Waiting on parties',
    ],
    [
      'Expired',
      expiredCount,
      Clock3,
      'Needs your attention',
    ],
  ];

  const name = (
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.name ||
    data.profile?.name ||
    'Alex'
  ).split(' ')[0];

  const handleExportReport = async () => {
    if (isReal) {
      try {
        const blob = await analyticsService.exportCsv({}, data.org);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agree2met-dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast?.('Report exported successfully.');
      } catch (e) {
        toast?.('Failed to export report.');
      }
    } else {
      mockDownload(
        'workspace-summary.csv',
        `Metric,Value\nTotal,${totalAgreements}\nCompleted,${completedCount}\nRunning,${runningCount}\nPending signatures,${pendingCount}\nExpired,${expiredCount}`,
        'text/csv'
      );
    }
  };

  const handleCreateAgreement = () => {
    if (isReal) {
      toast?.('Agreement creation will be available in an upcoming release (Phase 5).');
    } else {
      navigate({ to: '/app/new' });
    }
  };

  if (loading) {
    return (
      <main className={s.page}>
        <div className={s.heading}>
          <div>
            <h1>Good morning, {name} <span aria-hidden="true">☀</span></h1>
            <p>Loading real-time workspace metrics…</p>
          </div>
        </div>
        <Skeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className={s.page}>
        <div className={s.error} role="alert">
          {error}
        </div>
        <Button onClick={loadRealDashboard}>Retry</Button>
      </main>
    );
  }

  // Map real recent agreements to shape expected by AgreementTable
  const recentTableRows = isReal && realRecent.length > 0
    ? realRecent.map((a) => ({
        id: a.id,
        title: a.title,
        client: a.parties?.[0]?.companyName || a.parties?.[0]?.name || 'Counterparty',
        category: a.category?.name || 'Agreement',
        status: a.status === 'COMPLETED' ? 'Completed' : a.status === 'DRAFT' ? 'Draft' : a.status === 'AWAITING_SIGNATURES' ? 'Awaiting Signatures' : a.status === 'PARTIALLY_SIGNED' ? 'Partially Signed' : a.status === 'EXPIRED' ? 'Expired' : 'Sent',
        value: 25000,
        deadline: a.expirationDate ? String(a.expirationDate).split('T')[0] : '2026-12-31',
        created: String(a.createdAt).split('T')[0],
      }))
    : all.slice(0, 5);

  return (
    <main className={s.page}>
      <div className={s.heading}>
        <div>
          <h1>
            Good morning, {name} <span aria-hidden="true">☀</span>
          </h1>
          <p>
            {isReal
              ? `Connected to live workspace engine · ${totalAgreements} total records`
              : 'Here’s what’s happening with your agreements today.'}
          </p>
        </div>
        <div className={s.headingActions}>
          <Button
            icon={CalendarDays}
            onClick={() => setRange(range === 'This month' ? 'Last 7 days' : 'This month')}
          >
            {range}
            <ChevronDown size={12} />
          </Button>
          <Button icon={Download} onClick={handleExportReport}>
            Export report
          </Button>
        </div>
      </div>

      <div className={s.grid}>
        {metrics.map(([label, value, Icon, foot]) => (
          <section key={label} className={s.metric}>
            <div className={s.metricTop}>
              <span>{label}</span>
              <Icon />
            </div>
            <div className={s.metricNumber}>{value}</div>
            <div className={s.metricFoot}>
              {label === 'Completed' ? (
                <span>
                  <ArrowUpRight />
                  {foot}
                </span>
              ) : (
                foot
              )}
            </div>
          </section>
        ))}
      </div>

      <div className={s.chartGrid}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h2>Agreement activity</h2>
              <p>Your agreement momentum, at a glance</p>
            </div>
            <div className={s.legend}>
              <span>
                <i className={s.dot} />
                Created
              </span>
              <span>
                <i className={`${s.dot} ${s.dotSuccess}`} />
                Completed
              </span>
            </div>
          </div>
          <div className={s.panelBody}>
            <ActivityChart rows={rows} />
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h2>Agreement status</h2>
              <p>A snapshot of your workspace</p>
            </div>
            <AppLink page="analytics" className={s.textLink}>
              <ArrowUpRight size={16} />
            </AppLink>
          </div>
          <StatusDonut rows={rows} />
        </section>
      </div>

      <div className={s.sectionGrid}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h2>Recent agreements</h2>
              <p>Keep track of your latest work</p>
            </div>
            <AppLink page="agreements" className={s.textLink}>
              View all <ArrowRight size={13} />
            </AppLink>
          </div>
          <div style={{ height: 18 }} />
          {recentTableRows.length > 0 ? (
            <AgreementTable rows={recentTableRows} compact />
          ) : (
            <EmptyState
              title="No agreements found"
              text="Agreements created in this workspace will appear here."
            />
          )}
          <div className={s.tableFooter}>
            <span>
              Showing {recentTableRows.length} of {totalAgreements} agreements
            </span>
            <AppLink page="agreements" className={s.textLink}>
              All agreements <ArrowRight size={12} />
            </AppLink>
          </div>
        </section>

        <aside>
          <section className={s.panel}>
            <div className={s.panelHead}>
              <h2>Upcoming deadlines</h2>
              <CalendarDays size={15} className={s.muted} />
            </div>
            <div className={s.panelBody}>
              {isReal ? (
                realDeadlines.length > 0 ? (
                  realDeadlines.slice(0, 3).map((d) => (
                    <AgreementLink key={d.id} id={d.id} className={s.deadline}>
                      <div className={s.dateTile}>
                        <small>In</small>
                        <b>{d.daysRemaining}d</b>
                      </div>
                      <div>
                        <h3>{d.title}</h3>
                        <p>{d.categoryName}</p>
                        <span className={s.deadlineTag}>
                          {d.daysRemaining <= 7 ? 'Due soon' : 'Active'}
                        </span>
                      </div>
                    </AgreementLink>
                  ))
                ) : (
                  <p className={s.muted}>No upcoming deadlines in the next 30 days.</p>
                )
              ) : (
                all
                  .filter((a) =>
                    ['Awaiting Signatures', 'Partially Signed', 'Sent', 'Pending Review'].includes(
                      a.status
                    )
                  )
                  .sort((a, b) => a.deadline.localeCompare(b.deadline))
                  .slice(0, 3)
                  .map((a) => (
                    <AgreementLink key={a.id} id={a.id} className={s.deadline}>
                      <div className={s.dateTile}>
                        <small>Nov</small>
                        <b>{a.deadline.slice(-2)}</b>
                      </div>
                      <div>
                        <h3>{a.title}</h3>
                        <p>{a.client}</p>
                        <span className={s.deadlineTag}>
                          {a.status === 'Awaiting Signatures' ? 'Signature pending' : 'In progress'}
                        </span>
                      </div>
                    </AgreementLink>
                  ))
              )}
              <AppLink page="deadlines" className={s.textLink}>
                View calendar <ArrowRight size={12} />
              </AppLink>
            </div>
          </section>

          <section className={s.aiPromo}>
            <h3>
              <Sparkles size={17} />
              Your agreement copilot <span className={s.eyebrow}>AI</span>
            </h3>
            <p>
              Draft with confidence. Get clarity on clauses and a fresh perspective on your
              agreements.
            </p>
            <Button onClick={() => setAi(true)} icon={Sparkles}>
              Ask Agree2Met AI <ArrowUpRight size={12} />
            </Button>
          </section>
        </aside>
      </div>

      <div className={s.bottomGrid}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>Agreements by category</h2>
            <AppLink page="analytics" className={s.textLink}>
              <ArrowUpRight size={15} />
            </AppLink>
          </div>
          <div className={s.panelBody}>
            <CategoryBars rows={rows} />
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>Latest activity</h2>
            <AppLink page="notifications" className={s.textLink}>
              View all <ArrowRight size={12} />
            </AppLink>
          </div>
          <div className={s.panelBody}>
            {isReal ? (
              realActivity.length > 0 ? (
                realActivity.slice(0, 3).map((act) => (
                  <div key={act.id} className={s.feed}>
                    <Avatar name={act.actor?.name || 'System'} />
                    <div>
                      <p>{act.summary}</p>
                      <small>{new Date(act.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className={s.muted}>No activity recorded yet.</p>
              )
            ) : (
              data.notifications?.slice(0, 3).map((n, i) => (
                <div key={n.id} className={s.feed}>
                  <Avatar name={i === 1 ? 'Sarah Chen' : 'Alex Morgan'} />
                  <div>
                    <p>{n.title}</p>
                    <small>{n.text}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className={s.quickActions}>
        <Button icon={Plus} onClick={handleCreateAgreement}>
          Create agreement
        </Button>
        <Button
          icon={FileText}
          onClick={() => navigate({ to: '/app/$page', params: { page: 'templates' } })}
        >
          Browse templates
        </Button>
      </section>

      <Modal drawer open={ai} onClose={() => setAi(false)} title="Your agreement copilot">
        <AI compact />
      </Modal>
    </main>
  );
}
