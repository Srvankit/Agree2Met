import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export const Select = forwardRef(function Select(
  {
    options = [], // Array of { value, label, disabled? }
    value,
    onChange,
    placeholder = 'Select an option...',
    error = false,
    disabled = false,
    className = '',
    id,
    ...props
  },
  ref,
) {
  return (
    <div className={`${styles.container} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}>
      <select
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styles.select} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className={styles.arrow} size={16} aria-hidden="true" />
    </div>
  );
});
