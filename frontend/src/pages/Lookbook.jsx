import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import heroImage from "../assets/images/hero.jpg";

function Lookbook() {
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLookbook = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/lookbook/active"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load Lookbook"
          );
        }

        const apiLooks = Array.isArray(
          data.looks
        )
          ? data.looks
          : [];

        const formattedLooks =
          apiLooks.map((look, index) => ({
            id: look.id,
            number: String(
              index + 1
            ).padStart(2, "0"),
            title:
              look.title ||
              "LOOKBOOK",
            subtitle:
              look.subtitle || "",
            description:
              look.description || "",
            image:
              look.image_url ||
              look.image ||
              heroImage,
            link:
              look.link_url ||
              "/shop",
            size:
              index === 0 ||
              index === 3
                ? "look-large"
                : "look-small",
          }));

        setLooks(formattedLooks);
      } catch (err) {
        console.error(
          "Lookbook fetch error:",
          err
        );

        setError(
          "Unable to load the latest Lookbook."
        );

        setLooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLookbook();
  }, []);

  if (loading) {
    return (
      <div className="lookbook-page">
        <section className="lookbook-header">
          <div>
            <p className="eyebrow">
              VISUAL JOURNAL
            </p>

            <h1>LOOKBOOK</h1>
          </div>

          <p>
            A visual exploration of the latest
            collection, textures, graphics and
            silhouettes.
          </p>
        </section>

        <section
          className="lookbook-grid"
          style={{
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Loading Lookbook...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="lookbook-page">
      <section className="lookbook-header">
        <div>
          <p className="eyebrow">
            VISUAL JOURNAL
          </p>

          <h1>LOOKBOOK</h1>
        </div>

        <p>
          A visual exploration of the latest
          collection, textures, graphics and
          silhouettes.
        </p>
      </section>

      {error && (
        <div
          style={{
            padding: "12px 20px",
            marginBottom: "20px",
            textAlign: "center",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {looks.length > 0 && (
        <>
          <section className="lookbook-intro">
            <span>
              {looks[0].subtitle ||
                "CAMPAIGN 01"}
            </span>

            <h2>
              {looks[0].title}
            </h2>

            <p>
              {looks[0].description ||
                "Movement. Texture. Repetition."}
            </p>
          </section>

          <section className="lookbook-grid">
            {looks.map(
              (look, index) => (
                <article
                  className={`look-card ${
                    look.size
                  }`}
                  key={look.id}
                >
                  <div className="look-image">
                    <img
                      src={look.image}
                      alt={look.title}
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      onError={(event) => {
                        event.currentTarget.src =
                          heroImage;
                      }}
                    />

                    <span>
                      {look.number}
                    </span>
                  </div>

                  <div className="look-info">
                    <div>
                      <p className="look-number">
                        {look.number}
                      </p>

                      <h3>
                        {look.title}
                      </h3>

                      {look.subtitle && (
                        <p>
                          {look.subtitle}
                        </p>
                      )}

                      {look.description && (
                        <p>
                          {
                            look.description
                          }
                        </p>
                      )}
                    </div>

                    <Link
                      to={
                        look.link ||
                        "/shop"
                      }
                    >
                      SHOP LOOK →
                    </Link>
                  </div>
                </article>
              )
            )}
          </section>
        </>
      )}

      {looks.length === 0 && (
        <section
          style={{
            padding: "80px 20px",
            textAlign: "center",
          }}
        >
          <h2>
            No Lookbook items available
          </h2>

          <p>
            Check back soon for the latest
            collection.
          </p>
        </section>
      )}

      <section className="lookbook-footer">
        <p className="eyebrow">
          THE COLLECTION
        </p>

        <h2>
          WEAR IT
          <br />
          YOUR WAY.
        </h2>

        <Link to="/shop">
          SHOP COLLECTION →
        </Link>
      </section>
    </div>
  );
}

export default Lookbook;