import { Component } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <AlertOctagon size={36} className={styles.icon} />
            </div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.description}>
              An unexpected application error occurred. We have logged this diagnostic event.
            </p>
            {this.state.error?.message && (
              <pre className={styles.errorBox}>{this.state.error.message}</pre>
            )}
            <div className={styles.actions}>
              <Button
                variant="primary"
                leftIcon={RotateCcw}
                onClick={this.handleReset}
              >
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
