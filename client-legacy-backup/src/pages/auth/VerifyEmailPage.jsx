import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MailCheck, CheckCircle } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { useToast } from '../../context/ToastContext';
import styles from './Auth.module.css';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const email = location.state?.email || 'alex.rivera@agree2met.demo';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast({
        title: 'Email Verified',
        message: 'Your email address has been confirmed.',
        type: 'success',
      });
      navigate('/app/dashboard');
    }, 600);
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoBox}>
            <Logo size="lg" />
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <MailCheck size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className={styles.authTitle}>Verify your email</h1>
          <p className={styles.authSubtitle}>
            We sent a 6-digit confirmation code to <strong>{email}</strong>
          </p>
        </div>

        <div className={styles.codeInputs}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              id={`digit-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              className={styles.codeBox}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={CheckCircle}
          isLoading={loading}
          onClick={handleVerify}
        >
          Verify & Enter Workspace
        </Button>

        <div className={styles.authFooter}>
          Didn&apos;t receive a code?{' '}
          <button
            type="button"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => addToast({ title: 'Code Resent', message: 'A new 6-digit code was dispatched.', type: 'info' })}
          >
            Resend Code
          </button>{' '}
          • <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
