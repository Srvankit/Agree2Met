import { useState } from 'react';
import styles from './Charts.module.css';

export function DonutChart({
  data = [], // [{ label: 'Signed', value: 14, color: '#...' }, ...]
  size = 200,
  innerRadiusPercent = 0.68,
  centerLabel = 'Total',
  centerValue,
  className = '',
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (!data || data.length === 0) {
    return <div className={styles.empty}>No chart data available</div>;
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const displayCenterValue = centerValue !== undefined ? centerValue : total;

  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = radius * innerRadiusPercent;

  let startAngle = 0;

  const slices = data.map((slice, index) => {
    const angle = total > 0 ? (slice.value / total) * 360 : 0;
    const endAngle = startAngle + angle;

    const x1 = center + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = center + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = center + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = center + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const ix1 = center + innerRadius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const iy1 = center + innerRadius * Math.sin((Math.PI * (endAngle - 90)) / 180);
    const ix2 = center + innerRadius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const iy2 = center + innerRadius * Math.sin((Math.PI * (startAngle - 90)) / 180);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix1} ${iy1}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}
      Z
    `;

    const sliceData = {
      ...slice,
      index,
      pathData,
      percentage: total > 0 ? Math.round((slice.value / total) * 100) : 0,
    };

    startAngle = endAngle;
    return sliceData;
  });

  return (
    <div className={`${styles.donutContainer} ${className}`}>
      <div className={styles.svgWrapper} style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className={styles.svg}
          role="img"
          aria-label="Donut distribution chart"
        >
          <title>Donut distribution chart</title>
          {slices.map((slice) => {
            const isHovered = hoveredSlice?.index === slice.index;
            return (
              <path
                key={slice.label || slice.index}
                d={slice.pathData}
                fill={slice.color || 'var(--color-primary)'}
                className={styles.donutSlice}
                transform={isHovered ? `scale(1.03)` : ''}
                style={{ transformOrigin: `${center}px ${center}px` }}
                opacity={hoveredSlice && !isHovered ? 0.6 : 1}
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
                tabIndex={0}
                role="button"
                aria-label={`${slice.label}: ${slice.value} (${slice.percentage}%)`}
              />
            );
          })}
        </svg>

        <div className={styles.donutCenter}>
          <span className={styles.donutCenterVal}>
            {hoveredSlice ? hoveredSlice.value : displayCenterValue}
          </span>
          <span className={styles.donutCenterLabel}>
            {hoveredSlice ? hoveredSlice.label : centerLabel}
          </span>
        </div>
      </div>

      <div className={styles.legend}>
        {data.map((item, i) => (
          <div
            key={item.label || i}
            className={`${styles.legendItem} ${hoveredSlice?.index === i ? styles.legendItemActive : ''}`}
            onMouseEnter={() => setHoveredSlice({ ...item, index: i })}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <span
              className={styles.legendDot}
              style={{ backgroundColor: item.color || 'var(--color-primary)' }}
            />
            <span className={styles.legendLabel}>{item.label}</span>
            <span className={styles.legendVal}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
