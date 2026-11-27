import {
  FileEdit,
  Clock,
  Send,
  PenTool,
  Users,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    icon: FileEdit,
    className: 'draft',
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    icon: Clock,
    className: 'pending',
  },
  SENT: {
    label: 'Sent',
    icon: Send,
    className: 'sent',
  },
  AWAITING_SIGNATURES: {
    label: 'Awaiting Signatures',
    icon: PenTool,
    className: 'awaiting',
  },
  PARTIALLY_SIGNED: {
    label: 'Partially Signed',
    icon: Users,
    className: 'partiallySigned',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'completed',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'rejected',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    className: 'cancelled',
  },
  EXPIRED: {
    label: 'Expired',
    icon: AlertTriangle,
    className: 'expired',
  },
};

export function StatusBadge({ status = 'DRAFT', size = 'md', className = '' }) {
  const normStatus = (typeof status === 'string' ? status.toUpperCase() : 'DRAFT');
  const config = STATUS_CONFIG[normStatus] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  return (
    <span className={`${styles.statusBadge} ${styles[config.className]} ${styles[size]} ${className}`}>
      <Icon size={size === 'sm' ? 12 : 14} className={styles.icon} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
