import { FiSearch, FiBell } from "react-icons/fi";
import "./topbar.css";

const Topbar = ({ setSidebarOpen }) => {
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

        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>

      </div>

      {/* RIGHT */}
      <div className="topbar-right">

        <div className="icon-btn">
          <FiBell />
        </div>

        <div className="profile">
          <div className="avatar">A</div>
          <span className="username">Ankit</span>
        </div>

      </div>

    </div>
  );
};

export default Topbar;