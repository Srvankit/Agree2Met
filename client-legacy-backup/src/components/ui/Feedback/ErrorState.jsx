import { AlertOctagon } from 'lucide-react';
import { Button } from '../Button/Button.jsx';
import styles from './ErrorState.module.css';

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry = null,
  retryLabel = 'Try again',
  className = '',
}) {
  return (
    <div className={`${styles.errorState} ${className}`} role="alert">
      <div className={styles.iconCircle}>
        <AlertOctagon size={32} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
