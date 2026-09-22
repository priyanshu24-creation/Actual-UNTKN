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
import api from "../services/api.js";

import logo from "../assets/images/logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [bannerEnabled, setBannerEnabled] =
    useState(true);

  const [bannerMessages, setBannerMessages] =
    useState([
      "FREE SHIPPING ON ORDERS ABOVE ₹999",
      "NEW DROP LIVE NOW",
      "EASY RETURNS",
    ]);

  const { totalItems } = useCart();

  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    let mounted = true;

    const loadRunningBanner = async () => {
      try {
        const response = await api.get(
          "/settings/running-banner"
        );

        if (!mounted) {
          return;
        }

        if (!response.data?.success) {
          return;
        }

        const settings =
          response.data?.settings;

        if (
          settings?.enabled !==
          undefined
        ) {
          setBannerEnabled(
            Boolean(settings.enabled)
          );
        }

        if (
          Array.isArray(
            settings?.messages
          )
        ) {
          const messages =
            settings.messages
              .map((message) =>
                String(
                  message || ""
                ).trim()
              )
              .filter(Boolean);

          if (messages.length > 0) {
            setBannerMessages(messages);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load running banner:",
          error
        );
      }
    };

    loadRunningBanner();

    return () => {
      mounted = false;
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const renderBannerMessages = () => {
    return bannerMessages.map(
      (message, index) => (
        <span
          key={`banner-${index}`}
        >
          {message}
          <span> • </span>
        </span>
      )
    );
  };

  return (
    <>
      <header className="site-header">
        {bannerEnabled && (
          <div className="announcement-bar">
            <div className="announcement-track">
              {renderBannerMessages()}
              {renderBannerMessages()}
            </div>
          </div>
        )}

        <div className="navbar">
          <div className="navbar-inner">
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

              <Link
                to="/contact"
                className={
                  isActive("/contact")
                    ? "active"
                    : ""
                }
              >
                CONTACT
              </Link>
            </nav>

            <div className="nav-actions">
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

              <Link
                to="/login"
                className={
                  isActive("/login")
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

      <div
        className={
          menuOpen
            ? "mobile-menu open"
            : "mobile-menu"
        }
      >
        <div className="mobile-menu-inner">
          <div className="mobile-menu-label">
            MENU
          </div>

          <nav className="mobile-nav-links">
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

            <Link
              to="/shop"
              onClick={closeMenu}
            >
              <span>02</span>
              NEW ARRIVALS
            </Link>

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

            <Link
              to="/contact"
              onClick={closeMenu}
              className={
                isActive("/contact")
                  ? "active"
                  : ""
              }
            >
              <span>06</span>
              CONTACT
            </Link>
          </nav>

          <div className="mobile-menu-actions">
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

            <Link
              to="/login"
              onClick={closeMenu}
            >
              <User
                size={17}
                strokeWidth={1.5}
              />
              ACCOUNT
            </Link>

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