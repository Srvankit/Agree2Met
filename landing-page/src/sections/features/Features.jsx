import React from "react";
import "./features.css";

const features = [
  {
    title: "Easy Agreement Creation",
    desc: "Create agreements quickly using a simple, guided form interface.",
    icon: "📝",
    image: "https://via.placeholder.com/300x180",
  },
  {
    title: "Instant Generation",
    desc: "Generate structured, professional agreements in seconds.",
    icon: "⚡",
    image: "https://via.placeholder.com/300x180",
  },
  {
    title: "Secure Storage",
    desc: "Your agreements are safely stored and easily accessible anytime.",
    icon: "🔒",
    image: "https://via.placeholder.com/300x180",
  },
];

const Features = () => {
  return (
    <section className="features-section">
      <div className="container">
        
        {/* Header */}
        <h2 className="features-title">
          Everything You Need to Build Trust
        </h2>
        <p className="features-subtitle">
          AutoTrust provides powerful tools to create, manage, and share agreements effortlessly.
        </p>

        {/* Cards */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              
              <div className="feature-icon">{feature.icon}</div>

              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>

              <div className="feature-image">
                <img src={feature.image} alt={feature.title} />
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;