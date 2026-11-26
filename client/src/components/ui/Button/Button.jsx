import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
    size = 'md', // 'sm' | 'md' | 'lg'
    isLoading = false,
    disabled = false,
    icon: Icon = null,
    iconPosition = 'left',
    type = 'button',
    className = '',
    onClick,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`${styles.spinner} ${styles.icon}`} aria-hidden="true" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={styles.icon} aria-hidden="true" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}

      <span className={styles.label}>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className={styles.icon} aria-hidden="true" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}
    </button>
  );
});
