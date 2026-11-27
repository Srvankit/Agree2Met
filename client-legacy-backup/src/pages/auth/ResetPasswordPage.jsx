import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { PasswordInput } from '../../components/ui/Input/PasswordInput';
import { Field } from '../../components/ui/Form/Field';
import { useToast } from '../../context/ToastContext';
import styles from './Auth.module.css';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast({
        title: 'Password Reset Successful',
        message: 'You can now sign in with your new password.',
        type: 'success',
      });
      navigate('/login');
    }, 600);
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoBox}>
            <Logo size="lg" />
          </div>
          <h1 className={styles.authTitle}>Set new password</h1>
          <p className={styles.authSubtitle}>
            Choose a secure password complying with organization security policy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="New Password" required error={error ? ' ' : undefined}>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </Field>

          <Field label="Confirm New Password" required error={error}>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={Lock}
            isLoading={loading}
          >
            Update Password
          </Button>
        </form>

        <div className={styles.authFooter}>
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
