import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import api from "../services/api";

import heroImage from "../assets/images/hero.jpg";
import collectionImage from "../assets/images/collection.jpg";
import aboutImage from "../assets/images/about.jpg";

function Home() {
  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const handleWishlist = (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
  };

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await api.get("/products");

        const data = response.data;

        const rawProducts =
          data?.products ||
          data?.data?.products ||
          data?.data ||
          [];

        if (!Array.isArray(rawProducts)) {
          throw new Error("Invalid products response");
        }

        const latestProducts = [...rawProducts]
          .filter(
            (product) =>
              product &&
              (product.is_active === undefined ||
                Number(product.is_active) === 1)
          )
          .sort((a, b) => {
            const dateA = new Date(
              a.created_at || a.createdAt || 0
            ).getTime();

            const dateB = new Date(
              b.created_at || b.createdAt || 0
            ).getTime();

            if (dateA && dateB) {
              return dateB - dateA;
            }

            return Number(b.id || 0) - Number(a.id || 0);
          })
          .slice(0, 4);

        const productsWithImages = await Promise.all(
          latestProducts.map(async (product) => {
            let image = product.image_url || product.image || "";

            try {
              if (product.id) {
                const imageResponse = await api.get(
                  `/products/${product.id}/images`
                );

                const imageData = imageResponse.data;

                const images =
                  imageData?.images ||
                  imageData?.data?.images ||
                  imageData?.data ||
                  [];

                if (Array.isArray(images) && images.length > 0) {
                  const firstImage = images[0];

                  image =
                    firstImage?.image_url ||
                    firstImage?.url ||
                    firstImage?.secure_url ||
                    image;
                }
              }
            } catch (imageError) {
              console.warn(
                `Failed to load image for product ${product.id}:`,
                imageError
              );
            }

            return {
              ...product,
              image,
              category:
                product.category_name ||
                product.category ||
                product.category_name_value ||
                "UNTKN",
              price:
                product.sale_price ??
                product.price ??
                product.original_price ??
                0,
              alt:
                product.name ||
                product.title ||
                "UNTKN product",
            };
          })
        );

        if (mounted) {
          setProducts(productsWithImages);
        }
      } catch (error) {
        console.error("Failed to load homepage products:", error);

        if (mounted) {
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1>
            MISERY
            <br />
            WORLD
          </h1>

          <p className="hero-description">
            Heavyweight pieces. Hand-drawn graphics.
            <br />
            Made in short runs.
          </p>

          <div className="hero-actions">
            <Link
              to="/shop"
              className="hero-button"
            >
              SHOP COLLECTION
            </Link>

            <Link
              to="/lookbook"
              className="text-button"
            >
              EXPLORE LOOKBOOK →
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">
              LATEST DROP
            </p>

            <h2>
              NEW ARRIVALS
            </h2>
          </div>

          <Link to="/shop">
            VIEW ALL →
          </Link>
        </div>

        <div className="product-grid">
          {loadingProducts ? (
            <div className="product-loading">
              Loading latest products...
            </div>
          ) : products.length === 0 ? (
            <div className="product-loading">
              No products available right now.
            </div>
          ) : (
            products.map((product) => {
              const wishlisted = isInWishlist(product.id);

              return (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="product-image"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.alt}
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        UNTKN
                      </div>
                    )}

                    <button
                      type="button"
                      className={`wishlist-button ${
                        wishlisted ? "active" : ""
                      }`}
                      onClick={(event) =>
                        handleWishlist(event, product)
                      }
                      aria-label={
                        wishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                    >
                      <Heart
                        size={18}
                        strokeWidth={1.6}
                        fill={
                          wishlisted
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </Link>

                  <div className="product-info">
                    <div>
                      <h3>
                        {product.name ||
                          product.title ||
                          "UNTKN PRODUCT"}
                      </h3>

                      <p>
                        {product.category}
                      </p>
                    </div>

                    <span>
                      ₹
                      {Number(product.price || 0).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section
        className="capsule-section"
        style={{
          backgroundImage: `url(${collectionImage})`,
        }}
      >
        <div className="capsule-overlay"></div>

        <div className="capsule-content">
          <h2>
            THE WAFFLE
            <br />
            PROGRAMME
          </h2>

          <p>
            Heavyweight thermals built for everyday wear.
            <br />
            Produced in short runs.
          </p>

          <Link to="/shop">
            SHOP COLLECTION →
          </Link>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-header">
          <div>
            <p className="eyebrow">
              EDITORIAL
            </p>

            <h2>
              FLAME
              <br />
              WAFFLES
            </h2>
          </div>

          <Link to="/lookbook">
            FULL LOOKBOOK →
          </Link>
        </div>

        <div className="editorial-grid">
          <div className="editorial-large">
            <img
              src={heroImage}
              alt="Fashion campaign"
            />
          </div>

          <div className="editorial-text">
            <h3>
              MISERY
              <br />
              WORLD
            </h3>

            <p>
              A study in movement,
              texture and repetition.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-label"></div>

        <div className="about-content">
          <div className="about-text">
            <h2>
              WE DON'T
              <br />
              FOLLOW
              <br />
              THE CROWD.
            </h2>

            <p>
              A new generation of fashion built around
              individuality, expression and culture.
            </p>
          </div>

          <div className="about-image">
            <img
              src={aboutImage}
              alt="UNTKN fashion collection"
            />
          </div>
        </div>
      </section>

      <section className="newsletter">
        <h2>
          STAY IN
          <br />
          THE LOOP.
        </h2>

        <form
          className="newsletter-form"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <input
            type="email"
            placeholder="YOUR EMAIL ADDRESS"
            aria-label="Email address"
            required
          />

          <button type="submit">
            JOIN →
          </button>
        </form>
      </section>
    </div>
  );
}

export default Home;