import { Component } from 'react';
import { AlertOctagon, RotateCcw, Compass } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import styles from './ErrorBoundary.module.css';

const isDev = Boolean(import.meta.env?.DEV);

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      route: typeof window !== 'undefined' ? window.location.pathname : '',
    };
  }

  static getDerivedStateFromError(error) {
    const route = typeof window !== 'undefined' ? window.location.pathname : '';
    return { hasError: true, error, route };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error);
    console.error('Component stack trace:', errorInfo?.componentStack);
    console.error('Current route:', window.location.pathname + window.location.search);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, route } = this.state;

      return (
        <div className={styles.wrapper}>
          <div className={styles.card} style={isDev ? { maxWidth: '780px' } : undefined}>
            <div className={styles.iconWrapper}>
              <AlertOctagon size={36} className={styles.icon} />
            </div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.description}>
              An unexpected application error occurred. We have logged this diagnostic event.
            </p>

            {/* Error Message */}
            {error?.message && (
              <pre className={styles.errorBox}>{error.message}</pre>
            )}

            {/* Development-only diagnostic inspection */}
            {isDev && (
              <div className={styles.devSection}>
                <div className={styles.routeBadge}>
                  <Compass size={14} />
                  <span>Route: <strong>{route || '/'}</strong></span>
                </div>

                {errorInfo?.componentStack && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Component Stack:
                    </div>
                    <pre className={styles.stackTrace}>{errorInfo.componentStack.trim()}</pre>
                  </div>
                )}

                {error?.stack && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Error Call Stack:
                    </div>
                    <pre className={styles.stackTrace}>{error.stack.trim()}</pre>
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <Button
                variant="primary"
                icon={<RotateCcw size={16} />}
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
