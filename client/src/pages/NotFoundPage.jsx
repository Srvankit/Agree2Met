import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '64px auto', textAlign: 'center', padding: '0 24px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '12px' }}>404</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        The requested page does not exist.
      </p>
      <Link
        to="/"
        style={{
          color: 'var(--color-accent)',
          fontWeight: 500,
        }}
      >
        &larr; Return to Home
      </Link>
    </div>
  );
}
