import { forwardRef, isValidElement } from 'react';
import styles from './IconButton.module.css';

export const IconButton = forwardRef(function IconButton(
  {
    icon,
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
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 20 : 18;

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon;
      return <IconComp aria-hidden="true" size={iconSize} />;
    }
    return null;
  };

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
      {renderIcon()}
    </button>
  );
});
