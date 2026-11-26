import styles from './Field.module.css';

export function Field({
  label,
  id,
  required = false,
  optional = false,
  error = null,
  helpText = null,
  children,
  className = '',
}) {
  return (
    <div className={`${styles.field} ${error ? styles.hasError : ''} ${className}`}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
          </label>
          {optional && <span className={styles.optionalBadge}>Optional</span>}
        </div>
      )}

      <div className={styles.controlWrapper}>{children}</div>

      {error ? (
        <p id={id ? `${id}-error` : undefined} className={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : helpText ? (
        <p id={id ? `${id}-help` : undefined} className={styles.helpText}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
