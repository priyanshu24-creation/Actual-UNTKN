import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Layers } from "lucide-react";

import api from "../services/api";

import product1 from "../assets/images/product-1.jpg";
import product2 from "../assets/images/product-2.jpg";
import product3 from "../assets/images/product-3.jpg";
import product4 from "../assets/images/product-4.jpg";
import collectionImage from "../assets/images/collection.jpg";

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ==========================================================
  FALLBACK IMAGES
  ==========================================================
  Used only when an admin collection does not have an image_url.
  */

  const fallbackImages = useMemo(
    () => [
      product1,
      product2,
      collectionImage,
      product3,
      product4,
    ],
    []
  );

  /*
  ==========================================================
  LOAD COLLECTIONS
  ==========================================================
  */

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/collections");

        const data = response.data;

        const loadedCollections =
          data?.collections ||
          data?.data?.collections ||
          data?.data ||
          [];

        if (!Array.isArray(loadedCollections)) {
          throw new Error(
            "Invalid collections response from server."
          );
        }

        /*
        ------------------------------------------------------
        Only display ACTIVE collections on customer side.
        Admin can control this using Show/Hide.
        ------------------------------------------------------
        */

        const activeCollections =
          loadedCollections.filter(
            (collection) =>
              Boolean(collection?.is_active)
          );

        if (!cancelled) {
          setCollections(activeCollections);
        }
      } catch (requestError) {
        console.error(
          "Collections page error:",
          requestError
        );

        if (!cancelled) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load collections."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  ==========================================================
  GET COLLECTION IMAGE
  ==========================================================
  */

  const getCollectionImage = (
    collection,
    index
  ) => {
    if (
      collection?.image_url &&
      typeof collection.image_url === "string" &&
      collection.image_url.trim()
    ) {
      return collection.image_url;
    }

    return fallbackImages[
      index % fallbackImages.length
    ];
  };

  /*
  ==========================================================
  GET COLLECTION LINK
  ==========================================================
  */

  const getCollectionLink = (collection) => {
    if (!collection?.slug) {
      return "/shop";
    }

    return `/shop?collection=${encodeURIComponent(
      collection.slug
    )}`;
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <main className="collections-page">

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
            Explore our latest drops, capsule
            releases and essential pieces.
          </p>
        </section>

        <section className="collections-empty">
          <Layers
            size={36}
            strokeWidth={1.2}
          />

          <h2>
            LOADING COLLECTIONS
          </h2>

          <p>
            Fetching the latest collections.
          </p>
        </section>

      </main>
    );
  }

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  if (error) {
    return (
      <main className="collections-page">

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
            Explore our latest drops, capsule
            releases and essential pieces.
          </p>
        </section>

        <section className="collections-empty">

          <AlertCircle
            size={36}
            strokeWidth={1.2}
          />

          <h2>
            UNABLE TO LOAD COLLECTIONS
          </h2>

          <p>
            {error}
          </p>

          <Link to="/shop">
            CONTINUE SHOPPING →
          </Link>

        </section>

      </main>
    );
  }

  /*
  ==========================================================
  EMPTY
  ==========================================================
  */

  if (collections.length === 0) {
    return (
      <main className="collections-page">

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
            Explore our latest drops, capsule
            releases and essential pieces.
          </p>

        </section>

        <section className="collections-empty">

          <Layers
            size={36}
            strokeWidth={1.2}
          />

          <h2>
            NO COLLECTIONS AVAILABLE
          </h2>

          <p>
            New collections will appear here
            when they are published.
          </p>

          <Link to="/shop">
            SHOP ALL PRODUCTS →
          </Link>

        </section>

      </main>
    );
  }

  /*
  ==========================================================
  MAIN COLLECTIONS PAGE
  ==========================================================
  */

  return (
    <main className="collections-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

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
          Explore our latest drops, capsule
          releases and essential pieces.
        </p>

      </section>


      {/* =====================================================
          COLLECTION GRID
      ===================================================== */}

      <section className="collections-grid">

        {collections.map(
          (collection, index) => {

            const image =
              getCollectionImage(
                collection,
                index
              );

            const link =
              getCollectionLink(
                collection
              );

            const subtitle =
              index === 0
                ? "LATEST DROP"
                : "COLLECTION";

            return (
              <article
                className={
                  index === 0
                    ? "collection-card featured"
                    : "collection-card"
                }
                key={collection.id}
              >

                {/* IMAGE */}

                <Link
                  to={link}
                  className="collection-image"
                >

                  <img
                    src={image}
                    alt={
                      collection.name ||
                      "UNTKN Collection"
                    }
                    loading={
                      index === 0
                        ? "eager"
                        : "lazy"
                    }
                    onError={(event) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        fallbackImages[
                          index %
                            fallbackImages.length
                        ];
                    }}
                  />

                  <div className="collection-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                </Link>


                {/* COLLECTION INFO */}

                <div className="collection-info">

                  <div>

                    <p className="collection-label">
                      {subtitle}
                    </p>

                    <h2>
                      {collection.name}
                    </h2>

                  </div>

                  <Link
                    to={link}
                    className="collection-link"
                  >
                    EXPLORE →
                  </Link>

                </div>


                {/* DESCRIPTION */}

                <p className="collection-description">
                  {collection.description ||
                    "Explore the latest pieces from UNTKN."}
                </p>

              </article>
            );
          }
        )}

      </section>


      {/* =====================================================
          CATEGORY BAR
      ===================================================== */}

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


      {/* =====================================================
          FEATURED COLLECTION
          Uses the first active database collection.
      ===================================================== */}

      {collections.length > 0 && (
        <section
          className="featured-collection"
          style={{
            backgroundImage: `url(${getCollectionImage(
              collections[0],
              0
            )})`,
          }}
        >

          <div className="featured-collection-overlay"></div>

          <div className="featured-collection-content">

            <p className="eyebrow">
              {collections[0].slug
                ? collections[0].slug
                    .replace(/-/g, " ")
                    .toUpperCase()
                : "FEATURED COLLECTION"}
            </p>

            <h2>
              {collections[0].name}
            </h2>

            <p>
              {collections[0].description ||
                "Explore the latest collection from UNTKN."}
            </p>

            <Link
              to={getCollectionLink(
                collections[0]
              )}
            >
              EXPLORE COLLECTION →
            </Link>

          </div>

        </section>
      )}

    </main>
  );
}

export default Collections;