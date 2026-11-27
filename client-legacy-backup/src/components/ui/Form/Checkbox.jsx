import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

export const Checkbox = forwardRef(function Checkbox(
  {
    checked = false,
    onChange,
    label,
    description = null,
    id,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  return (
    <label className={`${styles.wrapper} ${disabled ? styles.disabled : ''} ${className}`}>
      <span className={styles.inputWrapper}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={styles.nativeInput}
          {...props}
        />
        <span className={`${styles.customBox} ${checked ? styles.checked : ''}`} aria-hidden="true">
          {checked && <Check size={12} strokeWidth={3} className={styles.checkIcon} />}
        </span>
      </span>

      {(label || description) && (
        <span className={styles.labelCol}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </span>
      )}
    </label>
  );
});
