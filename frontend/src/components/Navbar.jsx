import { useCallback, useEffect, useState } from "react";
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

const DEFAULT_MESSAGES = [
  "FREE SHIPPING ON ORDERS ABOVE ₹999",
  "NEW DROP LIVE NOW",
  "EASY RETURNS",
];

const normalizeMessages = (settings) => {
  if (!settings) {
    return DEFAULT_MESSAGES;
  }

  let messages = [];

  if (Array.isArray(settings.messages)) {
    messages = settings.messages;
  } else {
    messages = [
      settings.message_1,
      settings.message_2,
      settings.message_3,
    ];
  }

  const normalized = messages
    .map((message) =>
      typeof message === "string"
        ? message.trim()
        : ""
    )
    .filter(Boolean);

  if (normalized.length === 0) {
    return DEFAULT_MESSAGES;
  }

  return normalized;
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerMessages, setBannerMessages] =
    useState(DEFAULT_MESSAGES);

  const { totalItems } = useCart();
  const location = useLocation();

  const loadRunningBanner = useCallback(async () => {
    try {
      const response = await api.get(
        "/settings/running-banner",
        {
          params: {
            _: Date.now(),
          },
        }
      );

      const data = response?.data;

      if (!data?.success) {
        return;
      }

      const settings = data?.settings;

      if (!settings) {
        return;
      }

      const messages = normalizeMessages(settings);

      setBannerEnabled(
        settings.enabled !== undefined
          ? Boolean(settings.enabled)
          : true
      );

      setBannerMessages(messages);
    } catch (error) {
      console.error(
        "Failed to load running banner:",
        error
      );
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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

  useEffect(() => {
    loadRunningBanner();

    const handleBannerUpdate = () => {
      loadRunningBanner();
    };

    window.addEventListener(
      "runningBannerUpdated",
      handleBannerUpdate
    );

    const interval = window.setInterval(() => {
      loadRunningBanner();
    }, 15000);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        loadRunningBanner();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      loadRunningBanner
    );

    return () => {
      window.removeEventListener(
        "runningBannerUpdated",
        handleBannerUpdate
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        loadRunningBanner
      );

      window.clearInterval(interval);
    };
  }, [loadRunningBanner]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((previous) => !previous);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const renderBannerMessages = (copyIndex) => {
    return bannerMessages.map(
      (message, index) => (
        <span
          key={`banner-${copyIndex}-${index}`}
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
        {bannerEnabled &&
          bannerMessages.length > 0 && (
            <div className="announcement-bar">
              <div className="announcement-track">
                {renderBannerMessages(1)}
                {renderBannerMessages(2)}
              </div>
            </div>
          )}

        <div className="navbar">
          <div className="navbar-inner">

            {/* MOBILE HAMBURGER */}

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
                  size={21}
                  strokeWidth={1.7}
                />
              ) : (
                <Menu
                  size={21}
                  strokeWidth={1.7}
                />
              )}
            </button>

            {/* LOGO */}

            <Link
              to="/"
              className="logo"
              onClick={closeMenu}
              aria-label="UNTKN Home"
            >
              <img
                src={logo}
                alt="UNTKN"
              />
            </Link>

            {/* DESKTOP NAVIGATION */}

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

            {/* DESKTOP ACTIONS */}

            <div className="nav-actions">

              <Link
                to="/search"
                aria-label="Search"
                className="nav-action-button"
              >
                <Search
                  size={19}
                  strokeWidth={1.5}
                />
              </Link>

              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="nav-action-button"
              >
                <Heart
                  size={19}
                  strokeWidth={1.5}
                />
              </Link>

              <Link
                to="/account"
                aria-label="Account"
                className="nav-action-button"
              >
                <User
                  size={19}
                  strokeWidth={1.5}
                />
              </Link>

              <Link
                to="/cart"
                aria-label="Cart"
                className="nav-action-button navbar-cart"
              >
                <ShoppingBag
                  size={19}
                  strokeWidth={1.5}
                />

                {Number(totalItems) > 0 && (
                  <span className="cart-count">
                    {totalItems}
                  </span>
                )}
              </Link>

            </div>
          </div>
        </div>

        {/* MOBILE MENU */}

        {menuOpen && (
          <>
            <div
              className="mobile-menu-overlay"
              onClick={closeMenu}
              aria-hidden="true"
            />

            <aside
              className="mobile-menu open"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              <div className="mobile-menu-header">
                <span className="mobile-menu-title">
                  UNTKN
                </span>

                <button
                  type="button"
                  className="mobile-menu-close"
                  onClick={closeMenu}
                  aria-label="Close navigation menu"
                >
                  <X
                    size={20}
                    strokeWidth={1.7}
                  />
                </button>
              </div>

              <nav className="mobile-menu-nav">

                <Link
                  to="/shop"
                  onClick={closeMenu}
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
                  onClick={closeMenu}
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
                  onClick={closeMenu}
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
                  onClick={closeMenu}
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
                  onClick={closeMenu}
                  className={
                    isActive("/contact")
                      ? "active"
                      : ""
                  }
                >
                  CONTACT
                </Link>

                <Link
                  to="/wishlist"
                  onClick={closeMenu}
                  className={
                    isActive("/wishlist")
                      ? "active"
                      : ""
                  }
                >
                  WISHLIST
                </Link>

                <Link
                  to="/account"
                  onClick={closeMenu}
                  className={
                    isActive("/account")
                      ? "active"
                      : ""
                  }
                >
                  ACCOUNT
                </Link>

                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className={
                    isActive("/cart")
                      ? "active"
                      : ""
                  }
                >
                  BAG
                  {Number(totalItems) > 0 &&
                    ` (${totalItems})`}
                </Link>

              </nav>
            </aside>
          </>
        )}
      </header>
    </>
  );
}

export default Navbar;