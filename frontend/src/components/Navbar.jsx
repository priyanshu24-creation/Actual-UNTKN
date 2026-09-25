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

  const [currentMessage, setCurrentMessage] = useState(0);
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

      const settings =
        response?.data?.settings;

      if (!settings) {
        setBannerSettings({
          enabled: false,
          messages: [],
        });

        return;
      }

      const messages = Array.isArray(
        settings.messages
      )
        ? settings.messages
            .filter(
              (message) =>
                typeof message === "string" &&
                message.trim().length > 0
            )
            .map((message) =>
              message.trim()
            )
        : [];

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

      setBannerSettings({
        enabled: false,
        messages: [],
      });
    }
  };

  const loadCartCount = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem(
          "accessToken"
        );

      if (!token) {
        setCartCount(0);
        return;
      }

      const response =
        await api.get("/cart");

      const data =
        response?.data;

      const items =
        Array.isArray(data?.cart)
          ? data.cart
          : Array.isArray(data?.items)
          ? data.items
          : [];

      const count =
        items.reduce(
          (total, item) =>
            total +
            Number(
              item?.quantity || 0
            ),
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

    const handleCartUpdated =
      () => {
        loadCartCount();
      };

    const handleStorage =
      (event) => {
        if (
          event.key === "token" ||
          event.key === "accessToken" ||
          event.key === "cart"
        ) {
          loadCartCount();
        }
      };

    window.addEventListener(
      "cartUpdated",
      handleCartUpdated
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const bannerInterval =
      setInterval(
        loadRunningBanner,
        30000
      );

    const cartInterval =
      setInterval(
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

      clearInterval(
        bannerInterval
      );

      clearInterval(
        cartInterval
      );
    };
  }, []);

  useEffect(() => {
    if (
      !bannerSettings.enabled ||
      bannerSettings.messages.length <= 1
    ) {
      setCurrentMessage(0);
      return undefined;
    }

    const interval =
      setInterval(() => {
        setCurrentMessage(
          (previous) =>
            (previous + 1) %
            bannerSettings.messages.length
        );
      }, 4000);

    return () =>
      clearInterval(interval);
  }, [
    bannerSettings.enabled,
    bannerSettings.messages,
  ]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(
      path
    );
  };

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    const query =
      searchValue.trim();

    if (!query) {
      return;
    }

    setSearchOpen(false);
    setSearchValue("");

    navigate(
      `/shop?search=${encodeURIComponent(
        query
      )}`
    );
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const navigateFromMenu = (
    path
  ) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {bannerSettings.enabled &&
        bannerSettings.messages.length >
          0 && (
          <div className="untkn-running-banner">
            <marquee behavior="scroll" direction="left" scrollamount="6">
              {bannerSettings.messages[currentMessage]}
            </marquee>
          </div>
        )}

      <header className="navbar">
        <div className="navbar-inner">

          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen(true)
            }
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
                isActive(
                  "/new-arrivals"
                )
                  ? "active"
                  : ""
              }
            >
              NEW ARRIVALS
            </Link>

            <Link
              to="/collections"
              className={
                isActive(
                  "/collections"
                )
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
                searchOpen
                  ? "active"
                  : ""
              }`}
              aria-label="Search"
              aria-expanded={
                searchOpen
              }
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
                isActive(
                  "/wishlist"
                )
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
                isActive(
                  "/account"
                )
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
                  setSearchOpen(
                    false
                  );

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
                  isActive("/")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu("/")
                }
              >
                HOME
              </button>

              <button
                type="button"
                className={
                  isActive("/shop")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu(
                    "/shop"
                  )
                }
              >
                SHOP
              </button>

              

              <button
                type="button"
                className={
                  isActive(
                    "/collections"
                  )
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
                  isActive(
                    "/lookbook"
                  )
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
                  isActive(
                    "/wishlist"
                  )
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu(
                    "/wishlist"
                  )
                }
              >
                WISHLIST
              </button>

              <button
                type="button"
                className={
                  isActive(
                    "/account"
                  )
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu(
                    "/account"
                  )
                }
              >
                ACCOUNT
              </button>

              <button
                type="button"
                className={
                  isActive("/cart")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigateFromMenu(
                    "/cart"
                  )
                }
              >
                BAG
                {cartCount > 0
                  ? ` (${cartCount})`
                  : ""}
              </button>

            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;