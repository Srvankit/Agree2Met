import "./topbar.css";

const Topbar = () => {
  return (
    <div className="topbar">
      <input placeholder="Search task..." />

      <div className="top-right">
        <span>🔔</span>
        <img src="https://i.pravatar.cc/40" alt="" />
      </div>
    </div>
  );
};

export default Topbar;