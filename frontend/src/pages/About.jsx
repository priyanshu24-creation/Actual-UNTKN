import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Circle,
} from "lucide-react";

import logo from "../assets/images/logo.png";

const defaultAbout = {
  hero: {
    logo: "",
    eyebrow: "INDEPENDENT FASHION",
    heading: "MADE FOR\nTHE\nUNEXPECTED.",
    description:
      "An independent fashion label built around individuality, culture and everyday expression.",
  },

  manifesto: {
    number: "02",
    eyebrow: "OUR MANIFESTO",
    heading: "WE DON'T\nFOLLOW\nTHE CROWD.",
    paragraph1:
      "Fashion should feel personal. It should reflect where you've been, where you're going and everything that makes you different.",
    paragraph2:
      "We build collections around that idea — combining strong graphics, considered silhouettes and pieces made to be worn your way.",
  },

  principles: [
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
  ],

  statement: {
    eyebrow: "THE WAY WE WORK",
    heading: "LESS NOISE.\nMORE MEANING.",
    description:
      "From the first sketch to the final piece, every collection starts with an idea and develops through experimentation.",
  },

  cta: {
    eyebrow: "EXPLORE THE COLLECTION",
    heading: "FIND\nYOUR\nPIECE.",
    buttonText: "SHOP ALL",
    buttonLink: "/shop",
    image: "",
  },
};

function About() {
  const [about, setAbout] = useState(defaultAbout);

  useEffect(() => {
    try {
      const savedAbout = localStorage.getItem("untkn-about");

      if (savedAbout) {
        const parsedAbout = JSON.parse(savedAbout);

        setAbout({
          ...defaultAbout,
          ...parsedAbout,

          hero: {
            ...defaultAbout.hero,
            ...(parsedAbout.hero || {}),
          },

          manifesto: {
            ...defaultAbout.manifesto,
            ...(parsedAbout.manifesto || {}),
          },

          principles:
            parsedAbout.principles?.length
              ? parsedAbout.principles
              : defaultAbout.principles,

          statement: {
            ...defaultAbout.statement,
            ...(parsedAbout.statement || {}),
          },

          cta: {
            ...defaultAbout.cta,
            ...(parsedAbout.cta || {}),
          },
        });
      }
    } catch (error) {
      console.error(
        "Failed to load About content:",
        error
      );
    }
  }, []);

  const getHeadingLines = (heading = "") => {
    return heading
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const heroHeading = getHeadingLines(
    about.hero.heading
  );

  const manifestoHeading = getHeadingLines(
    about.manifesto.heading
  );

  const statementHeading = getHeadingLines(
    about.statement.heading
  );

  const ctaHeading = getHeadingLines(
    about.cta.heading
  );

  const aboutLogo =
    about.hero.logo || logo;

  return (
    <div className="about-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="about-hero">

        <div className="about-number about-logo">
          <img
            src={aboutLogo}
            alt="UNTKN logo"
          />
        </div>

        <div className="about-hero-content">

          <p className="eyebrow">
            {about.hero.eyebrow}
          </p>

          <h1>
            {heroHeading.map((line, index) => (
              <span key={index}>
                {line}

                {index <
                  heroHeading.length - 1 && (
                  <br />
                )}
              </span>
            ))}
          </h1>

          <p className="about-hero-description">
            {about.hero.description}
          </p>

        </div>
      </section>


      {/* =========================
          MANIFESTO
      ========================= */}

      <section className="about-manifesto">

        <div className="about-manifesto-number">
          {about.manifesto.number}
        </div>

        <div className="about-manifesto-content">

          <p className="eyebrow">
            {about.manifesto.eyebrow}
          </p>

          <h2>
            {manifestoHeading.map(
              (line, index) => (
                <span key={index}>
                  {line}

                  {index <
                    manifestoHeading.length - 1 && (
                    <br />
                  )}
                </span>
              )
            )}
          </h2>

          <p>
            {about.manifesto.paragraph1}
          </p>

          <p>
            {about.manifesto.paragraph2}
          </p>

        </div>
      </section>


      {/* =========================
          PRINCIPLES
      ========================= */}

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

          {about.principles.map(
            (principle, index) => (
              <article
                className="principle-card"
                key={
                  principle.number ||
                  index
                }
              >

                <span>
                  {principle.number}
                </span>

                <h3>
                  {principle.title}
                </h3>

                <p>
                  {principle.description}
                </p>

              </article>
            )
          )}

        </div>
      </section>


      {/* =========================
          STATEMENT
      ========================= */}

      <section className="about-statement">

        <Circle
          size={24}
          strokeWidth={1}
        />

        <p className="eyebrow">
          {about.statement.eyebrow}
        </p>

        <h2>
          {statementHeading.map(
            (line, index) => (
              <span key={index}>
                {line}

                {index <
                  statementHeading.length - 1 && (
                  <br />
                )}
              </span>
            )
          )}
        </h2>

        <p>
          {about.statement.description}
        </p>

      </section>


      {/* =========================
          CTA
      ========================= */}

      <section
        className="about-cta"
        style={
          about.cta.image
            ? {
                backgroundImage: `url("${about.cta.image}")`,
              }
            : undefined
        }
      >

        <div>

          <p className="eyebrow">
            {about.cta.eyebrow}
          </p>

          <h2>
            {ctaHeading.map(
              (line, index) => (
                <span key={index}>
                  {line}

                  {index <
                    ctaHeading.length - 1 && (
                    <br />
                  )}
                </span>
              )
            )}
          </h2>

        </div>

        <Link
          to={
            about.cta.buttonLink ||
            "/shop"
          }
        >
          {about.cta.buttonText ||
            "SHOP ALL"}

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