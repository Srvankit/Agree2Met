import StatsCard from "../../components/statsCard/StatsCard";
import "./dashboardHome.css";

const DashboardHome = () => {
  return (
    <div className="dashboard-home">

      {/* 🔥 HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Track and manage your agreements</p>
        </div>

        <div className="dashboard-actions">
          <button className="primary-btn">+ New Agreement</button>
        </div>
      </div>

      {/* 🔥 STATS SECTION */}
      <div className="stats-wrapper glass-card">
        <div className="stats-grid">
          <StatsCard 
            title="Total Agreements"
            value="24"
            icon="📄"
            change="12%"
            highlight
          />

          <StatsCard 
            title="Completed"
            value="10"
            icon="✅"
            change="8%"
          />

          <StatsCard 
            title="Running"
            value="12"
            icon="🔄"
            change="5%"
          />

          <StatsCard 
            title="Pending"
            value="2"
            icon="⏳"
          />
        </div>
      </div>

    </div>
  );
};

export default DashboardHome;