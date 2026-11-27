import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs({
  items = [], // Array of { label, to? }
  showHome = true,
  className = '',
}) {
  return (
    <nav aria-label="Breadcrumb" className={`${styles.nav} ${className}`}>
      <ol className={styles.list}>
        {showHome && (
          <li className={styles.item}>
            <Link to="/app/dashboard" className={styles.homeLink} aria-label="Home Dashboard">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className={styles.separator} aria-hidden="true" />
          </li>
        )}

        {items.map((crumb, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className={styles.item} aria-current={isLast ? 'page' : undefined}>
              {!isLast && crumb.to ? (
                <Link to={crumb.to} className={styles.link}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={styles.current}>{crumb.label}</span>
              )}

              {!isLast && <ChevronRight size={14} className={styles.separator} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
