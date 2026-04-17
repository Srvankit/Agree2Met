import "./preview.css";
import { motion } from "framer-motion";

export default function Preview() {
  return (
    <section className="preview-section" id="preview">

      <div className="preview-container">

        {/* LEFT CONTENT */}
        <motion.div
          className="preview-content"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >

          <span className="preview-tag">
            PRODUCT PREVIEW
          </span>

          <h2>
            Experience AutoTrust <br />
            <span>in Action</span>
          </h2>

          <p className="preview-desc">
            Create, manage, and share agreements seamlessly with a clean,
            intuitive interface built for speed and trust.
          </p>

          <ul className="preview-points">
            <li>
              <span>⚡</span> Instant agreement generation
            </li>
            <li>
              <span>🔒</span> Secure & reliable workflow
            </li>
            <li>
              <span>📄</span> Clean structured documents
            </li>
          </ul>

          <div className="preview-buttons">
            <button className="primary-btn">
              Get Started
            </button>
            <button className="secondary-btn">
              View Demo
            </button>
          </div>

        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          className="preview-image"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >

          <div className="image-wrapper">
            <img
              src="/images/preview.png"
              alt="AutoTrust Dashboard Preview"
            />
          </div>

          {/* FLOATING CARDS (REFINED) */}
          {/* FLOATING TAGS CLOUD */}
            <div className="floating-cloud">

              <div className="floating-card card-1">⚡ Fast Processing</div>
              <div className="floating-card card-2">🔒 Secure System</div>
              <div className="floating-card card-3">📄 Smart Templates</div>
              <div className="floating-card card-4">⚙️ Automation</div>
              <div className="floating-card card-5">🔗 Easy Sharing</div>
              <div className="floating-card card-6">📊 Analytics</div>
              <div className="floating-card card-7">🧠 AI Drafting</div>
              <div className="floating-card card-8">☁️ Cloud Sync</div>
              <div className="floating-card card-9">🛡️ Data Protection</div>
              <div className="floating-card card-10">⚡ Instant Export</div>
              <div className="floating-card card-11">📁 Organized Docs</div>
              <div className="floating-card card-12">🔍 Smart Search</div>

            </div>

          {/* NEW: subtle glow */}
          <div className="preview-glow"></div>

        </motion.div>

      </div>

    </section>
  );
}