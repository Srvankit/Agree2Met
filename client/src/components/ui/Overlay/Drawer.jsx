import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  position = 'right', // 'right' | 'left'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children,
  footer,
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${styles[position]} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        aria-describedby={description ? 'drawer-desc' : undefined}
      >
        <div className={styles.header}>
          <div>
            {title && <h2 id="drawer-title" className={styles.title}>{title}</h2>}
            {description && <p id="drawer-desc" className={styles.description}>{description}</p>}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
