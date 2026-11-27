import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import styles from './errors/Errors.module.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.info}`}>
          <FileQuestion size={36} />
        </div>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The requested page or contract link does not exist, has expired, or was relocated.
        </p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            leftIcon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            leftIcon={Home}
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
