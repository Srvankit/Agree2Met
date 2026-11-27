import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordInput.module.css';

function calculatePasswordStrength(pass) {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--color-danger)' };
  if (score <= 3) return { score: 2, label: 'Medium', color: 'var(--color-warning)' };
  if (score === 4) return { score: 3, label: 'Good', color: 'var(--accent-color)' };
  return { score: 4, label: 'Strong', color: 'var(--color-success)' };
}

export const PasswordInput = forwardRef(function PasswordInput(
  {
    showStrength = false,
    value = '',
    onChange,
    error = false,
    id,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = showStrength ? calculatePasswordStrength(value) : null;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.inputContainer} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}>
        <input
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${styles.input} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className={styles.toggleBtn}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className={styles.strengthContainer} aria-live="polite">
          <div className={styles.meterBars}>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={styles.meterSegment}
                style={{
                  backgroundColor: step <= strength.score ? strength.color : 'var(--border-color)',
                }}
              />
            ))}
          </div>
          <span className={styles.strengthLabel} style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
});
