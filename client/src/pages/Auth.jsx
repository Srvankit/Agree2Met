import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Mail, Eye, EyeOff } from 'lucide-react';
import { useWorkspace } from '../context/Workspace';
import { authService } from '../services/authService';
import { Button, Input, IconButton } from '../components/demo/ui';
import { Logo } from '../components/demo/Shell';
import s from './pages.module.css';

export function passwordStrength(password) {
  if (!password) return 0;
  return [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
}

export function Auth({ mode = 'login' }) {
  const { user, toast, login } = useWorkspace();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [recovery, setRecovery] = useState(false);

  const register = mode === 'register';
  const reset = mode === 'reset-password';
  const forgot = mode === 'forgot-password';
  const verify = mode === 'verify-email';

  useEffect(() => {
    setError('');
    setMessage('');
  }, [mode]);

  useEffect(() => {
    if (!reset) return;
    const hash = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.slice(1)) : null;
    setRecovery(
      hash?.get('type') === 'recovery' ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('agree2met-recovery') === 'true')
    );
  }, [reset]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (register) {
        if (passwordStrength(password) < 3) {
          throw new Error('Choose at least 8 characters with mixed case, a number, or a symbol.');
        }
        await authService.register({ name, email, password });
        await login(email, password);
        setMessage('Account created successfully.');
        navigate({ to: '/account' });
      } else if (forgot) {
        setMessage('If an account exists for that email, a password reset link has been sent.');
      } else if (reset) {
        if (!recovery) throw new Error('Open a valid password recovery link from your email first.');
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('agree2met-recovery');
        }
        setMessage('Your password has been updated.');
      } else if (verify) {
        setCooldown(60);
        setMessage('A new confirmation email has been sent.');
      } else {
        await login(email || 'alex@agree2met.com', password || 'Demo@1234');
        toast('Signed in to Agree2Met');
        navigate({ to: '/' });
      }
    } catch (e) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const title = register
    ? 'Create your account'
    : forgot
      ? 'Forgot your password?'
      : reset
        ? 'Set a new password'
        : verify
          ? 'Check your inbox'
          : 'Welcome back';

  return (
    <main className={s.auth}>
      <div className={s.authBox}>
        <Link to="/" className={s.authLogo}>
          <Logo />
          Agree2Met
        </Link>
        <div>
          <h1>{title}</h1>
          <p>
            {register
              ? 'Your agreements deserve a better home.'
              : forgot
                ? 'We’ll email you a link to reset your password.'
                : reset
                  ? 'Choose a secure password for your account.'
                  : verify
                    ? 'Confirm your email to get started.'
                    : 'Sign in to your Agree2Met account.'}
          </p>
        </div>

        {user && !reset && (
          <div className={s.success}>
            You’re signed in. <Link to="/account">Open your account →</Link>
          </div>
        )}

        {error && (
          <div role="alert" className={s.error}>
            {error}
          </div>
        )}

        {message && (
          <div role="status" className={s.success}>
            {message}
          </div>
        )}

        <form className={s.stack} onSubmit={submit}>
          {register && (
            <Input
              label="Full name"
              autoComplete="name"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {!reset && (
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {!forgot && !verify && (
            <>
              <div className={s.flex}>
                <div style={{ flex: 1 }}>
                  <Input
                    label={reset ? 'New password' : 'Password'}
                    type={show ? 'text' : 'password'}
                    autoComplete={register || reset ? 'new-password' : 'current-password'}
                    minLength={register || reset ? 8 : 1}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <IconButton
                  icon={show ? EyeOff : Eye}
                  label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((v) => !v)}
                />
              </div>

              {register && (
                <>
                  <div className={s.strength}>
                    <div style={{ width: `${passwordStrength(password) * 25}%` }} />
                  </div>
                  <p>
                    Password strength: {['Not set', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength(password)]}
                  </p>
                  <label className={s.checkRow}>
                    <input type="checkbox" required />I agree to the{' '}
                    <Link to="/terms" className={s.textLink}>
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className={s.textLink}>
                      Privacy policy
                    </Link>
                    .
                  </label>
                </>
              )}
            </>
          )}

          {reset && !recovery && (
            <div className={s.notice}>
              Open your recovery email to continue. <Link to="/forgot-password">Request a new link</Link>.
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={verify ? Mail : ArrowRight}
            disabled={busy || cooldown > 0 || (reset && !recovery)}
          >
            {busy
              ? 'Please wait…'
              : cooldown
                ? `Resend in ${cooldown}s`
                : register
                  ? 'Create account'
                  : forgot
                    ? 'Send reset link'
                    : reset
                      ? 'Update password'
                      : verify
                        ? 'Resend confirmation'
                        : 'Sign in'}
          </Button>
        </form>

        {!register && !forgot && !reset && !verify && (
          <Link to="/forgot-password" className={s.textLink}>
            Forgot password?
          </Link>
        )}

        <p>
          {register ? (
            <>
              Already have an account?{' '}
              <Link to="/auth" className={s.textLink}>
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Agree2Met?{' '}
              <Link to="/register" className={s.textLink}>
                Create an account
              </Link>
            </>
          )}
        </p>

        <Button onClick={() => navigate({ to: '/' })}>Explore the demo workspace</Button>

        {!forgot && !reset && <p>Demo login: alex@agree2met.com / Demo@1234</p>}

        <Link to="/landing" className={s.textLink}>
          About Agree2Met →
        </Link>
      </div>
    </main>
  );
}
