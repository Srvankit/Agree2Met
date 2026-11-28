import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Mail, Eye, EyeOff } from 'lucide-react';
import { useWorkspace } from '../context/Workspace';
import { authService } from '../services/authService';
import { isFullDemoMode } from '../services/serviceMode';
import { Button, Input, IconButton } from '../components/demo/ui';
import { Logo } from '../components/demo/Shell';
import s from './pages.module.css';

export function passwordStrength(password) {
  if (!password) return 0;
  return [
    password.length >= 10,
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
  const [showResendBtn, setShowResendBtn] = useState(false);

  const register = mode === 'register';
  const reset = mode === 'reset-password';
  const forgot = mode === 'forgot-password';
  const verify = mode === 'verify-email';

  // Get token from URL query parameter
  const getTokenFromUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  };

  const [token, setToken] = useState(getTokenFromUrl);

  useEffect(() => {
    setError('');
    setMessage('');
    setShowResendBtn(false);
    const urlToken = getTokenFromUrl();
    setToken(urlToken);

    // Auto-verify if on verify-email route with token
    if (mode === 'verify-email' && urlToken) {
      setBusy(true);
      authService
        .verifyEmail(urlToken)
        .then((res) => {
          setMessage(res?.message || 'Email verified successfully! You can now sign in.');
        })
        .catch((err) => {
          setError(err?.message || 'Verification link is invalid or has expired.');
        })
        .finally(() => {
          setBusy(false);
        });
    }
  }, [mode]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResendVerification() {
    if (!email) {
      setError('Please enter your email address to resend verification.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await authService.resendVerification(email);
      setCooldown(60);
      setShowResendBtn(false);
      setMessage(`Verification link resent to ${email}. Please check your inbox.`);
    } catch (err) {
      setError(err?.message || 'Failed to resend verification email.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    setShowResendBtn(false);

    try {
      if (register) {
        if (password.length < 10) {
          throw new Error('Password must be at least 10 characters long.');
        }
        if (passwordStrength(password) < 3) {
          throw new Error('Choose at least 10 characters with mixed case, a number, and a symbol.');
        }

        const parts = name.trim().split(' ');
        const firstName = parts[0] || name.trim();
        const lastName = parts.slice(1).join(' ') || firstName;

        const res = await authService.register({
          firstName,
          lastName,
          email: email.trim(),
          password,
        });

        setMessage(res?.message || 'Account created! Please check your email inbox to verify your account before signing in.');
      } else if (forgot) {
        if (!email) {
          throw new Error('Please enter your email address.');
        }
        await authService.forgotPassword(email.trim());
        setMessage('If an account exists for that email, a password reset link has been sent.');
      } else if (reset) {
        const resetToken = token || getTokenFromUrl();
        if (!resetToken) {
          throw new Error('Invalid or missing password reset token. Please request a new reset link.');
        }
        if (password.length < 10) {
          throw new Error('New password must be at least 10 characters long.');
        }
        await authService.resetPassword(resetToken, password);
        setMessage('Your password has been successfully updated. You can now sign in.');
      } else if (verify) {
        const verifyToken = token || getTokenFromUrl();
        if (verifyToken) {
          const res = await authService.verifyEmail(verifyToken);
          setMessage(res?.message || 'Email verified successfully! You can now sign in.');
        } else {
          if (!email) {
            throw new Error('Please enter your email address to receive a confirmation link.');
          }
          await authService.resendVerification(email.trim());
          setCooldown(60);
          setMessage(`A confirmation email has been sent to ${email}.`);
        }
      } else {
        // Login mode
        if (!email || !password) {
          if (isFullDemoMode()) {
            await login(email || 'alex@agree2met.com', password || 'Demo@1234');
            toast('Signed in to Agree2Met');
            navigate({ to: '/' });
            return;
          }
          throw new Error('Please enter your email and password.');
        }

        try {
          await login(email.trim(), password);
          toast('Signed in to Agree2Met');
          navigate({ to: '/' });
        } catch (loginErr) {
          if (loginErr?.code === 'EMAIL_NOT_VERIFIED') {
            setShowResendBtn(true);
            throw new Error('Your email address is not verified. Please verify your email before signing in.');
          } else if (loginErr?.code === 'TOO_MANY_ATTEMPTS' || loginErr?.code === 'ACCOUNT_LOCKED' || loginErr?.status === 429) {
            throw new Error('Too many attempts. Please try again later.');
          } else if (loginErr?.code === 'INVALID_CREDENTIALS') {
            throw new Error('Invalid email or password.');
          } else {
            throw loginErr;
          }
        }
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

  const fullDemo = isFullDemoMode();

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
            {showResendBtn && (
              <div style={{ marginTop: '0.75rem' }}>
                <Button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={busy || cooldown > 0}
                >
                  {cooldown ? `Resend in ${cooldown}s` : 'Resend verification email'}
                </Button>
              </div>
            )}
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
                    minLength={register || reset ? 10 : 1}
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

          {reset && !token && (
            <div className={s.notice}>
              Open your recovery email link to continue, or <Link to="/forgot-password">request a new link</Link>.
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={verify ? Mail : ArrowRight}
            disabled={busy || cooldown > 0 || (reset && !token)}
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

        {fullDemo && (
          <>
            <Button onClick={() => navigate({ to: '/' })}>Explore the demo workspace</Button>
            {!forgot && !reset && <p>Demo login: alex@agree2met.com / Demo@1234</p>}
          </>
        )}

        <Link to="/landing" className={s.textLink}>
          About Agree2Met →
        </Link>
      </div>
    </main>
  );
}
