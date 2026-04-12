import StatsCard from "../../components/statsCard/StatsCard";

const DashboardHome = () => {
  return (
    <div className="dashboard-content">

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
  );
};

export default DashboardHome;