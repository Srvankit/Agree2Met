import { forwardRef } from 'react';
import styles from './Textarea.module.css';

export const Textarea = forwardRef(function Textarea(
  {
    rows = 4,
    error = false,
    maxLength,
    value,
    className = '',
    id,
    disabled = false,
    ...props
  },
  ref,
) {
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`${styles.wrapper} ${disabled ? styles.disabled : ''}`}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        className={`${styles.textarea} ${error ? styles.error : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
      {maxLength && (
        <div className={styles.charCounter} aria-hidden="true">
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
});
