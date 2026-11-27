import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000, action = null }) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      const newToast = { id, title, message, type, action };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast],
  );

  const toast = {
    success: (msg, opts = {}) => addToast({ message: msg, type: 'success', ...opts }),
    error: (msg, opts = {}) => addToast({ message: msg, type: 'error', ...opts }),
    warning: (msg, opts = {}) => addToast({ message: msg, type: 'warning', ...opts }),
    info: (msg, opts = {}) => addToast({ message: msg, type: 'info', ...opts }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <aside aria-label="Notifications" className={styles.toastContainer} aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;

          return (
            <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="status">
              <Icon size={18} className={styles.icon} aria-hidden="true" />
              <div className={styles.content}>
                {t.title && <h5 className={styles.title}>{t.title}</h5>}
                <p className={styles.message}>{t.message}</p>
                {t.action && <div className={styles.action}>{t.action}</div>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className={styles.closeBtn}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
