import { forwardRef, isValidElement } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

function renderIcon(iconProp, defaultSize) {
  if (!iconProp) return null;
  if (isValidElement(iconProp)) {
    return iconProp;
  }
  const IconComponent = iconProp;
  return <IconComponent className={styles.icon} aria-hidden="true" size={defaultSize} />;
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
    size = 'md', // 'sm' | 'md' | 'lg'
    isLoading = false,
    loading = false,
    disabled = false,
    icon = null,
    leftIcon = null,
    rightIcon = null,
    iconPosition = 'left',
    type = 'button',
    className = '',
    onClick,
    ...props
  },
  ref,
) {
  const actualLoading = isLoading || loading;
  const isDisabled = disabled || actualLoading;
  const defaultIconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  const resolvedLeftIcon = leftIcon || (iconPosition === 'left' ? icon : null);
  const resolvedRightIcon = rightIcon || (iconPosition === 'right' ? icon : null);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`${styles.button} ${styles[variant] || ''} ${styles[size] || ''} ${className}`}
      {...props}
    >
      {actualLoading ? (
        <Loader2 className={`${styles.spinner} ${styles.icon}`} aria-hidden="true" />
      ) : (
        renderIcon(resolvedLeftIcon, defaultIconSize)
      )}

      {children !== undefined && children !== null && <span className={styles.label}>{children}</span>}

      {!actualLoading && renderIcon(resolvedRightIcon, defaultIconSize)}
    </button>
  );
});
