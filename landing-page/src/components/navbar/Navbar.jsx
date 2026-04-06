import React, { useState } from "react";
import "./navbar.css";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // change manually to test

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LEFT: Logo */}
        <div className="navbar-logo">
          <span className="logo-icon">⟡</span>
          <span className="logo-text">AutoTrust</span>
        </div>

        {/* CENTER: Navigation */}
        <div className="navbar-links">
          <a className="nav-link active">Dashboard</a>
          <a className="nav-link">Agreements</a>
          <a className="nav-link">Templates</a>
          <a className="nav-link">Team</a>
        </div>

        {/* RIGHT: Auth / Profile */}
        <div className="navbar-actions">

          {!isLoggedIn ? (
            <>
              <button className="login-btn">Login</button>
              <button className="signup-btn">Sign Up</button>
            </>
          ) : (
            <>
              <span className="bell">🔔</span>
              <img
                src="https://i.pravatar.cc/40"
                alt="profile"
                className="profile-img"
              />
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
