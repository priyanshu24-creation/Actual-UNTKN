import { useState } from "react";
import {
  Save,
  ImagePlus,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

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

function AdminAbout() {
  const [about, setAbout] = useState(() => {
    try {
      const savedAbout = localStorage.getItem("untkn-about");

      if (!savedAbout) {
        return defaultAbout;
      }

      const parsedAbout = JSON.parse(savedAbout);

      return {
        ...defaultAbout,

        hero: {
          ...defaultAbout.hero,
          ...(parsedAbout.hero || {}),
        },

        manifesto: {
          ...defaultAbout.manifesto,
          ...(parsedAbout.manifesto || {}),
        },

        principles:
          Array.isArray(parsedAbout.principles) &&
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
      };
    } catch (error) {
      console.error(
        "Failed to load saved About settings:",
        error
      );

      return defaultAbout;
    }
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* =====================================================
     HERO
  ===================================================== */

  const handleHeroChange = (event) => {
    const { name, value } = event.target;

    setAbout((current) => ({
      ...current,

      hero: {
        ...current.hero,
        [name]: value,
      },
    }));

    setSaved(false);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setAbout((current) => ({
      ...current,

      hero: {
        ...current.hero,
        logo: imageUrl,
      },
    }));

    setSaved(false);
  };

  /* =====================================================
     MANIFESTO
  ===================================================== */

  const handleManifestoChange = (event) => {
    const { name, value } = event.target;

    setAbout((current) => ({
      ...current,

      manifesto: {
        ...current.manifesto,
        [name]: value,
      },
    }));

    setSaved(false);
  };

  /* =====================================================
     PRINCIPLES
  ===================================================== */

  const handlePrincipleChange = (
    index,
    field,
    value
  ) => {
    setAbout((current) => ({
      ...current,

      principles: current.principles.map(
        (principle, principleIndex) =>
          principleIndex === index
            ? {
                ...principle,
                [field]: value,
              }
            : principle
      ),
    }));

    setSaved(false);
  };

  /* =====================================================
     STATEMENT
  ===================================================== */

  const handleStatementChange = (event) => {
    const { name, value } = event.target;

    setAbout((current) => ({
      ...current,

      statement: {
        ...current.statement,
        [name]: value,
      },
    }));

    setSaved(false);
  };

  /* =====================================================
     CTA
  ===================================================== */

  const handleCtaChange = (event) => {
    const { name, value } = event.target;

    setAbout((current) => ({
      ...current,

      cta: {
        ...current.cta,
        [name]: value,
      },
    }));

    setSaved(false);
  };

  const handleCtaImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setAbout((current) => ({
      ...current,

      cta: {
        ...current.cta,
        image: imageUrl,
      },
    }));

    setSaved(false);
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      await new Promise((resolve) =>
        setTimeout(resolve, 800)
      );

      localStorage.setItem(
        "untkn-about",
        JSON.stringify(about)
      );

      console.log(
        "About settings saved:",
        about
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Failed to save About settings:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     RESET
  ===================================================== */

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all About content to the default content?"
    );

    if (!confirmed) return;

    localStorage.removeItem("untkn-about");

    setAbout({
      ...defaultAbout,

      hero: {
        ...defaultAbout.hero,
      },

      manifesto: {
        ...defaultAbout.manifesto,
      },

      principles: defaultAbout.principles.map(
        (principle) => ({
          ...principle,
        })
      ),

      statement: {
        ...defaultAbout.statement,
      },

      cta: {
        ...defaultAbout.cta,
      },
    });

    setSaved(false);
  };

  return (
    <section className="admin-about-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-page-header">

        <div>
          <p className="admin-eyebrow">
            CONTENT MANAGEMENT
          </p>

          <h1>About</h1>

          <p>
            Manage all content displayed on the About
            page of the customer website.
          </p>
        </div>

        <div className="admin-about-header-actions">

          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            RESET
          </button>

          <button
            type="button"
            className="admin-primary-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <RotateCcw
                  size={15}
                  className="admin-about-spin"
                />
                SAVING...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={15} />
                SAVED
              </>
            ) : (
              <>
                <Save size={15} />
                SAVE CHANGES
              </>
            )}
          </button>

        </div>
      </div>


      {/* =================================================
          01 — HERO
      ================================================= */}

      <div className="admin-about-panel">

        <div className="admin-about-panel-header">

          <div className="admin-about-section-number">
            01
          </div>

          <div>
            <p className="admin-panel-eyebrow">
              HERO
            </p>

            <h2>Hero Section</h2>

            <p>
              Manage the main introduction displayed at
              the top of the About page.
            </p>
          </div>

        </div>


        <div className="admin-about-hero-grid">

          {/* LOGO */}

          <div className="admin-about-logo-upload">

            <div className="admin-about-logo-preview">

              {about.hero.logo ? (
                <img
                  src={about.hero.logo}
                  alt="UNTKN logo"
                />
              ) : (
                <div className="admin-about-logo-placeholder">

                  <ImagePlus size={26} />

                  <span>
                    Website Logo
                  </span>

                </div>
              )}

            </div>

            <label className="admin-upload-button">

              <ImagePlus size={15} />

              {about.hero.logo
                ? "CHANGE LOGO"
                : "UPLOAD LOGO"}

              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                hidden
              />

            </label>

          </div>


          {/* HERO FIELDS */}

          <div className="admin-about-fields">

            <div className="admin-settings-field full">

              <label>
                EYEBROW
              </label>

              <input
                type="text"
                name="eyebrow"
                value={about.hero.eyebrow}
                onChange={handleHeroChange}
              />

            </div>


            <div className="admin-settings-field full">

              <label>
                HEADING
              </label>

              <textarea
                name="heading"
                rows={4}
                value={about.hero.heading}
                onChange={handleHeroChange}
              />

              <small>
                Use a new line to create a line break.
              </small>

            </div>


            <div className="admin-settings-field full">

              <label>
                DESCRIPTION
              </label>

              <textarea
                name="description"
                rows={4}
                value={about.hero.description}
                onChange={handleHeroChange}
              />

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          02 — MANIFESTO
      ================================================= */}

      <div className="admin-about-panel">

        <div className="admin-about-panel-header">

          <div className="admin-about-section-number">
            02
          </div>

          <div>

            <p className="admin-panel-eyebrow">
              MANIFESTO
            </p>

            <h2>Our Manifesto</h2>

            <p>
              Manage the manifesto content shown on the
              About page.
            </p>

          </div>

        </div>


        <div className="admin-about-fields">

          <div className="admin-about-two-columns">

            <div className="admin-settings-field">

              <label>
                SECTION NUMBER
              </label>

              <input
                type="text"
                name="number"
                value={about.manifesto.number}
                onChange={handleManifestoChange}
              />

            </div>


            <div className="admin-settings-field">

              <label>
                EYEBROW
              </label>

              <input
                type="text"
                name="eyebrow"
                value={about.manifesto.eyebrow}
                onChange={handleManifestoChange}
              />

            </div>

          </div>


          <div className="admin-settings-field full">

            <label>
              HEADING
            </label>

            <textarea
              name="heading"
              rows={4}
              value={about.manifesto.heading}
              onChange={handleManifestoChange}
            />

          </div>


          <div className="admin-settings-field full">

            <label>
              PARAGRAPH 1
            </label>

            <textarea
              name="paragraph1"
              rows={4}
              value={about.manifesto.paragraph1}
              onChange={handleManifestoChange}
            />

          </div>


          <div className="admin-settings-field full">

            <label>
              PARAGRAPH 2
            </label>

            <textarea
              name="paragraph2"
              rows={4}
              value={about.manifesto.paragraph2}
              onChange={handleManifestoChange}
            />

          </div>

        </div>

      </div>


      {/* =================================================
          03 — PRINCIPLES
      ================================================= */}

      <div className="admin-about-panel">

        <div className="admin-about-panel-header">

          <div className="admin-about-section-number">
            03
          </div>

          <div>

            <p className="admin-panel-eyebrow">
              WHAT WE BELIEVE
            </p>

            <h2>Our Principles</h2>

            <p>
              Manage the four principles displayed on
              the About page.
            </p>

          </div>

        </div>


        <div className="admin-about-principles">

          {about.principles.map(
            (principle, index) => (

              <div
                className="admin-about-principle"
                key={`${principle.number}-${index}`}
              >

                <div className="admin-about-principle-number">
                  {principle.number}
                </div>


                <div className="admin-about-principle-fields">

                  <div className="admin-settings-field full">

                    <label>
                      TITLE
                    </label>

                    <input
                      type="text"
                      value={principle.title}
                      onChange={(event) =>
                        handlePrincipleChange(
                          index,
                          "title",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="admin-settings-field full">

                    <label>
                      DESCRIPTION
                    </label>

                    <textarea
                      rows={4}
                      value={principle.description}
                      onChange={(event) =>
                        handlePrincipleChange(
                          index,
                          "description",
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>


      {/* =================================================
          04 — STATEMENT
      ================================================= */}

      <div className="admin-about-panel">

        <div className="admin-about-panel-header">

          <div className="admin-about-section-number">
            04
          </div>

          <div>

            <p className="admin-panel-eyebrow">
              STATEMENT
            </p>

            <h2>The Way We Work</h2>

            <p>
              Manage the statement section displayed
              below the principles.
            </p>

          </div>

        </div>


        <div className="admin-about-fields">

          <div className="admin-settings-field full">

            <label>
              EYEBROW
            </label>

            <input
              type="text"
              name="eyebrow"
              value={about.statement.eyebrow}
              onChange={handleStatementChange}
            />

          </div>


          <div className="admin-settings-field full">

            <label>
              HEADING
            </label>

            <textarea
              name="heading"
              rows={3}
              value={about.statement.heading}
              onChange={handleStatementChange}
            />

          </div>


          <div className="admin-settings-field full">

            <label>
              DESCRIPTION
            </label>

            <textarea
              name="description"
              rows={4}
              value={about.statement.description}
              onChange={handleStatementChange}
            />

          </div>

        </div>

      </div>


      {/* =================================================
          05 — CTA
      ================================================= */}

      <div className="admin-about-panel">

        <div className="admin-about-panel-header">

          <div className="admin-about-section-number">
            05
          </div>

          <div>

            <p className="admin-panel-eyebrow">
              CALL TO ACTION
            </p>

            <h2>Explore Collection</h2>

            <p>
              Manage the final CTA section displayed on
              the About page.
            </p>

          </div>

        </div>


        <div className="admin-about-hero-grid">

          {/* CTA IMAGE */}

          <div className="admin-about-logo-upload">

            <div className="admin-about-logo-preview">

              {about.cta.image ? (
                <img
                  src={about.cta.image}
                  alt="About CTA"
                />
              ) : (
                <div className="admin-about-logo-placeholder">

                  <ImagePlus
                    size={28}
                    strokeWidth={1.3}
                  />

                  <span>
                    CTA IMAGE
                  </span>

                </div>
              )}

            </div>


            <label className="admin-upload-button">

              <ImagePlus size={15} />

              {about.cta.image
                ? "CHANGE IMAGE"
                : "UPLOAD IMAGE"}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleCtaImageChange}
              />

            </label>

          </div>


          {/* CTA CONTENT */}

          <div className="admin-about-fields">

            <div className="admin-settings-field full">

              <label>
                EYEBROW
              </label>

              <input
                type="text"
                name="eyebrow"
                value={about.cta.eyebrow}
                onChange={handleCtaChange}
              />

            </div>


            <div className="admin-settings-field full">

              <label>
                HEADING
              </label>

              <textarea
                name="heading"
                rows={4}
                value={about.cta.heading}
                onChange={handleCtaChange}
              />

              <small>
                Use a new line to create a line break.
              </small>

            </div>


            <div className="admin-about-two-columns">

              <div className="admin-settings-field">

                <label>
                  BUTTON TEXT
                </label>

                <input
                  type="text"
                  name="buttonText"
                  value={about.cta.buttonText}
                  onChange={handleCtaChange}
                />

              </div>


              <div className="admin-settings-field">

                <label>
                  BUTTON LINK
                </label>

                <input
                  type="text"
                  name="buttonLink"
                  value={about.cta.buttonLink}
                  onChange={handleCtaChange}
                />

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          BOTTOM SAVE
      ================================================= */}

      <div className="admin-about-bottom-actions">

        <button
          type="button"
          className="admin-secondary-button"
          onClick={handleReset}
        >
          <RotateCcw size={15} />
          RESET
        </button>


        <button
          type="button"
          className="admin-primary-button"
          onClick={handleSave}
          disabled={saving}
        >

          {saving ? (
            <>
              <RotateCcw
                size={15}
                className="admin-about-spin"
              />
              SAVING...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={15} />
              SAVED
            </>
          ) : (
            <>
              <Save size={15} />
              SAVE CHANGES
            </>
          )}

        </button>

      </div>

    </section>
  );
}

export default AdminAbout;