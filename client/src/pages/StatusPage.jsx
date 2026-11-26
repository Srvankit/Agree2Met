import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api.js';
import styles from './StatusPage.module.css';

export function StatusPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getHealth();
      setHealthData(response.data);
    } catch (err) {
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
      const res = await apiClient.sendTestEmail('dev.verification@agree2met.local', 'Phase 1 Queue Verification');
      setEmailStatus({
        success: true,
        message: `Test email enqueued! Job ID: ${res.data.jobId}. Check Mailpit at http://localhost:8025`,
      });
    } catch (err) {
      setEmailStatus({
        success: false,
        message: err.message || 'Failed to enqueue test email',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const isHealthy = healthData?.status === 'healthy';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Status Diagnostics</h1>
          <p className={styles.subtitle}>Agree2Met Phase 1 Infrastructure Verification</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className={`${styles.btn} ${styles.btnSecondary}`}
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </header>

      {error && !healthData && (
        <div className={`${styles.alert} ${styles.alertDanger}`}>
          <strong>Connection Error:</strong> {error.message}
          <p style={{ marginTop: '6px', fontSize: '0.85rem' }}>
            Ensure backend server is running on http://localhost:5000
          </p>
        </div>
      )}

      {loading && !healthData && (
        <div className={styles.card} style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Probing infrastructure dependencies (Database, Redis, S3, SMTP)...</p>
        </div>
      )}

      {healthData && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Overall System State</span>
            <span className={`${styles.badge} ${isHealthy ? styles.badgeSuccess : styles.badgeDanger}`}>
              {healthData.status}
            </span>
          </div>

          <div className={styles.grid}>
            {Object.entries(healthData.services || {}).map(([service, status]) => (
              <div key={service} className={styles.serviceCard}>
                <div className={styles.serviceName}>{service}</div>
                <div
                  className={`${styles.serviceStatus} ${
                    status ? styles.textSuccess : styles.textDanger
                  }`}
                >
                  {status ? '✓ Connected' : '✗ Offline'}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.metaRow}>
            <span>Uptime: {healthData.uptimeSeconds}s</span>
            <span>Version: {healthData.version}</span>
            <span>Checked: {new Date(healthData.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleSendTestEmail}
              disabled={sendingEmail || !healthData.services?.redis}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {sendingEmail ? 'Enqueuing Email...' : 'Send Test Email via Queue'}
            </button>
          </div>

          {emailStatus && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: emailStatus.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: emailStatus.success ? 'var(--color-success)' : 'var(--color-danger)',
                fontSize: '0.9rem',
              }}
            >
              {emailStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
