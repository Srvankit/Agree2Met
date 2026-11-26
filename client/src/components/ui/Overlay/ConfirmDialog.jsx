import { Modal } from './Modal.jsx';
import { Button } from '../Button/Button.jsx';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
}) {
  const isDestructive = variant === 'danger';
  const Icon = isDestructive ? AlertCircle : AlertTriangle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={!isLoading}>
      <div className={styles.container}>
        <div className={`${styles.iconCircle} ${styles[variant]}`}>
          <Icon size={24} />
        </div>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
