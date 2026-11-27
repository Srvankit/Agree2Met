import styles from './Tabs.module.css';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'line', // 'line' | 'pill'
  size = 'md', // 'sm' | 'md'
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={`${styles.tablist} ${styles[variant]} ${styles[size]} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            type="button"
            className={`${styles.tab} ${isActive ? styles.active : ''} ${tab.disabled ? styles.disabled : ''}`}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon size={size === 'sm' ? 14 : 16} className={styles.icon} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`${styles.badge} ${isActive ? styles.badgeActive : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
