import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">

        <div className="footer-brand">
          <h2>UNTKN</h2>

          <p>
            Independent fashion.
            <br />
            Designed for the unexpected.
          </p>
        </div>

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

      </div>

      {/* Instagram */}
      <a
        href="https://www.instagram.com/untknofficialstore/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="footer-instagram"
      >
        Instagram
      </a>

      <div className="footer-bottom">
        <span>© 2026 UNTKN</span>

        <span>
          ALL RIGHTS RESERVED
        </span>
      </div>

    </footer>
  );
}

export default Footer;