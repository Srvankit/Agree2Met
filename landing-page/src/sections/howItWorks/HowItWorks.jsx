import { useState } from "react";
import "./how.css";

const steps = [
  {
    title: "Fill in Your Details",
    desc: "Enter party details, terms, and agreement specifics using a simple guided form.",
    img: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b"
  },
  {
    title: "Generate Agreement",
    desc: "AutoTrust instantly creates a structured, professional agreement.",
    img: "https://images.unsplash.com/photo-1581090700227-4c4f50f4c4c4"
  },
  {
    title: "Download or Share",
    desc: "Download your agreement or securely share it with others.",
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
  }
];

export default function HowItWorks() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <section className="how-section" id="how">

        {/* HEADER */}
        <div className="how-header">
          <p className="section-tag">HOW IT WORKS</p>
          <h2>How AutoTrust Works</h2>
          <p>Create and manage agreements in just a few simple steps.</p>
        </div>

        {/* STEPS */}
        <div className="how-container">
          {steps.map((step, index) => (
            <div
              className={`how-row ${index % 2 !== 0 ? "reverse" : ""}`}
              key={index}
            >

              {/* IMAGE */}
              <div className="how-image">
                <div className="image-box">
                  <img src={step.img} alt={step.title} />
                </div>
              </div>

              {/* TEXT */}
              <div className="how-text">
                <span className="step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>

            </div>
          ))}
        </div>

        {/* GUIDE BUTTON */}
        <div className="guide-wrapper">
          <button
            className="guide-btn"
            onClick={() => setShowGuide(true)}
          >
            <span>View Detailed Guide</span>
            <span className="arrow">→</span>
          </button>
        </div>

      </section>

      {/* GUIDE POPUP */}
      {showGuide && (
        <div className="guide-modal-overlay">
          <div className="guide-modal">

            <button
              className="guide-close"
              onClick={() => setShowGuide(false)}
            >
              ✕
            </button>

            <h2>Product Guide</h2>

            <p className="guide-subtitle">
              Complete walkthrough of AutoTrust platform.
            </p>

            <div className="guide-scroll">

              <div className="guide-section">
                <h3>Overview</h3>
                <p>
                  AutoTrust is a streamlined SaaS platform for creating,
                  managing, and signing agreements digitally — built for
                  speed, security, and collaboration.
                </p>
              </div>

              <div className="guide-section">
                <h3>Getting Started</h3>

                <div className="guide-card">
                  <h4>Create an Account</h4>
                  <p>
                    Sign up using email or continue with Google.
                  </p>
                </div>

                <div className="guide-card">
                  <h4>Login</h4>
                  <p>
                    Access your dashboard securely from any device.
                  </p>
                </div>
              </div>

              <div className="guide-section">
                <h3>Workspace Dashboard</h3>

                <ul>
                  <li>Track agreements in real time</li>
                  <li>Monitor updates and status</li>
                  <li>Access quick actions instantly</li>
                </ul>
              </div>

              <div className="guide-section">
                <h3>Create & Send Agreements</h3>

                <ul>
                  <li>Create agreement instantly</li>
                  <li>Add terms and participants</li>
                  <li>Send agreements in seconds</li>
                </ul>
              </div>

              <div className="guide-section">
                <h3>Agreement Lifecycle</h3>

                <div className="guide-grid">

                  <div className="guide-mini-card">
                    <span>Draft</span>
                    <p>Create and edit agreements.</p>
                  </div>

                  <div className="guide-mini-card">
                    <span>Pending</span>
                    <p>Waiting for signatures.</p>
                  </div>

                  <div className="guide-mini-card">
                    <span>Completed</span>
                    <p>Successfully signed.</p>
                  </div>

                  <div className="guide-mini-card">
                    <span>Archived</span>
                    <p>Stored securely.</p>
                  </div>

                </div>
              </div>

              <div className="guide-section">
                <h3>Digital Signing</h3>

                <ul>
                  <li>Open agreement instantly</li>
                  <li>Review terms cleanly</li>
                  <li>Sign digitally in one click</li>
                </ul>
              </div>

              <div className="guide-section">
                <h3>Notifications</h3>

                <ul>
                  <li>Signature requests</li>
                  <li>Completion alerts</li>
                  <li>Status updates</li>
                </ul>
              </div>

              <div className="guide-section">
                <h3>Security</h3>

                <ul>
                  <li>End-to-end encryption</li>
                  <li>Secure storage</li>
                  <li>Privacy-first system</li>
                </ul>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}