import styles from './ProgressBar.module.css';

export function ProgressBar({
  value = 0, // 0 to 100
  max = 100,
  label = null,
  showPercentage = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'accent', // 'accent' | 'success' | 'warning' | 'danger'
  className = '',
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(label || showPercentage) && (
        <div className={styles.labelRow}>
          {label && <span className={styles.label}>{label}</span>}
          {showPercentage && <span className={styles.percentage}>{percentage}%</span>}
        </div>
      )}
      <div
        className={`${styles.track} ${styles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`${styles.fill} ${styles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
