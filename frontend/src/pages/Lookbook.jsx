import { Link } from "react-router-dom";

import heroImage from "../assets/images/hero.jpg";

import product1 from "../assets/images/product-1.jpg";
import product1_2 from "../assets/images/product-1-2.jpg";
import product1_3 from "../assets/images/product-1-3.jpg";

import product2 from "../assets/images/product-2.jpg";
import product2_1 from "../assets/images/product-2-1.jpg";
import product2_2 from "../assets/images/product-2-2.jpg";

import product3 from "../assets/images/product-3.jpg";
import product3_1 from "../assets/images/product-3-1.jpg";

import product4 from "../assets/images/product-4.jpg";
import product4_1 from "../assets/images/product-4-1.jpg";

import collectionImage from "../assets/images/collection.jpg";

function Lookbook() {
  const looks = [
    {
      number: "01",
      title: "MISERY WORLD",
      image: heroImage,
      size: "look-large",
    },

    {
      number: "02",
      title: "KARMA",
      image: product1,
      images: [
        product1_2,product1_3,product3_1
      ],
      size: "look-small",
    },

    {
      number: "03",
      title: "HISTORY",
      image: product2,
      images: [
        product2_1,product2_2,product4_1
      ],
      size: "look-small",
    },

    {
      number: "04",
      title: "WAFFLE PROGRAMME",
      image: collectionImage,
      size: "look-large",
    },

    {
      number: "05",
      title: "DRAGON FLAME",
      image: product4,
      size: "look-small",
    },

    {
      number: "06",
      title: "STATIC",
      image: product3,
      size: "look-small",
    },
  ];

  return (
    <div className="lookbook-page">

      {/* =========================
          LOOKBOOK HEADER
      ========================= */}

      <section className="lookbook-header">

        <div>
          <p className="eyebrow">
            VISUAL JOURNAL
          </p>

          <h1>
            LOOKBOOK
          </h1>
        </div>

        <p>
          A visual exploration of the latest
          collection, textures, graphics and
          silhouettes.
        </p>

      </section>


      {/* =========================
          LOOKBOOK INTRO
      ========================= */}

      <section className="lookbook-intro">

        <span>
          CAMPAIGN 01
        </span>

        <h2>
          MISERY
          <br />
          WORLD
        </h2>

        <p>
          Movement. Texture. Repetition.
        </p>

      </section>


      {/* =========================
          LOOKBOOK GRID
      ========================= */}

      <section className="lookbook-grid">

        {looks.map((look) => (

          <article
            className={`look-card ${look.size}`}
            key={look.number}
          >

            {/* =========================
                IMAGE
            ========================= */}

            <div className="look-image">

              <img
                src={look.image}
                alt={look.title}
              />

              <span>
                {look.number}
              </span>

            </div>


            {/* =========================
                LOOK INFO
            ========================= */}

            <div className="look-info">

              <div>

                <p className="look-number">
                  {look.number}
                </p>

                <h3>
                  {look.title}
                </h3>

              </div>

              <Link to="/shop">
                SHOP LOOK →
              </Link>

            </div>


            {/* =========================
                ADDITIONAL IMAGES
                FOR KARMA
            ========================= */}

            {look.images &&
              look.images.length > 1 && (

                <div className="look-image-strip">

                  {look.images.map(
                    (image, index) => (

                      <div
                        className="look-strip-image"
                        key={index}
                      >

                        <img
                          src={image}
                          alt={`${look.title} view ${
                            index + 1
                          }`}
                        />

                      </div>

                    )
                  )}

                </div>

              )}

          </article>

        ))}

      </section>


      {/* =========================
          LOOKBOOK FOOTER
      ========================= */}

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