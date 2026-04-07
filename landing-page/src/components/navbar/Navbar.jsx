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