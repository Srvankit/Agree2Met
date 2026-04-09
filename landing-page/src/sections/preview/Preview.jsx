import "./preview.css";

export default function Preview() {
  return (
    <section className="preview-section" id="preview">

      <div className="preview-container">

        {/* LEFT CONTENT */}
        <div className="preview-content">

          <span className="preview-tag">
            PRODUCT PREVIEW
          </span>

          <h2>
            Experience AutoTrust <br />
            <span>in Action</span>
          </h2>

          <p>
            Create, manage, and share agreements seamlessly with a clean,
            intuitive interface built for speed and trust.
          </p>

          <ul className="preview-points">
            <li>⚡ Instant agreement generation</li>
            <li>🔒 Secure & reliable workflow</li>
            <li>📄 Clean structured documents</li>
          </ul>

          <div className="preview-buttons">
            <button className="primary-btn">
              Get Started
            </button>
            <button className="secondary-btn">
              View Demo
            </button>
          </div>

        </div>

        {/* RIGHT IMAGE */}
        <div className="preview-image">
          <div className="image-wrapper">
            <img src="/images/preview.png" alt="Preview UI" />
          </div>

          {/* Floating cards (premium feel) */}
          <div className="floating-card card-1">
            ⚡ Fast Processing
          </div>

          <div className="floating-card card-2">
            🔒 Secure System
          </div>

        </div>

      </div>

    </section>
  );
}