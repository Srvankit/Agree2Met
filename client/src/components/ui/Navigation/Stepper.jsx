import { Check } from 'lucide-react';
import styles from './Stepper.module.css';

export function Stepper({
  steps = [],
  currentStep = 0,
  onStepClick,
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  className = '',
}) {
  return (
    <nav
      aria-label="Progress"
      className={`${styles.stepper} ${styles[orientation]} ${className}`}
    >
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && isDone;

          return (
            <li
              key={step.id || step.title || index}
              className={`${styles.stepItem} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}
            >
              {index > 0 && <div className={styles.connector} aria-hidden="true" />}

              <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onStepClick(index) : undefined}
                onKeyDown={
                  isClickable
                    ? (e) => (e.key === 'Enter' || e.key === ' ') && onStepClick(index)
                    : undefined
                }
                className={`${styles.stepContent} ${isClickable ? styles.clickable : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className={styles.indicator}>
                  {isDone ? (
                    <Check size={14} className={styles.checkIcon} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <div className={styles.labelWrapper}>
                  <span className={styles.title}>{step.title}</span>
                  {step.description && (
                    <span className={styles.description}>{step.description}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
