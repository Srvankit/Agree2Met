<<<<<<< HEAD
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
=======
import { useEffect, useState } from "react";
import "./navbar.css";

export default function Navbar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  /* LOAD THEME */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  /* TOGGLE THEME */
  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  /* SCROLL SHADOW */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ACTIVE SECTION */
  useEffect(() => {
    const sections = document.querySelectorAll("section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => sections.forEach((sec) => observer.unobserve(sec));
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>

      {/* LEFT */}
      <div className="nav-left">
        <span className="logo-icon">✧</span>
        <span className="logo-text">Agree2Met</span>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <a href="#features" className={active === "features" ? "active" : ""}>Features</a>
        <a href="#how" className={active === "how" ? "active" : ""}>How it works</a>
        <a href="#preview" className={active === "preview" ? "active" : ""}>Preview</a>
        <a href="#testimonials" className={active === "testimonials" ? "active" : ""}>Testimonials</a>
        <a href="#contact" className={active === "contact" ? "active" : ""}>Contact Us</a>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <button className="login-btn">Login</button>
        <button className="signup-btn">Sign Up</button>

        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

    </nav>
  );
}
>>>>>>> d6723f47b0d52037b1f906b0c2a0b55ff9f30677
