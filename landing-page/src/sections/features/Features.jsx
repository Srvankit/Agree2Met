import "./features.css";

const features = [
  {
    title: "Effortless Agreement Creation",
    desc: "Create agreements quickly using a guided interface designed for clarity and accuracy.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
  },
  {
    title: "Instant Document Generation",
    desc: "Generate structured, professional agreements in seconds without manual drafting.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
  },
  {
    title: "Secure & Reliable Storage",
    desc: "Safely store your agreements and access them anytime, anywhere with complete security.",
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
          Everything You Need to <span>Create and Manage Agreements</span>
        </h2>

        <p className="features-subtitle">
          Agree2Met provides smart, reliable tools to create, organize, and manage professional agreements with ease.
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