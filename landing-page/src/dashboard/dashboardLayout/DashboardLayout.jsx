import { useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import ReminderCard from "../components/remainderCard/RemainderCard";
import Chatbot from "../components/Chatbot/Chatbot";
import "./DashboardLayout.css";

const DashboardLayout = () => {

  useEffect(() => {
    document.body.classList.add("dashboard-loaded");

    return () => {
      document.body.classList.remove("dashboard-loaded");
    };
  }, []);

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="dashboard-main">

        <Topbar />

        <div className="dashboard-content">

          {/* HEADER */}
          <div className="dashboard-header fade-in">
            <h2>Dashboard</h2>

            <div className="actions">
              <button className="primary-btn">+ Add Project</button>
              <button className="secondary-btn">Import Data</button>
            </div>
          </div>

          {/* CARDS */}
          <div className="cards-grid">

            <div className="card highlight card-animate">
              <h4>Total Projects</h4>
              <h2>24</h2>
            </div>

            <div className="card card-animate delay-1">
              <h4>Ended</h4>
              <h2>10</h2>
            </div>

            <div className="card card-animate delay-2">
              <h4>Running</h4>
              <h2>12</h2>
            </div>

            <div className="card card-animate delay-3">
              <h4>Pending</h4>
              <h2>2</h2>
            </div>

          </div>

          {/* ANALYTICS + RIGHT */}
          <div className="dashboard-grid">

            {/* ANALYTICS */}
            <div className="analytics fade-in delay-2">

              <h4>Project Analytics</h4>

              <div className="bars">
                <div className="bar"></div>
                <div className="bar active"></div>
                <div className="bar"></div>
                <div className="bar active"></div>
              </div>

            </div>

            {/* RIGHT PANEL */}
            <div className="fade-in delay-3">
              <ReminderCard />
            </div>

          </div>

        </div>
      </div>

      {/* FLOATING CHATBOT */}
      <Chatbot />

    </div>
  );
};

export default DashboardLayout;