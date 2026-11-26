import { DatePicker } from './DatePicker.jsx';
import styles from './DateRangePicker.module.css';

export function DateRangePicker({
  startDate = '',
  endDate = '',
  onStartChange,
  onEndChange,
  className = '',
}) {
  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const fmt = (d) => d.toISOString().split('T')[0];
    if (onStartChange) onStartChange({ target: { value: fmt(start) } });
    if (onEndChange) onEndChange({ target: { value: fmt(end) } });
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.inputsRow}>
        <div className={styles.inputCol}>
          <span className={styles.rangeLabel}>From</span>
          <DatePicker value={startDate} onChange={onStartChange} max={endDate || undefined} />
        </div>
        <span className={styles.divider}>→</span>
        <div className={styles.inputCol}>
          <span className={styles.rangeLabel}>To</span>
          <DatePicker value={endDate} onChange={onEndChange} min={startDate || undefined} />
        </div>
      </div>

      <div className={styles.presetsRow}>
        <button type="button" onClick={() => handlePreset(7)} className={styles.presetBtn}>
          Last 7d
        </button>
        <button type="button" onClick={() => handlePreset(30)} className={styles.presetBtn}>
          Last 30d
        </button>
        <button type="button" onClick={() => handlePreset(90)} className={styles.presetBtn}>
          Last 90d
        </button>
        <button type="button" onClick={() => handlePreset(365)} className={styles.presetBtn}>
          Last 12m
        </button>
      </div>
    </div>
  );
}
