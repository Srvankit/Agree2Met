import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { PasswordInput } from '../../components/ui/Input/PasswordInput';
import { Field } from '../../components/ui/Form/Field';
import { Checkbox } from '../../components/ui/Form/Checkbox';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './Auth.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('alex.rivera@agree2met.demo');
  const [password, setPassword] = useState('Agree2Met@2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      addToast({ title: 'Welcome back, Alex Rivera!', type: 'success' });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('alex.rivera@agree2met.demo');
    setPassword('Agree2Met@2026!');
    setError('');
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoBox}>
            <Logo size="lg" />
          </div>
          <h1 className={styles.authTitle}>Sign in to Agree2Met</h1>
          <p className={styles.authSubtitle}>
            Enter your credentials or use the demo account below.
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className={styles.demoBox}>
          <div className={styles.demoBoxHeader}>
            <span>Demo Credentials Ready</span>
            <button type="button" className={styles.demoFillBtn} onClick={fillDemo}>
              Autofill
            </button>
          </div>
          <div className={styles.demoDetails}>
            alex.rivera@agree2met.demo / Agree2Met@2026!
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Work Email" required error={error ? ' ' : undefined}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </Field>

          <Field label="Password" required error={error}>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </Field>

          <div className={styles.formOptions}>
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label="Remember me"
            />
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={LogIn}
            isLoading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className={styles.authFooter}>
          Don&apos;t have an account? <Link to="/register">Create one free</Link>
        </div>
      </div>
    </div>
  );
}
