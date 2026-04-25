import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./hero.css";

export default function Hero() {
  const [openVideo, setOpenVideo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("hero-loaded");
    return () => document.body.classList.remove("hero-loaded");
  }, []);

  return (
    <section className="hero">

      {/* BACKGROUND ORBS */}
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      <div className="hero-content">

        <motion.p
          className="hero-tag"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          SMART & SECURE AGREEMENT PLATFORM
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Create Professional Agreements <br />
          <span>in Minutes</span>, Not Hours
        </motion.h1>

        <motion.p
          className="hero-subtext"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          AutoTrust helps you create, manage, and share professionally structured agreements with speed, clarity and confidence.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            className="primary-btn"
            onClick={() => navigate("/dashboard")}
          >
            Get Started Free →
          </button>

          <button
            className="secondary-btn"
            onClick={() => setOpenVideo(true)}
          >
            ▶ Watch Demo
          </button>
        </motion.div>

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
              allow="autoplay; encrypted-media"
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