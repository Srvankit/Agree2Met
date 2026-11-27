import styles from './Skeleton.module.css';

export function Skeleton({
  variant = 'text', // 'text' | 'circle' | 'rect' | 'card' | 'row'
  width,
  height,
  lines = 1,
  className = '',
}) {
  if (variant === 'row') {
    return (
      <div className={`${styles.rowSkeleton} ${className}`}>
        <div className={styles.skeletonBlock} style={{ width: '40px', height: '24px' }} />
        <div className={styles.skeletonBlock} style={{ width: '35%', height: '20px' }} />
        <div className={styles.skeletonBlock} style={{ width: '20%', height: '20px' }} />
        <div className={styles.skeletonBlock} style={{ width: '15%', height: '20px' }} />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.cardSkeleton} ${className}`}>
        <div className={styles.skeletonBlock} style={{ width: '60%', height: '24px' }} />
        <div className={styles.skeletonBlock} style={{ width: '90%', height: '16px' }} />
        <div className={styles.skeletonBlock} style={{ width: '40%', height: '16px' }} />
      </div>
    );
  }

  if (lines > 1) {
    return (
      <div className={`${styles.linesContainer} ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeletonBlock} ${styles[variant]}`}
            style={{
              width: i === lines - 1 && lines > 1 ? '70%' : width || '100%',
              height: height || '16px',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeletonBlock} ${styles[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
