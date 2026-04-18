import React from "react";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-left">

          <div className="footer-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">AutoTrust</span>
          </div>

          <p className="footer-description">
            The smart platform for modern agreements and secure collaborations.
            Built for the next generation of digital trust.
          </p>

          {/* SOCIAL */}
          <div className="footer-icons">
            <span>🌐</span>
            <span>✉️</span>
            <span>🐦</span>
            <span>💼</span>
          </div>

        </div>

        {/* RIGHT */}
        <div className="footer-links">

          <div className="footer-column">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Integrations</a>
            <a href="#">Enterprise</a>
            <a href="#">Solutions</a>
          </div>

          <div className="footer-column">
            <h4>Resources</h4>
            <a href="#">API Docs</a>
            <a href="#">Security</a>
            <a href="#">Status</a>
            <a href="#">Help Center</a>
          </div>

          <div className="footer-column">
            <h4>Company</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>

        </div>

      </div>

      {/* DIVIDER */}
      <div className="footer-divider"></div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2026 AutoTrust Technologies. All rights reserved.</p>

        <div className="footer-bottom-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>

    </footer>
  );
};

<<<<<<< HEAD

export default Footer;

=======
export default Footer;
>>>>>>> 941c32dfebc0a2c4360c5eecdc15d1c758d84782
