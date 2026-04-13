import "./features.css";

const features = [
  {
    title: "Easy Agreement Creation",
    desc: "Create agreements quickly using a simple, guided form interface.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
  },
  {
    title: "Instant Generation",
    desc: "Generate structured, professional agreements in seconds.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
  },
  {
    title: "Secure Storage",
    desc: "Your agreements are safely stored and easily accessible anytime.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
  },
];

const Features = () => {
  return (
    <section className="features-section" id="features">

      {/* HEADER */}
      <div className="features-header">
        <p className="section-tag">FEATURES</p>

        <h2 className="features-title">
          Everything You Need to <span>Build Trust</span>
        </h2>

        <p className="features-subtitle">
          AutoTrust provides powerful tools to create, manage, and share agreements effortlessly.
        </p>
      </div>

      {/* PREMIUM ALTERNATING ROWS */}
      <div className="features-container">
        {features.map((feature, index) => (
          <div
            className={`feature-row ${index % 2 !== 0 ? "reverse" : ""}`}
            key={index}
          >
            
            {/* IMAGE CARD (NO TEXT INSIDE) */}
            <div className="feature-image">
              <img src={feature.image} alt={feature.title} />
            </div>

            {/* TEXT OUTSIDE */}
            <div className="feature-text">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};

export default Features;