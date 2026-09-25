import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
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
  const [about, setAbout] =
    useState(defaultAbout);

  useEffect(() => {
    try {
      const savedAbout =
        localStorage.getItem(
          "untkn-about"
        );

      if (!savedAbout) {
        return;
      }

      const parsedAbout =
        JSON.parse(savedAbout);

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
          Array.isArray(
            parsedAbout.principles
          ) &&
          parsedAbout.principles.length
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
    } catch (error) {
      console.error(
        "Failed to load About content:",
        error
      );
    }
  }, []);

  const getHeadingLines = (
    heading = ""
  ) => {
    return String(heading)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const heroHeading =
    getHeadingLines(
      about.hero.heading
    );

  const manifestoHeading =
    getHeadingLines(
      about.manifesto.heading
    );

  const statementHeading =
    getHeadingLines(
      about.statement.heading
    );

  const ctaHeading =
    getHeadingLines(
      about.cta.heading
    );

  const aboutLogo =
    about.hero.logo || logo;

  const ctaImage =
    about.cta.image || "";

  return (
    <main className="about-redesign">

      {/* =================================
          HERO
      ================================= */}

      <section className="about-redesign-hero">

        <div className="about-hero-topline">
          <span>
            UNTKN / ABOUT
          </span>

          <span>
            EST. 2026
          </span>
        </div>

        <div className="about-hero-main">

          <div className="about-hero-brand">
            <img
              src={aboutLogo}
              alt="UNTKN"
            />
          </div>

          <div className="about-hero-copy">

            <p className="about-redesign-eyebrow">
              {about.hero.eyebrow}
            </p>

            <h1>
              {heroHeading.map(
                (line, index) => (
                  <span
                    key={`${line}-${index}`}
                  >
                    {line}
                  </span>
                )
              )}
            </h1>

            <p className="about-hero-text">
              {about.hero.description}
            </p>

          </div>

        </div>

        <div className="about-hero-bottom">

          <span>
            SCROLL TO EXPLORE
          </span>

          <ArrowDown
            size={16}
            strokeWidth={1.4}
          />

        </div>

      </section>


      {/* =================================
          MANIFESTO
      ================================= */}

      <section className="about-redesign-manifesto">

        <div className="about-manifesto-meta">

          <span className="about-redesign-number">
            {about.manifesto.number}
          </span>

          <span>
            MANIFESTO
          </span>

        </div>

        <div className="about-manifesto-main">

          <p className="about-redesign-eyebrow">
            {about.manifesto.eyebrow}
          </p>

          <h2>
            {manifestoHeading.map(
              (line, index) => (
                <span
                  key={`${line}-${index}`}
                >
                  {line}
                </span>
              )
            )}
          </h2>

          <div className="about-manifesto-text">

            <p>
              {about.manifesto.paragraph1}
            </p>

            <p>
              {about.manifesto.paragraph2}
            </p>

          </div>

        </div>

      </section>


      {/* =================================
          PRINCIPLES
      ================================= */}

      <section className="about-redesign-principles">

        <div className="about-principles-heading">

          <div>
            <p className="about-redesign-eyebrow">
              03 / WHAT WE BELIEVE
            </p>

            <h2>
              OUR
              <br />
              PRINCIPLES.
            </h2>
          </div>

          <p className="about-principles-intro">
            Four ideas guide every
            collection we create.
          </p>

        </div>

        <div className="about-principles-grid">

          {about.principles.map(
            (principle, index) => (
              <article
                className="about-principle"
                key={
                  principle.number ||
                  index
                }
              >

                <div className="about-principle-top">
                  <span>
                    {String(
                      principle.number ||
                        index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <ArrowRight
                    size={16}
                    strokeWidth={1.2}
                  />
                </div>

                <div className="about-principle-content">

                  <h3>
                    {principle.title}
                  </h3>

                  <p>
                    {principle.description}
                  </p>

                </div>

              </article>
            )
          )}

        </div>

      </section>


      {/* =================================
          STATEMENT
      ================================= */}

      <section className="about-redesign-statement">

        <div className="about-statement-index">
          04
        </div>

        <div className="about-statement-center">

          <p className="about-redesign-eyebrow">
            {about.statement.eyebrow}
          </p>

          <h2>
            {statementHeading.map(
              (line, index) => (
                <span
                  key={`${line}-${index}`}
                >
                  {line}
                </span>
              )
            )}
          </h2>

          <p className="about-statement-description">
            {about.statement.description}
          </p>

        </div>

      </section>


      {/* =================================
          CTA / SHOP
      ================================= */}

      <section className="about-redesign-cta">

        <div
          className={
            ctaImage
              ? "about-cta-image has-image"
              : "about-cta-image"
          }
          style={
            ctaImage
              ? {
                  backgroundImage:
                    `url("${ctaImage}")`,
                }
              : undefined
          }
        >

          {!ctaImage && (
            <div className="about-cta-placeholder">
              UNTKN
            </div>
          )}

          <div className="about-cta-overlay" />

          <div className="about-cta-content">

            <p className="about-redesign-eyebrow">
              {about.cta.eyebrow}
            </p>

            <h2>
              {ctaHeading.map(
                (line, index) => (
                  <span
                    key={`${line}-${index}`}
                  >
                    {line}
                  </span>
                )
              )}
            </h2>

            <Link
              to={
                about.cta.buttonLink ||
                "/shop"
              }
              className="about-shop-button"
            >
              <span>
                {about.cta.buttonText ||
                  "SHOP ALL"}
              </span>

              <ArrowRight
                size={17}
                strokeWidth={1.5}
              />
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

export default About;