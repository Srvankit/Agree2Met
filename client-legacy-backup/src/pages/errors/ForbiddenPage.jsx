import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import styles from './Errors.module.css';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.warning}`}>
          <ShieldAlert size={36} />
        </div>
        <div className={styles.code}>403</div>
        <h1 className={styles.title}>Access Forbidden</h1>
        <p className={styles.description}>
          You do not have permission to view or manage this contract resource. Your current role does not grant sufficient administrative clearance.
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
            onClick={() => navigate('/app/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
