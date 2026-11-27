import styles from './Card.module.css';

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  ...props
}) {
  return (
    <div
      className={`${styles.card} ${styles[padding]} ${hoverable ? styles.hoverable : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      {(title || subtitle) && (
        <div className={styles.headerTitles}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      {action && <div className={styles.action}>{action}</div>}
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`${styles.body} ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>;
}
