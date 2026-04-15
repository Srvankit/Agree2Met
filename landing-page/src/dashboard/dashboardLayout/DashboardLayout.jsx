import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";
import ReminderCard from "../components/remainderCard/RemainderCard";
import ChatBot from "../components/chatBot/ChatBot";
import StatsCard from "../components/statsCard/StatsCard";
import ProgressOverview from "../components/progressOverview/ProgressOverview";

import "./DashboardLayout.css";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);

  const stats = [
    {
      title: "Total Agreements",
      value: 24,
      icon: "📄",
      change: "12%",
      color: "green",
    },
    {
      title: "Completed",
      value: 10,
      icon: "✔",
      change: "8%",
      color: "green",
    },
    {
      title: "Running",
      value: 12,
      icon: "🔄",
      change: "5%",
      color: "blue",
    },
    {
      title: "Pending",
      value: 2,
      icon: "⏰",
      status: "On Discussion",
      color: "orange",
    },
  ];

  return (
    <div className="dashboard-wrapper dashboard-theme">
      <div className="dashboard">

        {/* SIDEBAR */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* OVERLAY */}
        {sidebarOpen && (
          <div
            className="overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN */}
        <div className="dashboard-main">

          {/* TOPBAR */}
          <Topbar setSidebarOpen={setSidebarOpen} />

          <div className="dashboard-content">

            {/* HEADER */}
            <div className="dashboard-header">
              <div className="header-text">
                <h2>Dashboard</h2>
                <p>Manage and track your agreements easily</p>
              </div>

              <div className="actions">
                <button className="primary-btn">＋ New Agreement</button>
                <button className="secondary-btn">⬇ Import Data</button>
              </div>
            </div>

            {/* STATS */}
            <div className="cards-grid">
              {stats.map((item, index) => (
                <StatsCard
                  key={index}
                  {...item}
                  isActive={activeCard === index}
                  onHover={() => setActiveCard(index)}
                  onLeave={() => setActiveCard(0)}
                />
              ))}
            </div>

            {/* MAIN GRID */}
            <div className="dashboard-grid">

              {/* LEFT */}
              <div className="left-panel">
                <div className="analytics-card">
                  <h4>Agreement Analytics</h4>

                  <div className="bars">
                    <div className="bar"></div>
                        <div className="bar active"></div>
                        <div className="bar"></div>
                        <div className="bar active"></div>
                        <div className="bar"></div>
                        <div className="bar active"></div>
                        <div className="bar"></div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="right-panel">
                <ReminderCard />
              </div>

            </div>

            {/* BOTTOM */}
            <div className="bottom-grid">
              <div className="progress-wrapper">
                  <ProgressOverview />
               </div>
            </div>

            {/* CHATBOT */}
            <ChatBot />

          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;