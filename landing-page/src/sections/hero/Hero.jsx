import { useState } from "react";
import "./hero.css";

const Hero = () => {
  const [open, setOpen] = useState(false);

  return (
    <section className="hero" id="home">

      {/* ===== BACKGROUND VIDEO ===== */}
      <video
        className="hero-video"
        src="/images/hero-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ===== OVERLAY ===== */}
      <div className="hero-overlay"></div>

      {/* ===== CONTENT ===== */}
      <div className="hero-container">

        <p className="hero-tag">
          SECURE & SMART AGREEMENT PLATFORM
        </p>

        <h1 className="hero-heading">
          Create Agreements in <span>Minutes</span>, Not Hours
        </h1>

        <p className="hero-subtext">
          AutoTrust helps you generate, manage, and share professional agreements effortlessly.
        </p>

        <button className="hero-btn">
          Get Started Free →
        </button>

        {/* ===== PREVIEW ===== */}
        <div className="hero-preview">
          <img src="/images/preview.png" alt="preview" />

          <div className="play" onClick={() => setOpen(true)}>
            ▶
          </div>
        </div>

      </div>

      {/* ===== VIDEO MODAL ===== */}
      {open && (
        <div className="video-modal" onClick={() => setOpen(false)}>

          <div
            className="video-container"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="close" onClick={() => setOpen(false)}>
              ×
            </span>

            <video
              src="/images/hero-bg.mp4"
              controls
              autoPlay
            />
          </div>

        </div>
      )}
    </section>
  );
};

export default Hero;