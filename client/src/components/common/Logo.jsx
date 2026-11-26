import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

export function Logo({
  variant = 'full', // 'full' | 'icon'
  size = 'md', // 'sm' | 'md' | 'lg'
  linkTo = '/',
  className = '',
}) {
  const content = (
    <div className={`${styles.logoContainer} ${styles[size]} ${className}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="var(--accent-color)" />
        <path
          d="M10 8H20C21.1046 8 22 8.89543 22 10V22C22 23.1046 21.1046 24 20 24H10C8.89543 24 8 23.1046 8 22V10C8 8.89543 8.89543 8 10 8Z"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 16L15 19L20 13"
          stroke="var(--color-success-soft, #DCFCE7)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {variant === 'full' && (
        <span className={styles.wordmark}>
          Agree<span className={styles.accentText}>2</span>Met
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={styles.logoLink} aria-label="Agree2Met Home">
        {content}
      </Link>
    );
  }

  return content;
}
