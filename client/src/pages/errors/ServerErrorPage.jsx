import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import styles from './Errors.module.css';

export function ServerErrorPage() {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      navigate('/app/dashboard');
    }, 600);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.error}`}>
          <AlertTriangle size={36} />
        </div>
        <div className={styles.code}>500</div>
        <h1 className={styles.title}>Internal Server Error</h1>
        <p className={styles.description}>
          The application encountered an unexpected backend failure. Diagnostic details have been logged to the telemetry stream.
        </p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            leftIcon={RotateCcw}
            isLoading={retrying}
            onClick={handleRetry}
          >
            Retry Request
          </Button>
          <Button
            variant="secondary"
            leftIcon={Home}
            onClick={() => navigate('/app/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
