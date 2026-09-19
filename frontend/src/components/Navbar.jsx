import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  User,
} from "lucide-react";

import { useCart } from "../context/CartContext";

// Logo image
import logo from "../assets/images/logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { totalItems } = useCart();

  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent page scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="site-header">

        {/* ================= ANNOUNCEMENT BAR ================= */}
        <div className="announcement-bar">
          <div className="announcement-track">

            <span>
              FREE SHIPPING ON ORDERS ABOVE ₹999
            </span>

            <span>•</span>

            <span>
              NEW DROP LIVE NOW
            </span>

            <span>•</span>

            <span>
              EASY RETURNS
            </span>

            <span>•</span>

            {/* Duplicate content for continuous animation */}
            <span>
              FREE SHIPPING ON ORDERS ABOVE ₹999
            </span>

            <span>•</span>

            <span>
              NEW DROP LIVE NOW
            </span>

            <span>•</span>

            <span>
              EASY RETURNS
            </span>

            <span>•</span>

          </div>
        </div>

        {/* ================= NAVBAR ================= */}
        <div className="navbar">

          <div className="navbar-inner">

            {/* ================= MOBILE MENU BUTTON ================= */}
            <button
              type="button"
              className="mobile-menu-button"
              onClick={toggleMenu}
              aria-label={
                menuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X
                  size={20}
                  strokeWidth={1.5}
                />
              ) : (
                <Menu
                  size={20}
                  strokeWidth={1.5}
                />
              )}
            </button>

            {/* ================= LOGO + NAME ================= */}
            <Link
              to="/"
              className="logo"
              onClick={closeMenu}
              aria-label="UNTKN Home"
            >
              <img
                src={logo}
                alt="UNTKN logo"
                className="logo-image"
              />

              <span className="logo-name">
                UNTKN
              </span>
            </Link>

            {/* ================= DESKTOP NAVIGATION ================= */}
            <nav className="nav-links">

              <Link
                to="/shop"
                className={
                  isActive("/shop")
                    ? "active"
                    : ""
                }
              >
                SHOP
              </Link>

              <Link
                to="/collections"
                className={
                  isActive("/collections")
                    ? "active"
                    : ""
                }
              >
                COLLECTIONS
              </Link>

              <Link
                to="/lookbook"
                className={
                  isActive("/lookbook")
                    ? "active"
                    : ""
                }
              >
                LOOKBOOK
              </Link>

              <Link
                to="/about"
                className={
                  isActive("/about")
                    ? "active"
                    : ""
                }
              >
                ABOUT
              </Link>

            </nav>

            {/* ================= DESKTOP ACTIONS ================= */}
            <div className="nav-actions">

              {/* SEARCH */}
              <Link
                to="/search"
                className={
                  isActive("/search")
                    ? "nav-action-button active"
                    : "nav-action-button"
                }
                aria-label="Search"
                title="Search"
              >
                <Search
                  size={18}
                  strokeWidth={1.5}
                />
              </Link>

              {/* WISHLIST */}
              <Link
                to="/wishlist"
                className={
                  isActive("/wishlist")
                    ? "nav-action-button active"
                    : "nav-action-button"
                }
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart
                  size={18}
                  strokeWidth={1.5}
                />
              </Link>

              {/* ACCOUNT */}
              <Link
                to="/account"
                className={
                  isActive("/account")
                    ? "nav-action-button active"
                    : "nav-action-button"
                }
                aria-label="Account"
                title="Account"
              >
                <User
                  size={18}
                  strokeWidth={1.5}
                />
              </Link>

              {/* SHOPPING BAG */}
              <Link
                to="/cart"
                className={
                  isActive("/cart")
                    ? "nav-action-button bag-button active"
                    : "nav-action-button bag-button"
                }
                aria-label={`Shopping bag with ${totalItems} items`}
                title="Shopping bag"
              >
                <ShoppingBag
                  size={18}
                  strokeWidth={1.5}
                />

                {totalItems > 0 && (
                  <span className="cart-count">
                    {totalItems > 99
                      ? "99+"
                      : totalItems}
                  </span>
                )}
              </Link>

            </div>

          </div>

        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={
          menuOpen
            ? "mobile-menu open"
            : "mobile-menu"
        }
      >

        <div className="mobile-menu-inner">

          {/* MENU LABEL */}
          <div className="mobile-menu-label">
            MENU
          </div>

          {/* MOBILE NAVIGATION */}
          <nav className="mobile-nav-links">

            {/* SHOP */}
            <Link
              to="/shop"
              onClick={closeMenu}
              className={
                isActive("/shop")
                  ? "active"
                  : ""
              }
            >
              <span>01</span>
              SHOP
            </Link>

            {/* NEW ARRIVALS */}
            <Link
              to="/shop"
              onClick={closeMenu}
            >
              <span>02</span>
              NEW ARRIVALS
            </Link>

            {/* COLLECTIONS */}
            <Link
              to="/collections"
              onClick={closeMenu}
              className={
                isActive("/collections")
                  ? "active"
                  : ""
              }
            >
              <span>03</span>
              COLLECTIONS
            </Link>

            {/* LOOKBOOK */}
            <Link
              to="/lookbook"
              onClick={closeMenu}
              className={
                isActive("/lookbook")
                  ? "active"
                  : ""
              }
            >
              <span>04</span>
              LOOKBOOK
            </Link>

            {/* ABOUT */}
            <Link
              to="/about"
              onClick={closeMenu}
              className={
                isActive("/about")
                  ? "active"
                  : ""
              }
            >
              <span>05</span>
              ABOUT
            </Link>

          </nav>

          {/* ================= MOBILE QUICK ACTIONS ================= */}
          <div className="mobile-menu-actions">

            {/* SEARCH */}
            <Link
              to="/search"
              onClick={closeMenu}
            >
              <Search
                size={17}
                strokeWidth={1.5}
              />
              SEARCH
            </Link>

            {/* WISHLIST */}
            <Link
              to="/wishlist"
              onClick={closeMenu}
            >
              <Heart
                size={17}
                strokeWidth={1.5}
              />
              WISHLIST
            </Link>

            {/* ACCOUNT */}
            <Link
              to="/account"
              onClick={closeMenu}
            >
              <User
                size={17}
                strokeWidth={1.5}
              />
              ACCOUNT
            </Link>

            {/* CART */}
            <Link
              to="/cart"
              onClick={closeMenu}
            >
              <ShoppingBag
                size={17}
                strokeWidth={1.5}
              />

              BAG

              {totalItems > 0 && (
                <span>
                  ({totalItems})
                </span>
              )}
            </Link>

          </div>

          {/* ================= MOBILE FOOTER ================= */}
          <div className="mobile-menu-footer">

            <span>
              EST. 2026
            </span>

            <span>
              INDEPENDENT LABEL
            </span>

          </div>

        </div>

      </div>

      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}
    </>
  );
}

export default Navbar;