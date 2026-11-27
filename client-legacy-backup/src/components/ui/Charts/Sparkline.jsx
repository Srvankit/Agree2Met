import styles from './Charts.module.css';

export function Sparkline({
  data = [],
  width = 100,
  height = 28,
  trend = 'neutral', // 'up' | 'down' | 'neutral'
  className = '',
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const getX = (i) => (i / (data.length - 1)) * (width - 4) + 2;
  const getY = (val) => height - 3 - ((val - min) / range) * (height - 6);

  const points = data.map((d, i) => `${getX(i)},${getY(d)}`).join(' ');

  const strokeColor =
    trend === 'up'
      ? 'var(--color-success)'
      : trend === 'down'
      ? 'var(--color-error)'
      : 'var(--color-text-secondary)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`${styles.sparkline} ${className}`}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
