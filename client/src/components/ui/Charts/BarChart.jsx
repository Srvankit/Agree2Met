import { useState } from 'react';
import styles from './Charts.module.css';

export function BarChart({
  data = [], // [{ label: 'Draft', value: 12, color?: '#...' }, ...]
  height = 200,
  barColor = 'var(--color-primary)',
  valuePrefix = '',
  valueSuffix = '',
  className = '',
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return <div className={styles.empty}>No chart data available</div>;
  }

  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const width = 500;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 5);
  const barWidth = Math.min(36, (innerWidth / data.length) * 0.65);
  const step = innerWidth / data.length;

  return (
    <div className={`${styles.chartWrapper} ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Bar chart"
      >
        <title>Bar chart comparison</title>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, i) => {
          const y = padding.top + innerHeight * pct;
          const val = Math.round(maxVal - maxVal * pct);
          return (
            <g key={i} className={styles.gridLine}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * innerHeight;
          const x = padding.left + i * step + (step - barWidth) / 2;
          const y = padding.top + innerHeight - barHeight;
          const isHovered = hoveredBar?.index === i;
          const fill = d.color || barColor;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className={styles.bar}
                style={{ fill }}
                opacity={isHovered ? 1 : 0.88}
                onMouseEnter={() =>
                  setHoveredBar({ ...d, index: i, cx: x + barWidth / 2, cy: y })
                }
                onMouseLeave={() => setHoveredBar(null)}
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: ${valuePrefix}${d.value}${valueSuffix}`}
              />
              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className={styles.axisLabel}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredBar && (
        <div
          className={styles.tooltip}
          style={{
            left: `${(hoveredBar.cx / width) * 100}%`,
            top: `${(hoveredBar.cy / height) * 100}%`,
          }}
        >
          <div className={styles.tooltipTitle}>{hoveredBar.label}</div>
          <div className={styles.tooltipValue}>
            {valuePrefix}
            {hoveredBar.value}
            {valueSuffix}
          </div>
        </div>
      )}
    </div>
  );
}
