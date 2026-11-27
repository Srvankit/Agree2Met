import { forwardRef } from 'react';
import styles from './Input.module.css';

export const Input = forwardRef(function Input(
  {
    type = 'text',
    error = false,
    leftIcon: LeftIcon = null,
    rightIcon: RightIcon = null,
    className = '',
    id,
    disabled = false,
    ...props
  },
  ref,
) {
  return (
    <div className={`${styles.inputContainer} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}>
      {LeftIcon && <LeftIcon className={styles.leftIcon} aria-hidden="true" size={16} />}
      <input
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        className={`${styles.input} ${LeftIcon ? styles.hasLeftIcon : ''} ${RightIcon ? styles.hasRightIcon : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
      {RightIcon && <RightIcon className={styles.rightIcon} aria-hidden="true" size={16} />}
    </div>
  );
});
