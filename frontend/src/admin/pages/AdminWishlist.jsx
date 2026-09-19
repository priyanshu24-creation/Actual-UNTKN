import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Heart,
  Trash2,
  User,
  Package,
} from "lucide-react";

import api from "../../services/api.js";


// ======================================================
// DATE FORMATTER
// ======================================================

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


// ======================================================
// ADMIN WISHLIST
// ======================================================

function AdminWishlist() {

  // ====================================================
  // STATE
  // ====================================================

  const [wishlist, setWishlist] = useState([]);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] = useState("");


  // ====================================================
  // LOAD ADMIN WISHLIST
  // ====================================================

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/wishlist/admin");

      const data = response.data;

      const loadedWishlist =
        data?.wishlist ||
        data?.data?.wishlist ||
        data?.data ||
        [];

      if (!Array.isArray(loadedWishlist)) {
        throw new Error(
          "Invalid wishlist response from server."
        );
      }

      setWishlist(loadedWishlist);

    } catch (requestError) {

      console.error(
        "Failed to load admin wishlist:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to load wishlist."
      );

      setWishlist([]);

    } finally {
      setLoading(false);
    }
  };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadWishlist();
  }, []);


  // ====================================================
  // CATEGORIES
  // ====================================================

  const categories = useMemo(() => {

    const uniqueCategories =
      new Set(
        wishlist
          .map((item) => item.category)
          .filter(Boolean)
      );

    return [
      "All",
      ...uniqueCategories,
    ];

  }, [wishlist]);


  // ====================================================
  // FILTER WISHLIST
  // ====================================================

  const filteredWishlist = useMemo(() => {

    const query =
      search.toLowerCase().trim();

    return wishlist.filter((item) => {

      const customer =
        String(item.customer || "")
          .toLowerCase();

      const email =
        String(item.email || "")
          .toLowerCase();

      const product =
        String(item.product || "")
          .toLowerCase();

      const category =
        String(item.category || "")
          .toLowerCase();

      const matchesSearch =
        !query ||
        customer.includes(query) ||
        email.includes(query) ||
        product.includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  }, [
    wishlist,
    search,
    categoryFilter,
  ]);


  // ====================================================
  // FORMAT CURRENCY
  // ====================================================

  const formatCurrency = (amount) => {

    const numericAmount =
      Number(amount || 0);

    return `₹${numericAmount.toLocaleString(
      "en-IN"
    )}`;
  };


  // ====================================================
  // REMOVE WISHLIST ITEM
  // ====================================================

  const handleRemove = async (item) => {

    if (!item) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove ${item.product} from ${item.customer}'s wishlist?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(item.id);
      setError("");

      await api.delete(
        `/wishlist/admin/items/${item.id}`
      );

      setWishlist((current) =>
        current.filter(
          (wishlistItem) =>
            wishlistItem.id !== item.id
        )
      );

    } catch (requestError) {

      console.error(
        "Failed to remove wishlist item:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to remove wishlist item."
      );

    } finally {
      setDeletingId(null);
    }
  };


  // ====================================================
  // SUMMARY
  // ====================================================

  const totalWishlistItems =
    wishlist.length;

  const totalCustomers =
    new Set(
      wishlist.map(
        (item) => item.customerId
      )
    ).size;

  const totalProducts =
    new Set(
      wishlist.map(
        (item) => item.productId
      )
    ).size;


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="admin-page admin-wishlist-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="admin-page-header">

        <div>

          <p className="admin-eyebrow">
            CUSTOMER ACTIVITY
          </p>

          <h1 className="admin-page-title">
            Wishlist
          </h1>

          <p className="admin-page-description">
            Monitor products saved by customers
            and understand wishlist activity.
          </p>

        </div>

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            border: "1px solid #e5e5e5",
            background: "#fafafa",
            color: "#333",
            fontSize: "14px",
          }}
        >
          {error}
        </div>

      )}


      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="admin-wishlist-summary">

        {/* WISHLIST ITEMS */}

        <div className="admin-wishlist-summary-card">

          <div className="admin-wishlist-summary-icon">

            <Heart
              size={20}
              strokeWidth={1.5}
            />

          </div>

          <div>

            <span>
              Wishlist Items
            </span>

            <strong>
              {loading
                ? "—"
                : totalWishlistItems}
            </strong>

          </div>

        </div>


        {/* CUSTOMERS */}

        <div className="admin-wishlist-summary-card">

          <div className="admin-wishlist-summary-icon">

            <User
              size={20}
              strokeWidth={1.5}
            />

          </div>

          <div>

            <span>
              Customers
            </span>

            <strong>
              {loading
                ? "—"
                : totalCustomers}
            </strong>

          </div>

        </div>


        {/* PRODUCTS */}

        <div className="admin-wishlist-summary-card">

          <div className="admin-wishlist-summary-icon">

            <Package
              size={20}
              strokeWidth={1.5}
            />

          </div>

          <div>

            <span>
              Products Saved
            </span>

            <strong>
              {loading
                ? "—"
                : totalProducts}
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="admin-toolbar admin-wishlist-toolbar">

        {/* SEARCH */}

        <div className="admin-search-box">

          <Search
            size={18}
            strokeWidth={1.5}
          />

          <input
            type="text"
            placeholder="Search customer or product..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        {/* CATEGORY FILTER */}

        <div className="admin-filter-group">

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
            aria-label="Filter wishlist by category"
          >

            {categories.map(
              (category) => (

                <option
                  key={category}
                  value={category}
                >
                  {category === "All"
                    ? "All Categories"
                    : category}
                </option>

              )
            )}

          </select>

        </div>


        {/* RESULT COUNT */}

        <div className="admin-result-count">

          {loading
            ? "Loading..."
            : `${filteredWishlist.length} item${
                filteredWishlist.length !== 1
                  ? "s"
                  : ""
              }`}

        </div>

      </div>


      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-table admin-wishlist-table">

            <thead>

              <tr>

                <th>
                  PRODUCT
                </th>

                <th>
                  CUSTOMER
                </th>

                <th>
                  CATEGORY
                </th>

                <th>
                  PRICE
                </th>

                <th>
                  ADDED
                </th>

                <th>
                  ACTION
                </th>

              </tr>

            </thead>


            <tbody>

              {!loading &&
                filteredWishlist.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      {/* PRODUCT */}

                      <td>

                        <div className="admin-wishlist-product">

                          <div className="admin-wishlist-product-icon">

                            <Heart
                              size={18}
                              strokeWidth={1.5}
                            />

                          </div>

                          <div>

                            <strong>
                              {item.product}
                            </strong>

                            <span>
                              Product #
                              {item.productId}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* CUSTOMER */}

                      <td>

                        <div className="admin-wishlist-customer">

                          <strong>
                            {item.customer}
                          </strong>

                          <span>
                            {item.email}
                          </span>

                        </div>

                      </td>


                      {/* CATEGORY */}

                      <td>

                        <span className="admin-category-badge">
                          {item.category ||
                            "Uncategorized"}
                        </span>

                      </td>


                      {/* PRICE */}

                      <td>

                        <strong className="admin-wishlist-price">

                          {formatCurrency(
                            item.price
                          )}

                        </strong>

                      </td>


                      {/* DATE */}

                      <td>

                        <span className="admin-wishlist-date">

                          {formatDate(
                            item.added
                          )}

                        </span>

                      </td>


                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-wishlist-delete"
                          onClick={() =>
                            handleRemove(
                              item
                            )
                          }
                          disabled={
                            deletingId ===
                            item.id
                          }
                          aria-label={`Remove ${item.product} from ${item.customer}'s wishlist`}
                        >

                          <Trash2
                            size={16}
                            strokeWidth={1.5}
                          />

                        </button>

                      </td>

                    </tr>

                  )
                )}

            </tbody>

          </table>

        </div>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (

          <div className="admin-empty-state">

            <Heart
              size={34}
              strokeWidth={1.2}
            />

            <h3>
              Loading wishlist
            </h3>

            <p>
              Fetching wishlist activity
              from the database.
            </p>

          </div>

        )}


        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          filteredWishlist.length === 0 && (

            <div className="admin-empty-state">

              <Heart
                size={34}
                strokeWidth={1.2}
              />

              <h3>
                No wishlist items found
              </h3>

              <p>
                Try changing your search
                or category filter.
              </p>

            </div>

          )}

      </div>

    </section>
  );
}

export default AdminWishlist;