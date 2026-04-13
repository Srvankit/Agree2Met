import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
    document.body.classList.toggle("dark");
    const newTheme = !darkMode ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    setDarkMode(!darkMode);
  };

  /* SCROLL EFFECT */
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

  /* SMOOTH SCROLL */
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >

      {/* LEFT */}
      <div className="nav-left">
        <span className="logo-icon">✧</span>
        <span className="logo-text">Agree2Met</span>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        {["features", "how", "preview", "testimonials", "contact"].map((id) => (
          <button
            key={id}
            onClick={() => handleScrollTo(id)}
            className={active === id ? "active" : ""}
          >
            {id === "how"
              ? "How it works"
              : id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <button className="login-btn">Login</button>

        <button className="signup-btn">
          Get Started
        </button>

        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

    </motion.nav>
  );
}