import { Link } from "react-router-dom";

import heroImage from "../assets/images/hero.jpg";
import product1 from "../assets/images/product-1.jpg";
import product2 from "../assets/images/product-2.jpg";
import product3 from "../assets/images/product-3.jpg";
import product4 from "../assets/images/product-4.jpg";
import collectionImage from "../assets/images/collection.jpg";
import aboutImage from "../assets/images/about.jpg";

function Home() {
  return (
    <div className="home">

      {/* ================= HERO ================= */}

      <section
        className="hero"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-content">

          <p className="eyebrow">
            CAPSULE 01 — NEW COLLECTION
          </p>

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


      {/* ================= NEW ARRIVALS ================= */}

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

          {/* PRODUCT 1 */}

          <article className="product-card">

            <Link
              to="/product/1"
              className="product-image"
            >
              <img
                src={product1}
                alt="Karma graphic tee"
              />

              <button
                type="button"
                className="wishlist-button"
                onClick={(event) =>
                  event.preventDefault()
                }
              >
                ♡
              </button>
            </Link>

            <div className="product-info">

              <div>

                <h3>
                  KARMA
                </h3>

                <p>
                  GRAPHIC TEES
                </p>

              </div>

              <span>
                ₹549
              </span>

            </div>

          </article>


          {/* PRODUCT 2 */}

          <article className="product-card">

            <Link
              to="/product/2"
              className="product-image"
            >
              <img
                src={product2}
                alt="History graphic tee"
              />

              <button
                type="button"
                className="wishlist-button"
                onClick={(event) =>
                  event.preventDefault()
                }
              >
                ♡
              </button>

            </Link>

            <div className="product-info">

              <div>

                <h3>
                  HISTORY
                </h3>

                <p>
                  GRAPHIC TEES
                </p>

              </div>

              <span>
                ₹549
              </span>

            </div>

          </article>


          {/* PRODUCT 3 */}

          <article className="product-card">

            <Link
              to="/product/3"
              className="product-image"
            >
              <img
                src={product3}
                alt="Misery World thermal"
              />

              <button
                type="button"
                className="wishlist-button"
                onClick={(event) =>
                  event.preventDefault()
                }
              >
                ♡
              </button>

            </Link>

            <div className="product-info">

              <div>

                <h3>
                  MISERY WORLD
                </h3>

                <p>
                  THERMALS
                </p>

              </div>

              <span>
                ₹899
              </span>

            </div>

          </article>


          {/* PRODUCT 4 */}

          <article className="product-card">

            <Link
              to="/product/4"
              className="product-image"
            >
              <img
                src={product4}
                alt="Dragon Flame thermal"
              />

              <button
                type="button"
                className="wishlist-button"
                onClick={(event) =>
                  event.preventDefault()
                }
              >
                ♡
              </button>

            </Link>

            <div className="product-info">

              <div>

                <h3>
                  DRAGON FLAME
                </h3>

                <p>
                  THERMALS
                </p>

              </div>

              <span>
                ₹899
              </span>

            </div>

          </article>

        </div>

      </section>


      {/* ================= CAPSULE ================= */}

      <section
        className="capsule-section"
        style={{
          backgroundImage: `url(${collectionImage})`,
        }}
      >

        <div className="capsule-overlay"></div>

        <div className="capsule-content">

          <p className="eyebrow">
            CAPSULE 01
          </p>

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


      {/* ================= EDITORIAL ================= */}

      <section className="editorial-section">

        <div className="editorial-header">

          <div>

            <p className="eyebrow">
              EDITORIAL
            </p>

            <h2>
              CAMPAIGN 01
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

            <p className="eyebrow">
              CAMPAIGN 01
            </p>

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


    {/* ================= ABOUT ================= */}

<section className="about-section">

  <div className="about-label">
    <p>
      04 / THE LABEL
    </p>
  </div>

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


      {/* ================= NEWSLETTER ================= */}

      <section className="newsletter">

        <p>
          05 / THE LIST
        </p>

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