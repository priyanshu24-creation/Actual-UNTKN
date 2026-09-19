import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setNewsletterStatus("Please enter your email address.");
      return;
    }

    try {
      setNewsletterLoading(true);
      setNewsletterStatus("");

      const response = await api.post("/newsletter/subscribe", {
        email: trimmedEmail,
        source: "Website Footer",
      });

      setNewsletterStatus(
        response.data?.message || "Successfully subscribed."
      );

      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);

      setNewsletterStatus(
        error.response?.data?.message ||
          "Unable to subscribe. Please try again."
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="footer">

      {/* =========================
          FOOTER TOP
      ========================= */}

      <div className="footer-top">

        {/* BRAND */}

        <div className="footer-brand">
          <h2>UNTKN</h2>

          <p>
            Independent fashion.
            <br />
            Designed for the unexpected.
          </p>
        </div>


        {/* SHOP */}

        <div className="footer-column">
          <h3>SHOP</h3>

          <Link to="/shop">
            New Arrivals
          </Link>

          <Link to="/shop?category=T-Shirts">
            T-Shirts
          </Link>

          <Link to="/shop?category=Hoodies">
            Hoodies
          </Link>

          <Link to="/collections">
            Collections
          </Link>
        </div>


        {/* INFO */}

        <div className="footer-column">
          <h3>INFO</h3>

          <Link to="/about">
            About
          </Link>

          <Link to="/contact">
            Contact
          </Link>

          <Link to="/shop">
            Shipping
          </Link>

          <Link to="/shop">
            Returns
          </Link>
        </div>


        {/* EXPLORE */}

        <div className="footer-column">
          <h3>EXPLORE</h3>

          <Link to="/lookbook">
            Lookbook
          </Link>

          <Link to="/wishlist">
            Wishlist
          </Link>

          <Link to="/account">
            Account
          </Link>

          <Link to="/cart">
            Bag
          </Link>
        </div>


        {/* NEWSLETTER */}

        <div className="footer-column footer-newsletter">

          <h3>NEWSLETTER</h3>

          <p>
            Subscribe for new drops,
            <br />
            collections and updates.
          </p>

          <form
            className="footer-newsletter-form"
            onSubmit={handleNewsletterSubmit}
          >

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setNewsletterStatus("");
              }}
              placeholder="Your email address"
              aria-label="Email address"
              autoComplete="email"
              disabled={newsletterLoading}
              required
            />

            <button
              type="submit"
              disabled={newsletterLoading}
            >
              {newsletterLoading ? "..." : "SUBSCRIBE"}
            </button>

          </form>

          {newsletterStatus && (
            <p className="footer-newsletter-status">
              {newsletterStatus}
            </p>
          )}

        </div>

      </div>


      {/* =========================
          INSTAGRAM
      ========================= */}

      <a
        href="https://www.instagram.com/untknofficialstore/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="footer-instagram"
      >
        Instagram
      </a>


      {/* =========================
          FOOTER BOTTOM
      ========================= */}

      <div className="footer-bottom">

        <span>
          © 2026 UNTKN
        </span>

        <span>
          ALL RIGHTS RESERVED
        </span>

      </div>

    </footer>
  );
}

export default Footer;