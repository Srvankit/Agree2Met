import { forwardRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import styles from './DatePicker.module.css';

export const DatePicker = forwardRef(function DatePicker(
  {
    value = '',
    onChange,
    min,
    max,
    error = false,
    id,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  return (
    <div className={`${styles.container} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''} ${className}`}>
      <input
        ref={ref}
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
      <CalendarIcon size={16} className={styles.icon} aria-hidden="true" />
    </div>
  );
});
