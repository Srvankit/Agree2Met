import React from "react";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT SECTION */}
        <div className="footer-left">
          <div className="footer-logo">
            <span className="logo-icon">🛡️</span>
            <span className="logo-text">AutoTrust</span>
          </div>

          <p className="footer-description">
            The smart platform for modern agreements and secure collaborations.
            Built for the next generation of digital trust.
          </p>

          <div className="footer-icons">
            <span>🌐</span>
            <span>✉️</span>
          </div>
        </div>

        {/* RIGHT LINKS */}
        <div className="footer-links">

          <div className="footer-column">
            <h4>PRODUCT</h4>
            <a>Features</a>
            <a>Integrations</a>
            <a>Enterprise</a>
            <a>Solutions</a>
          </div>

          <div className="footer-column">
            <h4>RESOURCES</h4>
            <a>API Docs</a>
            <a>Security</a>
            <a>Status</a>
            <a>Help Center</a>
          </div>

          <div className="footer-column">
            <h4>COMPANY</h4>
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
            <a>Careers</a>
            <a>Contact</a>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        <p>© 2026 AutoTrust Technologies. All rights reserved.</p>

        <div className="footer-bottom-links">
          <a>Privacy Policy</a>
          <a>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;