import { forwardRef } from 'react';
import styles from './IconButton.module.css';

export const IconButton = forwardRef(function IconButton(
  {
    icon: Icon,
    label,
    variant = 'ghost', // 'ghost' | 'secondary' | 'primary' | 'danger'
    size = 'md', // 'sm' | 'md' | 'lg'
    disabled = false,
    className = '',
    onClick,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      <Icon aria-hidden="true" size={size === 'sm' ? 15 : size === 'lg' ? 20 : 18} />
    </button>
  );
});
