import { useState, useRef, useEffect } from 'react';
import styles from './Popover.module.css';

export function Popover({
  trigger,
  children,
  position = 'bottom', // 'top' | 'bottom' | 'left' | 'right'
  align = 'center', // 'start' | 'center' | 'end'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={popoverRef} className={`${styles.container} ${className}`}>
      <div onClick={() => setIsOpen((prev) => !prev)} className={styles.trigger}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`${styles.popover} ${styles[position]} ${styles[align]}`}
          role="dialog"
        >
          {children}
        </div>
      )}
    </div>
  );
}
