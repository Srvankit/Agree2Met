import styles from './Timeline.module.css';

export function Timeline({ items = [], className = '' }) {
  // items: [{ title, description?, timestamp, icon?, isSuccess?, isWarning?, isDanger?, metadata? }]
  return (
    <div className={`${styles.timeline} ${className}`}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isLast = idx === items.length - 1;

        return (
          <div key={idx} className={`${styles.eventItem} ${isLast ? styles.lastItem : ''}`}>
            <div className={styles.markerCol}>
              <div
                className={`${styles.markerDot} ${item.isSuccess ? styles.success : ''} ${item.isWarning ? styles.warning : ''} ${item.isDanger ? styles.danger : ''}`}
              >
                {Icon ? <Icon size={12} /> : <div className={styles.innerDot} />}
              </div>
              {!isLast && <div className={styles.line} />}
            </div>

            <div className={styles.contentCol}>
              <div className={styles.topRow}>
                <span className={styles.title}>{item.title}</span>
                {item.timestamp && <time className={styles.time}>{item.timestamp}</time>}
              </div>

              {item.description && <p className={styles.description}>{item.description}</p>}

              {item.metadata && (
                <div className={styles.metadataBox}>
                  {item.metadata}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
