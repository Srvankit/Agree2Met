import { forwardRef } from 'react';
import styles from './Radio.module.css';

export const Radio = forwardRef(function Radio(
  {
    checked = false,
    onChange,
    value,
    name,
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
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={styles.nativeInput}
          {...props}
        />
        <span className={`${styles.customCircle} ${checked ? styles.checked : ''}`} aria-hidden="true">
          <span className={styles.innerDot} />
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
