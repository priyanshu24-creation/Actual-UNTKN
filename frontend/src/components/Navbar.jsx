import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Heart,
} from "lucide-react";
import api from "../services/api.js";

const DEFAULT_BANNER_MESSAGES = [
  "FREE SHIPPING ON ORDERS ABOVE ₹999",
  "NEW DROP LIVE NOW",
  "EASY RETURNS",
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [bannerSettings, setBannerSettings] = useState({
    enabled: false,
    messages: [],
  });

  const [cartCount, setCartCount] = useState(0);

  const loadRunningBanner = async () => {
    try {
      const response = await api.get(
        "/settings/running-banner",
        {
          params: {
            _: Date.now(),
          },
          headers: {
            "Cache-Control":
              "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      const settings = response?.data?.settings;

      if (!settings) {
        setBannerSettings({
          enabled: false,
          messages: [],
        });

        return;
      }

      const messagesFromFields = [
        settings.message_1,
        settings.message_2,
        settings.message_3,
      ].map((message) =>
        typeof message === "string"
          ? message.trim()
          : ""
      );

      const messagesFromArray = Array.isArray(
        settings.messages
      )
        ? settings.messages.map((message) =>
            typeof message === "string"
              ? message.trim()
              : ""
          )
        : [];

      let messages = [];

      const hasFieldValues =
        messagesFromFields.some(Boolean);

      if (hasFieldValues) {
        messages = messagesFromFields.map(
          (message, index) =>
            message ||
            DEFAULT_BANNER_MESSAGES[index]
        );
      } else if (
        messagesFromArray.length > 0
      ) {
        messages = [0, 1, 2].map(
          (index) =>
            messagesFromArray[index] ||
            DEFAULT_BANNER_MESSAGES[index]
        );
      } else {
        messages = DEFAULT_BANNER_MESSAGES;
      }

      messages = messages
        .slice(0, 3)
        .filter(Boolean);

      setBannerSettings({
        enabled:
          Boolean(settings.enabled) &&
          messages.length > 0,
        messages,
      });
    } catch (error) {
      console.error(
        "Failed to load running banner:",
        error
      );

      setBannerSettings((current) => ({
        ...current,
        enabled: false,
      }));
    }
  };

  const loadCartCount = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await api.get("/cart");
      const data = response?.data;

      const items = Array.isArray(data?.cart)
        ? data.cart
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const count = items.reduce(
        (total, item) =>
          total +
          Number(item?.quantity || 0),
        0
      );

      setCartCount(count);
    } catch (error) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadRunningBanner();
    loadCartCount();

    const handleCartUpdated = () => {
      loadCartCount();
    };

    const handleStorage = (event) => {
      if (
        event.key === "token" ||
        event.key === "accessToken" ||
        event.key === "cart"
      ) {
        loadCartCount();
      }
    };

    const handleRunningBannerUpdated = () => {
      loadRunningBanner();
    };

    window.addEventListener(
      "cartUpdated",
      handleCartUpdated
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "runningBannerUpdated",
      handleRunningBannerUpdated
    );

    const bannerInterval = setInterval(
      loadRunningBanner,
      30000
    );

    const cartInterval = setInterval(
      loadCartCount,
      30000
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdated
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "runningBannerUpdated",
        handleRunningBannerUpdated
      );

      clearInterval(bannerInterval);
      clearInterval(cartInterval);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) {
      return;
    }

    setSearchOpen(false);
    setSearchValue("");

    navigate(
      `/shop?search=${encodeURIComponent(query)}`
    );
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const navigateFromMenu = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const renderBannerSet = (setIndex) => (
    <div
      className="untkn-running-banner-set"
      key={`banner-set-${setIndex}`}
      aria-hidden={setIndex !== 0}
    >
      {bannerSettings.messages.map(
        (message, index) => (
          <React.Fragment
            key={`banner-message-${setIndex}-${index}`}
          >
            <span className="untkn-running-banner-message">
              {message}
            </span>

            <span
              className="untkn-running-banner-separator"
              aria-hidden="true"
            >
              •
            </span>
          </React.Fragment>
        )
      )}
    </div>
  );

  const bannerSets = [0, 1, 2, 3];

  return (
    <>
      <style>{`
        .untkn-running-banner {
          width: 100%;
          height: 32px;
          overflow: hidden;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          position: relative;
          z-index: 2001;
          white-space: nowrap;
        }

        .untkn-running-banner-track {
          display: flex;
          align-items: center;
          width: max-content;
          flex-shrink: 0;
          animation:
            untkn-running-banner-scroll
            24s
            linear
            infinite;
          will-change: transform;
        }

        .untkn-running-banner-set {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          width: max-content;
        }

        .untkn-running-banner-message {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          white-space: nowrap;
          font-size: 9px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 0 26px;
        }

        .untkn-running-banner-separator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 1em;
          opacity: 0.7;
          font-size: 9px;
          line-height: 1;
        }

        @keyframes untkn-running-banner-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-25%, 0, 0);
          }
        }

        .untkn-running-banner:hover
          .untkn-running-banner-track {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .untkn-running-banner {
            height: 30px;
          }

          .untkn-running-banner-track {
            animation-duration: 18s;
          }

          .untkn-running-banner-message {
            font-size: 8px;
            letter-spacing: 0.13em;
            padding: 0 15px;
          }

          .untkn-running-banner-separator {
            font-size: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .untkn-running-banner-track {
            animation: none;
            transform: translate3d(0, 0, 0);
          }
        }

        .untkn-mobile-menu {
          z-index: 3000;
        }

        .untkn-menu-overlay {
          z-index: 2999;
        }

        .untkn-mobile-links {
          display: flex;
          flex-direction: column;
        }

        .untkn-mobile-links button {
          appearance: none;
          border: 0;
          background: transparent;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .untkn-mobile-links button:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 4px;
        }
      `}</style>

      {bannerSettings.enabled &&
        bannerSettings.messages.length > 0 && (
          <div
            className="untkn-running-banner"
            aria-label="Announcements"
          >
            <div className="untkn-running-banner-track">
              {bannerSets.map(renderBannerSet)}
            </div>
          </div>
        )}

      <header className="navbar">
        <div className="navbar-inner">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen(true);
              setSearchOpen(false);
            }}
          >
            <Menu
              size={20}
              strokeWidth={1.5}
            />
          </button>

          <Link
            to="/"
            className="logo"
            aria-label="UNTKN Home"
          >
            UNTKN
          </Link>

          <nav className="nav-links">
            <Link
              to="/"
              className={
                isActive("/")
                  ? "active"
                  : ""
              }
            >
              HOME
            </Link>

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
              to="/new-arrivals"
              className={
                isActive("/new-arrivals")
                  ? "active"
                  : ""
              }
            >
              NEW ARRIVALS
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
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              className={`nav-action-button ${
                searchOpen ? "active" : ""
              }`}
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() =>
                setSearchOpen(
                  (open) => !open
                )
              }
            >
              <Search
                size={17}
                strokeWidth={1.5}
              />
            </button>

            <Link
              to="/wishlist"
              className={`nav-action-button ${
                isActive("/wishlist")
                  ? "active"
                  : ""
              }`}
              aria-label="Wishlist"
            >
              <Heart
                size={17}
                strokeWidth={1.5}
              />
            </Link>

            <Link
              to="/account"
              className={`nav-action-button ${
                isActive("/account")
                  ? "active"
                  : ""
              }`}
              aria-label="Account"
            >
              <User
                size={17}
                strokeWidth={1.5}
              />
            </Link>

            <Link
              to="/cart"
              className={`nav-action-button bag-button ${
                isActive("/cart")
                  ? "active"
                  : ""
              }`}
              aria-label={`Shopping bag${
                cartCount > 0
                  ? `, ${cartCount} items`
                  : ""
              }`}
            >
              <ShoppingBag
                size={17}
                strokeWidth={1.5}
              />

              {cartCount > 0 && (
                <span className="cart-count">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="untkn-search-panel">
            <form
              className="untkn-search-form"
              onSubmit={
                handleSearchSubmit
              }
            >
              <Search
                size={17}
                strokeWidth={1.5}
              />

              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="SEARCH PRODUCTS"
                aria-label="Search products"
                autoFocus
              />

              <button
                type="button"
                className="untkn-search-close"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchValue("");
                }}
                aria-label="Close search"
              >
                <X
                  size={17}
                  strokeWidth={1.5}
                />
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div
          className="mobile-menu-overlay untkn-menu-overlay"
          onClick={closeMenu}
          role="presentation"
        >
          <aside
            className="mobile-menu untkn-mobile-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
            aria-label="Mobile navigation"
          >
            <div className="untkn-mobile-menu-header">
              <span className="logo">
                UNTKN
              </span>

              <button
                type="button"
                className="nav-action-button"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <X
                  size={18}
                  strokeWidth={1.5}
                />
              </button>
            </div>

            <nav className="untkn-mobile-links">
              <button
                type="button"
                className={
                  isActive("/shop")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu("/shop")
                }
              >
                SHOP
              </button>

              <button
                type="button"
                className={
                  isActive("/collections")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu(
                    "/collections"
                  )
                }
              >
                COLLECTIONS
              </button>

              <button
                type="button"
                className={
                  isActive("/lookbook")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu(
                    "/lookbook"
                  )
                }
              >
                LOOKBOOK
              </button>

              <button
                type="button"
                className={
                  isActive("/about")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu("/about")
                }
              >
                ABOUT
              </button>

              <button
                type="button"
                className={
                  isActive("/contact")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu("/contact")
                }
              >
                CONTACT
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;