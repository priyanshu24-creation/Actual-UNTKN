import { Link } from "react-router-dom";

import product1 from "../assets/images/product-1.jpg";
import product2 from "../assets/images/product-2.jpg";
import product3 from "../assets/images/product-3.jpg";
import product4 from "../assets/images/product-4.jpg";
import collectionImage from "../assets/images/collection.jpg";

function Collections() {
  const collections = [
    {
      id: 1,
      title: "NEW ARRIVALS",
      subtitle: "LATEST DROP",
      description:
        "Fresh pieces designed for the new season.",
      image: product1,
      link: "/shop",
    },

    {
      id: 2,
      title: "ESSENTIALS",
      subtitle: "EVERYDAY WEAR",
      description:
        "Clean silhouettes made for everyday rotation.",
      image: product2,
      link: "/shop?category=Hoodies",
    },

    {
      id: 3,
      title: "WAFFLE PROGRAMME",
      subtitle: "CAPSULE 01",
      description:
        "Heavyweight thermals built for colder days.",
      image: collectionImage,
      link: "/shop?category=Thermals",
    },

    {
      id: 4,
      title: "GRAPHIC SERIES",
      subtitle: "LIMITED RUN",
      description:
        "Statement graphics created in short runs.",
      image: product3,
      link: "/shop?category=T-Shirts",
    },
  ];

  return (
    <div className="collections-page">

      {/* ================= HEADER ================= */}

      <section className="collections-header">

        <div>

          <p className="eyebrow">
            THE WORLD OF THE LABEL
          </p>

          <h1>
            COLLECTIONS
          </h1>

        </div>

        <p className="collections-intro">
          Explore our latest drops, capsule releases
          and essential pieces.
        </p>

      </section>


      {/* ================= COLLECTION GRID ================= */}

      <section className="collections-grid">

        {collections.map((collection, index) => (

          <article
            className={
              index === 0
                ? "collection-card featured"
                : "collection-card"
            }
            key={collection.id}
          >

            <Link
              to={collection.link}
              className="collection-image"
            >

              <img
                src={collection.image}
                alt={collection.title}
              />

              <div className="collection-number">
                {String(index + 1).padStart(2, "0")}
              </div>

            </Link>


            <div className="collection-info">

              <div>

                <p className="collection-label">
                  {collection.subtitle}
                </p>

                <h2>
                  {collection.title}
                </h2>

              </div>

              <Link
                to={collection.link}
                className="collection-link"
              >
                EXPLORE →
              </Link>

            </div>


            <p className="collection-description">
              {collection.description}
            </p>

          </article>

        ))}

      </section>


      {/* ================= CATEGORY BAR ================= */}

      <section className="category-section">

        <div className="category-section-header">

          <p className="eyebrow">
            SHOP BY CATEGORY
          </p>

          <h2>
            FIND YOUR
            <br />
            PIECE.
          </h2>

        </div>


        <div className="category-links">

          <Link to="/shop">
            <span>01</span>
            ALL PRODUCTS
          </Link>

          <Link to="/shop?category=T-Shirts">
            <span>02</span>
            T-SHIRTS
          </Link>

          <Link to="/shop?category=Hoodies">
            <span>03</span>
            HOODIES
          </Link>

          <Link to="/shop?category=Thermals">
            <span>04</span>
            THERMALS
          </Link>

          <Link to="/shop?category=Bottomwear">
            <span>05</span>
            BOTTOMWEAR
          </Link>

        </div>

      </section>


      {/* ================= FEATURED COLLECTION ================= */}

      <section
        className="featured-collection"
        style={{
          backgroundImage: `url(${collectionImage})`,
        }}
      >

        <div className="featured-collection-overlay"></div>

        <div className="featured-collection-content">

          <p className="eyebrow">
            CAPSULE 01
          </p>

          <h2>
            THE WAFFLE
            <br />
            PROGRAMME
          </h2>

          <p>
            Textured layers.
            <br />
            Heavyweight construction.
            <br />
            Everyday comfort.
          </p>

          <Link to="/shop?category=Thermals">
            SHOP THERMALS →
          </Link>

        </div>

      </section>

    </div>
  );
}

export default Collections;