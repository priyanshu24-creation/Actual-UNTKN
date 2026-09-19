import { Link } from "react-router-dom";
import {
  ArrowRight,
  Circle,
  Sparkles,
} from "lucide-react";

function About() {
  const principles = [
    {
      number: "01",
      title: "INDIVIDUALITY",
      description:
        "We create pieces for people who build their own identity instead of following a formula.",
    },
    {
      number: "02",
      title: "EXPRESSION",
      description:
        "Every graphic, silhouette and detail is designed to become part of your personal language.",
    },
    {
      number: "03",
      title: "LIMITED RUNS",
      description:
        "We keep production focused and intentional, creating collections in limited quantities.",
    },
    {
      number: "04",
      title: "EVERYDAY",
      description:
        "Experimental ideas meet practical pieces designed to live in your everyday rotation.",
    },
  ];

  return (
    <div className="about-page">
      {/* HERO */}

      <section className="about-hero">
        <div className="about-hero-label">
          <p className="eyebrow">01 / THE LABEL</p>
        </div>

        <div className="about-hero-content">
          <p className="eyebrow">INDEPENDENT FASHION</p>

          <h1>
            MADE FOR
            <br />
            THE
            <br />
            UNEXPECTED.
          </h1>

          <p className="about-hero-description">
            An independent fashion label built around
            individuality, culture and everyday
            expression.
          </p>
        </div>
      </section>

      {/* MANIFESTO */}

      <section className="about-manifesto">
        <div className="about-manifesto-number">
          02
        </div>

        <div className="about-manifesto-content">
          <p className="eyebrow">
            OUR MANIFESTO
          </p>

          <h2>
            WE DON'T
            <br />
            FOLLOW
            <br />
            THE CROWD.
          </h2>

          <p>
            Fashion should feel personal. It should
            reflect where you've been, where you're
            going and everything that makes you
            different.
          </p>

          <p>
            We build collections around that idea —
            combining strong graphics, considered
            silhouettes and pieces made to be worn
            your way.
          </p>
        </div>
      </section>

      {/* PRINCIPLES */}

      <section className="about-principles">
        <div className="about-section-heading">
          <p className="eyebrow">
            03 / WHAT WE BELIEVE
          </p>

          <h2>
            OUR
            <br />
            PRINCIPLES.
          </h2>
        </div>

        <div className="principles-grid">
          {principles.map((principle) => (
            <article
              className="principle-card"
              key={principle.number}
            >
              <span>
                {principle.number}
              </span>

              <h3>{principle.title}</h3>

              <p>
                {principle.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* STATEMENT */}

      <section className="about-statement">
        <Circle
          size={24}
          strokeWidth={1}
        />

        <p className="eyebrow">
          THE WAY WE WORK
        </p>

        <h2>
          LESS NOISE.
          <br />
          MORE MEANING.
        </h2>

        <p>
          From the first sketch to the final piece,
          every collection starts with an idea and
          develops through experimentation.
        </p>
      </section>

      {/* CTA */}

      <section className="about-cta">
        <div>
          <p className="eyebrow">
            EXPLORE THE COLLECTION
          </p>

          <h2>
            FIND
            <br />
            YOUR
            <br />
            PIECE.
          </h2>
        </div>

        <Link to="/shop">
          SHOP ALL
          <ArrowRight
            size={18}
            strokeWidth={1.5}
          />
        </Link>
      </section>
    </div>
  );
}

export default About;