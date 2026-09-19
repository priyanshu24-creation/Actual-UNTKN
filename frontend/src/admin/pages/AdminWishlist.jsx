import { useMemo, useState } from "react";
import {
  Search,
  Heart,
  Trash2,
  User,
  Package,
} from "lucide-react";

const initialWishlist = [
  {
    id: 1,
    customerId: 1,
    customer: "Rahul Sharma",
    email: "rahul@example.com",
    product: "Karma",
    category: "T-Shirts",
    price: 549,
    added: "18 Sep 2026",
  },
  {
    id: 2,
    customerId: 2,
    customer: "Priya Das",
    email: "priya@example.com",
    product: "History",
    category: "T-Shirts",
    price: 549,
    added: "17 Sep 2026",
  },
  {
    id: 3,
    customerId: 3,
    customer: "Arjun Mehta",
    email: "arjun@example.com",
    product: "Misery World",
    category: "Thermals",
    price: 899,
    added: "16 Sep 2026",
  },
  {
    id: 4,
    customerId: 4,
    customer: "Ananya Roy",
    email: "ananya@example.com",
    product: "Dragon Flame",
    category: "Thermals",
    price: 899,
    added: "15 Sep 2026",
  },
  {
    id: 5,
    customerId: 5,
    customer: "Aditya Singh",
    email: "aditya@example.com",
    product: "Karma",
    category: "T-Shirts",
    price: 549,
    added: "14 Sep 2026",
  },
  {
    id: 6,
    customerId: 6,
    customer: "Sneha Roy",
    email: "sneha@example.com",
    product: "History",
    category: "T-Shirts",
    price: 549,
    added: "13 Sep 2026",
  },
  {
    id: 7,
    customerId: 7,
    customer: "Rohan Das",
    email: "rohan@example.com",
    product: "Misery World",
    category: "Thermals",
    price: 899,
    added: "12 Sep 2026",
  },
  {
    id: 8,
    customerId: 8,
    customer: "Meera Kapoor",
    email: "meera@example.com",
    product: "Karma",
    category: "T-Shirts",
    price: 549,
    added: "11 Sep 2026",
  },
  {
    id: 9,
    customerId: 1,
    customer: "Rahul Sharma",
    email: "rahul@example.com",
    product: "Dragon Flame",
    category: "Thermals",
    price: 899,
    added: "10 Sep 2026",
  },
  {
    id: 10,
    customerId: 3,
    customer: "Arjun Mehta",
    email: "arjun@example.com",
    product: "History",
    category: "T-Shirts",
    price: 549,
    added: "09 Sep 2026",
  },
];

function AdminWishlist() {
  const [wishlist, setWishlist] =
    useState(initialWishlist);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        wishlist.map((item) => item.category)
      ),
    ];
  }, [wishlist]);

  const filteredWishlist = useMemo(() => {
    const query = search.toLowerCase().trim();

    return wishlist.filter((item) => {
      const matchesSearch =
        !query ||
        item.customer
          .toLowerCase()
          .includes(query) ||
        item.email
          .toLowerCase()
          .includes(query) ||
        item.product
          .toLowerCase()
          .includes(query);

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

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const handleRemove = (id) => {
    const item = wishlist.find(
      (wishlistItem) =>
        wishlistItem.id === id
    );

    if (!item) return;

    const confirmed = window.confirm(
      `Remove ${item.product} from ${item.customer}'s wishlist?`
    );

    if (!confirmed) return;

    setWishlist((current) =>
      current.filter(
        (wishlistItem) =>
          wishlistItem.id !== id
      )
    );
  };

  return (
    <section className="admin-page admin-wishlist-page">

      {/* PAGE HEADER */}

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


      {/* SUMMARY */}

      <div className="admin-wishlist-summary">

        <div className="admin-wishlist-summary-card">

          <div className="admin-wishlist-summary-icon">
            <Heart
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>Wishlist Items</span>

            <strong>
              {wishlist.length}
            </strong>
          </div>

        </div>


        <div className="admin-wishlist-summary-card">

          <div className="admin-wishlist-summary-icon">
            <User
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>Customers</span>

            <strong>
              {
                new Set(
                  wishlist.map(
                    (item) =>
                      item.customerId
                  )
                ).size
              }
            </strong>
          </div>

        </div>


        <div className="admin-wishlist-summary-card">

          <div className="admin-wishlist-summary-icon">
            <Package
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>Products Saved</span>

            <strong>
              {
                new Set(
                  wishlist.map(
                    (item) =>
                      item.product
                  )
                ).size
              }
            </strong>
          </div>

        </div>

      </div>


      {/* TOOLBAR */}

      <div className="admin-toolbar admin-wishlist-toolbar">

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


        <div className="admin-result-count">
          {filteredWishlist.length} item
          {filteredWishlist.length !== 1
            ? "s"
            : ""}
        </div>

      </div>


      {/* WISHLIST TABLE */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-table admin-wishlist-table">

            <thead>

              <tr>
                <th>PRODUCT</th>
                <th>CUSTOMER</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>ADDED</th>
                <th>ACTION</th>
              </tr>

            </thead>


            <tbody>

              {filteredWishlist.map(
                (item) => (

                  <tr key={item.id}>

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
                            Product #{item.id}
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
                        {item.category}
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
                        {item.added}
                      </span>

                    </td>


                    {/* ACTION */}

                    <td>

                      <button
                        type="button"
                        className="admin-wishlist-delete"
                        onClick={() =>
                          handleRemove(
                            item.id
                          )
                        }
                        aria-label={`Remove ${item.product} from wishlist`}
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


        {/* EMPTY */}

        {filteredWishlist.length === 0 && (

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