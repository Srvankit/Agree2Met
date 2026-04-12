import "./statsCard.css";

const StatsCard = ({
  title,
  value,
  icon,
  change,
  status,
  color,
  isActive,
  onHover,
  onLeave
}) => {
  return (
    <div
      className={`stats-card ${isActive ? "active" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* TOP */}
      <div className="stats-top">
        <div className={`icon-box ${color}`}>
          {icon}
        </div>

        <div className="arrow">↗</div>
      </div>

      {/* BODY */}
      <div className="stats-body">
        <p className="stats-title">{title}</p>
        <h2 className="stats-value">{value}</h2>

        {change && (
          <div className="stats-change">
            <span className="badge">↑ {change}</span>
            <span className="sub">from last month</span>
          </div>
        )}

        {status && (
          <div className="stats-status">
            <span className="dot"></span>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;