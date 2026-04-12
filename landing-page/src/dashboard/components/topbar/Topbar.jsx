import { useState, useEffect } from "react";
import { FiSearch, FiBell } from "react-icons/fi";
import "./topbar.css";

const Topbar = ({ setSidebarOpen }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkMode);
  }, [darkMode]);

  return (
    <div className="topbar">

      {/* LEFT */}
      <div className="topbar-left">

        <div
          className="hamburger"
          onClick={() => setSidebarOpen(prev => !prev)}
        >
          ☰
        </div>

        <div className="search-bar">
          <FiSearch />
          <input type="text" placeholder="Search agreements..." />
        </div>

      </div>

      {/* RIGHT */}
      <div className="topbar-right">

        {/* Notification */}
        <div className="icon-btn">
          <FiBell />
        </div>

        {/* Profile */}
        <div className="profile">
          <div className="avatar">A</div>
          <span>Ankit</span>
        </div>

      </div>

    </div>
  );
};

export default Topbar;