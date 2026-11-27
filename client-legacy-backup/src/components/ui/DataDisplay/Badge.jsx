import styles from './Badge.module.css';

export function Badge({
  children,
  variant = 'secondary', // 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size = 'md', // 'sm' | 'md'
  icon: Icon = null,
  className = '',
}) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 10 : 12} aria-hidden="true" className={styles.icon} />}
      <span>{children}</span>
    </span>
  );
}
