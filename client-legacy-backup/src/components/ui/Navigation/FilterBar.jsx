import { X } from 'lucide-react';
import { SearchInput } from '../Input/SearchInput';
import styles from './FilterBar.module.css';

export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [], // Array of { id, label, value, options: [{ label, value }], onChange }
  activeCount = 0,
  onClearAll,
  children,
  className = '',
}) {
  return (
    <div className={`${styles.filterBar} ${className}`}>
      <div className={styles.searchSection}>
        {onSearchChange && (
          <SearchInput
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            placeholder={searchPlaceholder}
            className={styles.search}
          />
        )}
      </div>

      <div className={styles.filterSection}>
        {filters.map((filter) => (
          <div key={filter.id} className={styles.filterItem}>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={`${styles.select} ${filter.value ? styles.filterActive : ''}`}
              aria-label={filter.label}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {children}

        {activeCount > 0 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className={styles.clearBtn}
            title="Reset all filters"
          >
            <X size={14} />
            <span>Reset filters</span>
            <span className={styles.badge}>{activeCount}</span>
          </button>
        )}
      </div>
    </div>
  );
}
