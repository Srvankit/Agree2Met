  import "./testimonials.css";

  const testimonials = [
    {
      name: "Sarah ",
      role: "COO, FinTech Core",
      text: "Agree2Met has cut our contract turnaround time from 5 days to 4 hours. The interface is simply stunning.",
      img: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      name: "David Miller",
      role: "Legal Counsel, Nexus Global",
      text: "The version control and audit logs are lifesavers during legal audits. Most reliable platform we've used.",
      img: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "David Miller",
      role: "Legal Counsel, Nexus Global",
      text: "The version control and audit logs are lifesavers during legal audits. Most reliable platform we've used.",
      img: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "David Miller",
      role: "Legal Counsel, Nexus Global",
      text: "The version control and audit logs are lifesavers during legal audits. Most reliable platform we've used.",
      img: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "David Miller",
      role: "Legal Counsel, Nexus Global",
      text: "The version control and audit logs are lifesavers during legal audits. Most reliable platform we've used.",
      img: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "Elena Rodriguez",
      role: "Founder, Bloom Agency",
      text: "Finally, a tool that focuses on the agreement lifecycle. The automation is brilliant.",
      img: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      name: "Arjun Mehta",
      role: "Startup Founder",
      text: "Clean UI, super fast workflow, and very reliable. AutoTrust feels premium.",
      img: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
      name: "Priya Sharma",
      role: "Freelancer",
      text: "This platform simplified my contract workflow completely. Highly recommended!",
      img: "https://randomuser.me/api/portraits/women/65.jpg"
    },
    {
      name: "Rohan Kapoor",
      role: "Product Manager",
      text: "Very intuitive UI and powerful features. Saves a lot of time.",
      img: "https://randomuser.me/api/portraits/men/52.jpg"
    }
  ];

  export default function Testimonials() {
    return (
      <section className="testimonials-section" id="testimonials">

        <div className="testimonials-header">
          <h2>What Our Users Say</h2>
          <p>Trusted by professionals and teams worldwide</p>
        </div>

                <div className="testimonial-scroll">

          <div className="testimonial-track">
            {[...testimonials, ...testimonials].map((t, index) => (
              <div className="testimonial-card" key={index}>

                <div className="testimonial-top">
                  <span className="quote">“</span>
                  <div className="stars">★★★★★</div>
                </div>

                <p className="testimonial-text">{t.text}</p>

                <div className="user-info">
                  <img src={t.img} alt={t.name} />
                  <div className="user-meta">
                    <h4>{t.name}</h4>
                    <span>{t.role}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </section>
    );
  }