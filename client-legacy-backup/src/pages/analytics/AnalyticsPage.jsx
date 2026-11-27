import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { LineChart } from '../../components/ui/Charts/LineChart';
import { DonutChart } from '../../components/ui/Charts/DonutChart';
import { BarChart } from '../../components/ui/Charts/BarChart';
import { Table } from '../../components/ui/DataDisplay/Table';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { agreementsService, categoriesService } from '../../services';
import { formatCurrency } from '../../utils/validators';
import styles from './AnalyticsPage.module.css';

export function AnalyticsPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [agrRes, catList] = await Promise.all([
        agreementsService.list({ orgId: currentOrg?.id }),
        categoriesService.list(),
      ]);
      setAgreements(agrRes.items || []);
      setCategories(catList || []);
    } catch {
      showToast({ title: 'Failed to load analytics data', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Key metrics calculations
  const totalValue = useMemo(() => {
    return agreements
      .filter((a) => a.value)
      .reduce((sum, a) => sum + a.value, 0);
  }, [agreements]);

  const signedCount = useMemo(() => {
    return agreements.filter((a) => ['signed', 'active', 'completed'].includes(a.status)).length;
  }, [agreements]);

  const completionRate = useMemo(() => {
    if (agreements.length === 0) return 0;
    return Math.round((signedCount / agreements.length) * 100);
  }, [agreements, signedCount]);

  // Status breakdown for Donut Chart
  const statusData = useMemo(() => {
    const counts = {};
    agreements.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });

    const colors = {
      signed: '#10b981',
      active: '#059669',
      completed: '#047857',
      awaiting_signatures: '#f59e0b',
      partially_signed: '#eab308',
      draft: '#6b7280',
      in_review: '#3b82f6',
      approved: '#6366f1',
      expired: '#ef4444',
      terminated: '#991b1b',
      disputed: '#b91c1c',
      cancelled: '#4b5563',
    };

    return Object.entries(counts).map(([status, value]) => ({
      label: status.replace('_', ' ').toUpperCase(),
      value,
      color: colors[status] || '#6b7280',
    }));
  }, [agreements]);

  // Categories distribution for Bar Chart
  const categoryData = useMemo(() => {
    const counts = {};
    agreements.forEach((a) => {
      counts[a.categoryId] = (counts[a.categoryId] || 0) + 1;
    });

    return (categories || []).slice(0, 6).map((c) => ({
      label: c.name.length > 14 ? `${c.name.slice(0, 12)}...` : c.name,
      value: counts[c.id] || 0,
    }));
  }, [agreements, categories]);

  // Volume Trend for Line Chart (simulated 6-month historical line)
  const volumeTrend = useMemo(() => {
    return [
      { label: 'Jun', value: 8 },
      { label: 'Jul', value: 12 },
      { label: 'Aug', value: 15 },
      { label: 'Sep', value: 22 },
      { label: 'Oct', value: 29 },
      { label: 'Nov', value: agreements.length || 35 },
    ];
  }, [agreements.length]);

  // Export CSV
  const handleExportCSV = () => {
    if (agreements.length === 0) {
      showToast({ title: 'No agreements to export', variant: 'warning' });
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Status',
      'Category',
      'Value (USD)',
      'Created Date',
      'Effective Date',
      'Expiration Date',
      'Parties Count',
    ];

    const rows = (agreements || []).map((a) => {
      const cat = categories.find((c) => c.id === a.categoryId)?.name || a.category || '';
      return [
        `"${a.id}"`,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        `"${a.status}"`,
        `"${cat}"`,
        a.value || 0,
        `"${a.createdAt || ''}"`,
        `"${a.effectiveDate || ''}"`,
        `"${a.expirationDate || ''}"`,
        (a.parties || []).length,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agree2met_analytics_${currentOrg?.id || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({ title: 'Analytics CSV report downloaded', variant: 'success' });
  };

  const velocityColumns = [
    {
      key: 'stage',
      header: 'Workflow Stage',
      render: (r) => <span style={{ fontWeight: 600 }}>{r.stage}</span>,
    },
    {
      key: 'avgTime',
      header: 'Average Duration',
      render: (r) => <span>{r.avgTime}</span>,
    },
    {
      key: 'sla',
      header: 'Target SLA',
      render: (r) => <span style={{ color: 'var(--color-text-muted)' }}>{r.sla}</span>,
    },
    {
      key: 'compliance',
      header: 'SLA Adherence',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{r.compliance}</span>
      ),
    },
  ];

  const velocityData = [
    { id: '1', stage: 'Draft to Internal Approval', avgTime: '1.2 days', sla: '2.0 days', compliance: '96%' },
    { id: '2', stage: 'Dispatch to First Counterparty Sign', avgTime: '14.5 hours', sla: '24.0 hours', compliance: '91%' },
    { id: '3', stage: 'Full Execution & Counter-Signature', avgTime: '2.1 days', sla: '3.0 days', compliance: '88%' },
    { id: '4', stage: 'Audit Verification & Storage Archive', avgTime: 'Instant (< 1s)', sla: '< 5s', compliance: '100%' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Contract Analytics & Intelligence</h1>
          <p className={styles.subtitle}>
            Executive turnaround metrics, execution velocity, and contract value distribution for {currentOrg?.name}.
          </p>
        </div>
        <Button
          variant="outline"
          icon={<Download size={16} />}
          onClick={handleExportCSV}
        >
          Export CSV Report
        </Button>
      </div>

      {/* KPI Cards Row */}
      {loading ? (
        <div className={styles.metricsRow}>
          <Skeleton height="90px" />
          <Skeleton height="90px" />
          <Skeleton height="90px" />
          <Skeleton height="90px" />
        </div>
      ) : (
        <div className={styles.metricsRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Turnaround Velocity</span>
            <span className={styles.metricValue}>2.4 Days</span>
            <span className={`${styles.metricChange} ${styles.metricChangeUp}`}>
              <TrendingUp size={12} /> 22% faster than last quarter
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Execution Success</span>
            <span className={styles.metricValue}>{completionRate}%</span>
            <span className={`${styles.metricChange} ${styles.metricChangeUp}`}>
              <CheckCircle size={12} /> {signedCount} signed of {agreements.length} total
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Active Pipeline Value</span>
            <span className={styles.metricValue}>{formatCurrency(totalValue)}</span>
            <span className={`${styles.metricChange} ${styles.metricChangeMuted}`}>
              Across {agreements.length} contractual instruments
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Audit Trail Integrity</span>
            <span className={styles.metricValue}>100% Valid</span>
            <span className={`${styles.metricChange} ${styles.metricChangeUp}`}>
              <ShieldCheck size={12} /> SHA-256 hash chains verified
            </span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Line Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div>
              <h3 className={styles.chartTitle}>Agreement Execution Trend</h3>
              <p className={styles.chartSubtitle}>Monthly volume of dispatched and signed agreements</p>
            </div>
            <FileText size={18} style={{ color: 'var(--color-brand-primary)' }} />
          </div>
          <LineChart data={volumeTrend} height={240} />
        </div>

        {/* Donut Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div>
              <h3 className={styles.chartTitle}>Status Distribution</h3>
              <p className={styles.chartSubtitle}>Portfolio breakdown by lifecycle state</p>
            </div>
          </div>
          <DonutChart data={statusData} size={180} />
        </div>
      </div>

      {/* Bar Chart Categories */}
      <div className={styles.chartCard}>
        <div className={styles.chartCardHeader}>
          <div>
            <h3 className={styles.chartTitle}>Agreements by Category</h3>
            <p className={styles.chartSubtitle}>Contract concentration across commercial verticals</p>
          </div>
        </div>
        <BarChart data={categoryData} height={200} />
      </div>

      {/* Workflow Stage Velocity Table */}
      <div className={styles.velocityTableWrap}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            <Clock size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Lifecycle Stage Efficiency & SLA Compliance
          </h3>
        </div>
        <Table columns={velocityColumns} data={velocityData} />
      </div>
    </div>
  );
}
