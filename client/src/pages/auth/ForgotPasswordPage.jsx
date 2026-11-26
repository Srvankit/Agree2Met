import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Field } from '../../components/ui/Form/Field';
import styles from './Auth.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 600);
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoBox}>
            <Logo size="lg" />
          </div>
          <h1 className={styles.authTitle}>Reset your password</h1>
          <p className={styles.authSubtitle}>
            Enter your work email address to receive password reset instructions.
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              We have dispatched a reset link to <strong>{email}</strong>. Check your inbox to choose a new password.
            </p>
            <div className={styles.demoBox}>
              <div className={styles.demoBoxHeader}>Simulated Reset Link</div>
              <Link to="/reset-password?token=tok_demo_reset_123" style={{ color: 'var(--color-primary)', fontSize: '11px', textDecoration: 'underline' }}>
                Click here to simulate opening email reset link →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Field label="Work Email Address" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={KeyRound}
              isLoading={loading}
            >
              Send Password Reset Link
            </Button>
          </form>
        )}

        <div className={styles.authFooter}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
