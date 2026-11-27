import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { PasswordInput } from '../../components/ui/Input/PasswordInput';
import { Field } from '../../components/ui/Form/Field';
import { Checkbox } from '../../components/ui/Form/Checkbox';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './Auth.module.css';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('You must accept the Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({ name, email, password, orgName });
      addToast({
        title: 'Account Created',
        message: 'Please verify your email address to continue.',
        type: 'success',
      });
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoBox}>
            <Logo size="lg" />
          </div>
          <h1 className={styles.authTitle}>Create your account</h1>
          <p className={styles.authSubtitle}>
            Start executing digital agreements with cryptographic audit proof.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Full Legal Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              required
            />
          </Field>

          <Field label="Work Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acmeglobal.com"
              required
            />
          </Field>

          <Field label="Company / Organization Name" required>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Global Technologies"
              required
            />
          </Field>

          <Field label="Password" required>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create strong password"
              required
            />
          </Field>

          <Checkbox
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            label={
              <span>
                I agree to the <Link to="/legal/terms">Terms of Service</Link> and{' '}
                <Link to="/legal/privacy">Privacy Policy</Link>
              </span>
            }
          />

          {error && <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>{error}</div>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={UserPlus}
            isLoading={loading}
          >
            Create Free Workspace
          </Button>
        </form>

        <div className={styles.authFooter}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
