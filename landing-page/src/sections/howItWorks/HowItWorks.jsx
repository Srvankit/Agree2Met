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
  return (
    <section className="how-section" id="how">

      <div className="how-header">
        <h2>How AutoTrust Works</h2>
        <p>Create and manage agreements in just a few simple steps.</p>
      </div>

      <div className="how-container">

        {steps.map((step, index) => (
          <div className="how-card" key={index}>

            {/* TEXT */}
            <div className="how-text">
              <span className="step-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>

            {/* IMAGE */}
            <div className="how-image">
              <div className="image-box">
                <img src={step.img} alt={step.title} />
              </div>
            </div>

          </div>
        ))}

      </div>

      {/* 🔥 GUIDE LINK */}
      <div className="how-footer">
        <a href="#">View detailed guide →</a>
      </div>

    </section>
  );
}