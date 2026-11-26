import { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

export function Dropdown({
  trigger,
  items = [],
  align = 'left', // 'left' | 'right'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

  const toggle = () => setIsOpen((prev) => !prev);

  const handleItemClick = (item) => {
    if (item.disabled) return;
    if (item.onClick) item.onClick();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`${styles.dropdown} ${className}`}>
      <div onClick={toggle} className={styles.triggerWrapper}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`${styles.menu} ${styles[align]}`}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`div-${index}`} className={styles.divider} role="separator" />;
            }

            const Icon = item.icon;
            const isDanger = item.danger;

            return (
              <button
                key={item.id || item.label || index}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={`${styles.item} ${isDanger ? styles.danger : ''} ${item.disabled ? styles.disabled : ''}`}
              >
                {Icon && <Icon size={16} className={styles.itemIcon} />}
                <span className={styles.itemLabel}>{item.label}</span>
                {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
