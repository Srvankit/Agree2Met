import { useState } from 'react';
import styles from './Charts.module.css';

export function LineChart({
  data = [], // [{ label: 'Jan', value: 10 }, ...]
  height = 200,
  strokeColor = 'var(--color-primary)',
  fillColor = 'var(--color-primary-light)',
  valuePrefix = '',
  valueSuffix = '',
  className = '',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return <div className={styles.empty}>No chart data available</div>;
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 500;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(...values, 10);

  const getX = (index) => padding.left + (index / (data.length - 1 || 1)) * innerWidth;
  const getY = (val) =>
    padding.top + innerHeight - ((val - minVal) / (maxVal - minVal || 1)) * innerHeight;

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Create area path under line
  const areaPath = `${points} ${getX(data.length - 1)},${padding.top + innerHeight} ${getX(0)},${padding.top + innerHeight}`;

  return (
    <div className={`${styles.chartWrapper} ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Line chart"
      >
        <title>Line chart showing trend over time</title>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor || strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={fillColor || strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + innerHeight * pct;
          const val = Math.round(maxVal - (maxVal - minVal) * pct);
          return (
            <g key={i} className={styles.gridLine}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                {val}
              </text>
            </g>
          );
        })}

        {/* Filled area */}
        <polygon points={areaPath} fill="url(#lineGrad)" />

        {/* Stroke Line */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoveredPoint?.index === i;

          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                className={styles.dataPoint}
                style={{ fill: strokeColor }}
                onMouseEnter={() => setHoveredPoint({ ...d, index: i, cx, cy })}
                onMouseLeave={() => setHoveredPoint(null)}
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: ${valuePrefix}${d.value}${valueSuffix}`}
              />
              {/* X Axis Label */}
              <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                className={styles.axisLabel}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredPoint && (
        <div
          className={styles.tooltip}
          style={{
            left: `${(hoveredPoint.cx / width) * 100}%`,
            top: `${(hoveredPoint.cy / height) * 100}%`,
          }}
        >
          <div className={styles.tooltipTitle}>{hoveredPoint.label}</div>
          <div className={styles.tooltipValue}>
            {valuePrefix}
            {hoveredPoint.value}
            {valueSuffix}
          </div>
        </div>
      )}
    </div>
  );
}
