import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  FileCheck,
  FileText,
  Clock,
  Shield,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/validators';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [filterTab, setFilterTab] = useState('ALL');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === 'UNREAD') return !n.read;
      if (filterTab === 'SIGNING') return n.type === 'signing' || n.type === 'signature';
      if (filterTab === 'AUDIT') return n.type === 'audit' || n.type === 'security';
      return true;
    });
  }, [notifications, filterTab]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'signing':
      case 'signature':
        return <FileCheck size={20} />;
      case 'deadline':
      case 'reminder':
        return <Clock size={20} />;
      case 'audit':
      case 'security':
        return <Shield size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Notifications</h1>
          <p className={styles.subtitle}>
            Stay informed on contract signatures, approaching expirations, and audit integrity logs.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<CheckCheck size={16} />}
          disabled={unreadCount === 0}
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      </div>

      {/* Action / Filter bar */}
      <div className={styles.actionBar}>
        <div className={styles.tabs}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'SIGNING', label: 'Signatures' },
            { id: 'AUDIT', label: 'Security & Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${filterTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setFilterTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description={
            filterTab === 'UNREAD'
              ? 'You have zero unread notifications.'
              : 'No alerts found in this view.'
          }
        />
      ) : (
        <div className={styles.list}>
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.item} ${!notif.read ? styles.itemUnread : ''}`}
            >
              <div className={styles.iconWrap}>{getNotificationIcon(notif.type)}</div>
              <div className={styles.content}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemTitle}>
                    {!notif.read && <span className={styles.unreadDot} />}
                    {notif.title}
                  </div>
                  <span className={styles.itemTime}>
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className={styles.itemMessage}>{notif.message}</p>
                <div className={styles.itemFooter}>
                  {notif.agreementId ? (
                    <Link
                      to={`/app/agreements/${notif.agreementId}`}
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-brand-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      onClick={() => markAsRead(notif.id)}
                    >
                      View Agreement
                      <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <div />
                  )}

                  {!notif.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Check size={12} />}
                      onClick={() => markAsRead(notif.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
