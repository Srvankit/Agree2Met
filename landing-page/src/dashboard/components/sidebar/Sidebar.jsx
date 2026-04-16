import { useState, useEffect } from "react";
import {
  FiHome,
  FiFileText,
  FiUsers,
  FiClock,
  FiSettings,
  FiLogOut
} from "react-icons/fi";

import "./sidebar.css";

export default function Sidebar({ open }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>

      {/* ===== TOP ===== */}
      <div className="sidebar-top">

        <h2 className="logo">AutoTrust</h2>

        <ul className="sidebar-menu">
          <li className="active"><FiHome /><span>Dashboard</span></li>
          <li><FiFileText /><span>Agreements</span></li>
          <li><FiUsers /><span>Members</span></li>
          <li><FiClock /><span>Reminders</span></li>
          <li><FiSettings /><span>Settings</span></li>
        </ul>

      </div>

      {/* ===== BOTTOM SECTION ===== */}
      <div className="sidebar-bottom">

        {/* THEME SWITCH */}
        <div className="theme-switch">
          <span>Theme</span>

          <div
            className={`toggle ${darkMode ? "active" : ""}`}
            onClick={() => setDarkMode(!darkMode)}
          >
            <div className="circle"></div>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="profile-info">
            <div className="avatar">A</div>
            <div>
              <h4>Ayush Kumar</h4>
              <p>Director</p>
            </div>
          </div>

          <hr />

          <div className="logout">
            <FiLogOut />
            <span>Log Out</span>
          </div>
        </div>

      </div>

    </aside>
  );
}