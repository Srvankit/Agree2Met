import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Agree2Met</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Digital Agreement Management SaaS Platform — Phase 1 Foundation
        </p>
      </header>

      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Foundation Verification</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
          Phase 1 establishes the decoupled client/server infrastructure, PostgreSQL, Redis, S3-compatible storage, and BullMQ queues.
        </p>
        <Link
          to="/status"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-accent)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
          }}
        >
          View Live System Status &rarr;
        </Link>
      </div>
    </div>
  );
}
