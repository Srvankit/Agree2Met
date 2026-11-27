import styles from './KeyValue.module.css';

export function KeyValue({ label, value, isMono = false, action, className = '' }) {
  return (
    <div className={`${styles.item} ${className}`}>
      <dt className={styles.key}>{label}</dt>
      <dd className={`${styles.val} ${isMono ? styles.mono : ''}`}>
        {value}
        {action && <span className={styles.action}>{action}</span>}
      </dd>
    </div>
  );
}

export function KeyValueList({ items = [], layout = 'horizontal', className = '' }) {
  // items: [{ label, value, isMono?, copyable?, action? }]
  return (
    <div className={`${styles.list} ${styles[layout]} ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className={styles.item}>
          <dt className={styles.key}>{item.label}</dt>
          <dd className={`${styles.val} ${item.isMono ? styles.mono : ''}`}>
            {item.value}
            {item.action && <span className={styles.action}>{item.action}</span>}
          </dd>
        </div>
      ))}
    </div>
  );
}
