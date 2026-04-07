import React from "react";
import "./how.css";

const steps = [
  {
    id: "01",
    title: "Fill in Your Details",
    desc: "Enter party details, terms, and agreement specifics using a simple guided form.",
    icon: "📝",
  },
  {
    id: "02",
    title: "Generate Agreement",
    desc: "AutoTrust instantly creates a structured, professional agreement.",
    icon: "⚡",
  },
  {
    id: "03",
    title: "Download or Share",
    desc: "Download your agreement or securely share it with others.",
    icon: "📤",
  },
];

const HowItWorks = () => {
  return (
    <section className="how-section">
      <div className="container">
        
        {/* Header */}
        <h2 className="title">How AutoTrust Works</h2>
        <p className="subtitle">
          Create and manage agreements in just a few simple steps.
        </p>

        {/* Cards */}
        <div className="cards">
          {steps.map((step) => (
            <div className="card" key={step.id}>
              
              <span className="step-number">{step.id}</span>

              <div className="icon">{step.icon}</div>

              <h3>{step.title}</h3>
              <p>{step.desc}</p>

              <div className="underline"></div>
            </div>
          ))}
        </div>

        {/* Bottom Link */}
        <div className="guide">
          <a href="#">View detailed guide →</a>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;