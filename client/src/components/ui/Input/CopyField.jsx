import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import styles from './CopyField.module.css';

export function CopyField({ value, label = null, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.fieldBox}>
        <span className={styles.valueText} title={value}>
          {value}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
          aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span className={styles.btnText}>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}
