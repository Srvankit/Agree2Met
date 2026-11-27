import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import styles from './Combobox.module.css';

export function Combobox({
  options = [], // [{ value, label, subtitle? }]
  value = '',
  onChange,
  placeholder = 'Select or search...',
  disabled = false,
  error = false,
  id,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (filteredOptions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? (filteredOptions.length || 1) - 1 : prev - 1,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${error ? styles.error : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`${styles.inputBox} ${isOpen ? styles.open : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <span className={`${styles.selectedLabel} ${!selectedOption ? styles.placeholder : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.searchRow}>
            <input
              ref={inputRef}
              id={id}
              type="text"
              className={styles.searchInput}
              placeholder="Type to filter..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  inputRef.current?.focus();
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>No matching options</div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.optionItem} ${isHighlighted ? styles.highlighted : ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      {opt.subtitle && <span className={styles.optionSub}>{opt.subtitle}</span>}
                    </div>
                    {isSelected && <Check size={14} className={styles.checkIcon} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
