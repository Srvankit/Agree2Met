import { forwardRef } from 'react';
import styles from './Switch.module.css';

export const Switch = forwardRef(function Switch(
  {
    checked = false,
    onChange,
    label = null,
    description = null,
    id,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}>
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={`${styles.track} ${checked ? styles.checked : ''}`}
        {...props}
      >
        <span className={styles.thumb} />
      </button>

      {(label || description) && (
        <div className={styles.textCol} onClick={handleClick}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </div>
      )}
    </div>
  );
});
