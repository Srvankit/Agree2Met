import { useState } from 'react';
import styles from './Avatar.module.css';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToColor(str) {
  if (!str) return '#5B5BF0';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#5B5BF0', '#0891B2', '#059669', '#D97706', '#7C3AED', '#DB2777', '#2563EB'];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src = null,
  name = '',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  status = null, // 'online' | 'offline' | 'busy' | null
  className = '',
}) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  return (
    <div className={`${styles.avatarContainer} ${styles[size]} ${className}`} title={name}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={styles.image}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={styles.fallback} style={{ backgroundColor: bgColor }}>
          {initials}
        </div>
      )}

      {status && <span className={`${styles.statusDot} ${styles[status]}`} />}
    </div>
  );
}
