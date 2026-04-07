import { useState, useEffect } from "react";
import "./hero.css";

export default function Hero() {
  const [openVideo, setOpenVideo] = useState(false);

  useEffect(() => {
    document.body.classList.add("hero-loaded");
  }, []);

  return (
    <section className="hero">

      {/* BACKGROUND ORBS */}
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      <div className="hero-content">

        <p className="hero-tag fade-up">SECURE & SMART AGREEMENT PLATFORM</p>

        <h1 className="fade-up delay-1">
          Create Agreements in <br />
          <span>Minutes</span>, Not Hours
        </h1>

        <p className="hero-subtext fade-up delay-2">
          AutoTrust helps you generate, manage, and share professional
          agreements effortlessly.
        </p>

        <div className="hero-buttons fade-up delay-3">
          <button className="primary-btn">Get Started Free →</button>

          <button
            className="secondary-btn"
            onClick={() => setOpenVideo(true)}
          >
            ▶ Watch Demo
          </button>
        </div>

      </div>

      {/* VIDEO MODAL */}
      {openVideo && (
        <div className="video-modal" onClick={() => setOpenVideo(false)}>
          <div
            className="video-container"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Demo Video"
              frameBorder="0"
              allowFullScreen
            ></iframe>

            <button
              className="close-btn"
              onClick={() => setOpenVideo(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </section>
  );
}