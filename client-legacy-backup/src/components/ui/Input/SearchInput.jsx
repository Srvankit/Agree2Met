import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  shortcutHint = null, // e.g. "⌘K"
  className = '',
  id,
  ...props
}) {
  const [innerVal, setInnerVal] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    setInnerVal(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInnerVal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onChange) onChange(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setInnerVal('');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (onChange) onChange('');
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <Search className={styles.searchIcon} aria-hidden="true" size={16} />
      <input
        id={id}
        type="search"
        value={innerVal}
        onChange={handleChange}
        placeholder={placeholder}
        className={styles.input}
        {...props}
      />
      {innerVal ? (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearBtn}
          aria-label="Clear search query"
        >
          <X size={14} />
        </button>
      ) : shortcutHint ? (
        <kbd className={styles.shortcutKey}>{shortcutHint}</kbd>
      ) : null}
    </div>
  );
}
