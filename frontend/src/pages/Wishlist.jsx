import EmptyState from "../components/EmptyState";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const {
    wishlistItems,
    removeFromWishlist,
  } = useWishlist();

  // EMPTY WISHLIST
  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <EmptyState
          title="YOUR WISHLIST IS EMPTY."
          description="Save pieces you love and come back to them whenever you're ready."
          buttonText="EXPLORE PRODUCTS"
          buttonLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="wishlist-page">

      {/* HEADER */}
      <section className="wishlist-header">

        <div>
          <p className="eyebrow">
            SAVED FOR LATER
          </p>

          <h1>
            WISHLIST
          </h1>
        </div>

        <p>
          {wishlistItems.length} ITEM
          {wishlistItems.length !== 1 ? "S" : ""}
        </p>

      </section>

      {/* WISHLIST PRODUCTS */}
      <section className="wishlist-grid">

        {wishlistItems.map((product) => {

          const discount =
            product.oldPrice > product.price
              ? Math.round(
                  ((product.oldPrice - product.price) /
                    product.oldPrice) *
                    100
                )
              : 0;

          return (
            <article
              className="wishlist-card"
              key={product.id}
            >

              {/* IMAGE */}
              <div className="wishlist-image">

                <Link
                  to={`/product/${product.slug}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                  />
                </Link>

                {/* DISCOUNT */}
                {discount > 0 && (
                  <span className="discount-badge">
                    {discount}% OFF
                  </span>
                )}

                {/* REMOVE */}
                <button
                  className="wishlist-remove"
                  onClick={() =>
                    removeFromWishlist(product.id)
                  }
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <Trash2 size={16} />
                </button>

              </div>

              {/* PRODUCT INFO */}
              <div className="wishlist-product-info">

                <div>
                  <h2>
                    {product.name}
                  </h2>

                  <p>
                    {product.category}
                  </p>
                </div>

                <div>

                  <strong>
                    ₹{product.price.toLocaleString("en-IN")}
                  </strong>

                  {product.oldPrice && (
                    <span>
                      ₹{product.oldPrice.toLocaleString("en-IN")}
                    </span>
                  )}

                </div>

              </div>

            </article>
          );
        })}

      </section>

    </div>
  );
}

export default Wishlist;