import { useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import styles from './Banner.module.css';

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export function Banner({
  variant = 'info', // 'info' | 'success' | 'warning' | 'danger'
  title = null,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const Icon = ICONS[variant] || Info;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`${styles.banner} ${styles[variant]} ${className}`} role="alert">
      <Icon size={18} className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.body}>{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={styles.closeBtn}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
