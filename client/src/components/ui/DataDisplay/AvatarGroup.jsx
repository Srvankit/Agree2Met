import { Avatar } from './Avatar.jsx';
import styles from './AvatarGroup.module.css';

export function AvatarGroup({
  users = [], // Array of { name, src? }
  max = 4,
  size = 'md',
  className = '',
}) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={`${styles.group} ${className}`}>
      {visible.map((user, idx) => (
        <div key={`${user.name}-${idx}`} className={styles.itemWrapper}>
          <Avatar src={user.src} name={user.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${styles.moreCircle} ${styles[size]}`} title={`${remaining} more`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
