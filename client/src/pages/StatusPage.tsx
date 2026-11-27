import { useState, useEffect, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { apiClient } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Mail,
  Database,
  HardDrive,
  Layers,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/demo/ui';
import s from './pages.module.css';

interface HealthData {
  status: string;
  uptimeSeconds?: number;
  version?: string;
  timestamp?: string;
  services?: Record<string, boolean>;
}

export function StatusPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getHealth();
      setHealthData(response.data);
    } catch (err: any) {
      setError(err);
      if (err.details && err.details[0]) {
        setHealthData(err.details[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleSendTestEmail = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await apiClient.sendTestEmail(
        'dev.verification@agree2met.local',
        'Phase 1 Queue Verification'
      );
      setEmailStatus({
        success: true,
        message: `Test email enqueued! Job ID: ${res.data?.jobId || 'dev-job'}. Check Mailpit at http://localhost:8025`,
      });
    } catch (err: any) {
      setEmailStatus({
        success: false,
        message: err.message || 'Failed to enqueue test email',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const isHealthy = healthData?.status === 'healthy';

  const getServiceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'database':
        return <Database size={20} />;
      case 'redis':
        return <Layers size={20} />;
      case 'storage':
        return <HardDrive size={20} />;
      case 'smtp':
        return <Mail size={20} />;
      default:
        return <Server size={20} />;
    }
  };

  return (
    <main className={s.page} style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/" className={s.textLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Return to Workspace
        </Link>
      </div>

      <div className={s.heading} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px 0' }}>System Status Diagnostics</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Agree2Met Phase 1 Infrastructure Verification</p>
        </div>
        <Button onClick={fetchHealth} disabled={loading} icon={RefreshCw}>
          {loading ? 'Checking…' : 'Refresh Status'}
        </Button>
      </div>

      {error && !healthData && (
        <div role="alert" className={s.error} style={{ padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <AlertTriangle size={18} /> Connection Error: {error.message}
          </div>
          <p style={{ marginTop: '6px', fontSize: '13px' }}>
            Ensure backend server is running on http://localhost:5000 (run <code>npm run dev:server</code>).
          </p>
        </div>
      )}

      {loading && !healthData && (
        <div className={s.panel} style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ color: 'var(--muted)' }}>Probing infrastructure dependencies (Database, Redis, S3, SMTP)…</p>
        </div>
      )}

      {healthData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overall Health Card */}
          <section className={s.panel} style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Overall System State</span>
                {healthData.uptimeSeconds !== undefined && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                    Uptime: {healthData.uptimeSeconds}s · Server version: {healthData.version || '1.0.0'}
                  </p>
                )}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '13px',
                  background: isHealthy ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: isHealthy ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {isHealthy ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {healthData.status}
              </span>
            </div>

            {/* Services Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              {Object.entries(healthData.services || {}).map(([service, status]) => (
                <div
                  key={service}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
                    {getServiceIcon(service)}
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{service}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: status ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {status ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {status ? '✓ Connected' : '✗ Disconnected'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Test Queue Section */}
          <section className={s.panel} style={{ padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0' }}>Background Queue & Email Test</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 16px 0' }}>
              Enqueue a verification email job through BullMQ and SMTP to confirm asynchronous processing.
            </p>

            <Button onClick={handleSendTestEmail} disabled={sendingEmail} icon={Mail} variant="primary">
              {sendingEmail ? 'Enqueuing Job…' : 'Send Test Verification Email'}
            </Button>

            {emailStatus && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: emailStatus.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: emailStatus.success ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {emailStatus.message}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
