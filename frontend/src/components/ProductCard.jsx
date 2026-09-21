import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { useWishlist } from "../context/WishlistContext";

function ProductCard({ product }) {
  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  /* =========================
     GET IMAGE URL
  ========================= */

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (typeof image === "string") {
      return image;
    }

    return (
      image.image_url ||
      image.imageUrl ||
      image.secure_url ||
      image.secureUrl ||
      image.url ||
      ""
    );
  };

  /* =========================
     FIND VALID IMAGE
  ========================= */

  const getProductImage = () => {
    /*
     * First use product.image if it exists
     * and is a real URL.
     */

    const directImage =
      getImageUrl(product.image);

    if (
      directImage &&
      !directImage.includes("example.com")
    ) {
      return directImage;
    }

    /*
     * Otherwise search through all
     * product images.
     */

    if (Array.isArray(product.images)) {
      const validImage =
        product.images
          .map(getImageUrl)
          .find(
            (url) =>
              url &&
              !url.includes("example.com")
          );

      if (validImage) {
        return validImage;
      }
    }

    /*
     * Final fallback.
     */

    return directImage || "";
  };

  const imageUrl = getProductImage();

  /* =========================
     PRICE
  ========================= */

  const currentPrice = Number(
    product.price ??
      product.sale_price ??
      product.base_price ??
      0
  );

  const oldPrice =
    product.oldPrice !== undefined &&
    product.oldPrice !== null
      ? Number(product.oldPrice)
      : product.base_price !== undefined &&
        Number(product.base_price) >
          currentPrice
      ? Number(product.base_price)
      : null;

  /* =========================
     DISCOUNT
  ========================= */

  const discount =
    oldPrice &&
    oldPrice > currentPrice
      ? Math.round(
          ((oldPrice - currentPrice) /
            oldPrice) *
            100
        )
      : 0;

  /* =========================
     WISHLIST
  ========================= */

  const wishlistActive =
    isInWishlist(product.id);

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);
  };

  /* =========================
     IMAGE ERROR
  ========================= */

  const handleImageError = (event) => {
    /*
     * Hide broken images instead of showing
     * a broken-image icon.
     */

    event.currentTarget.style.display =
      "none";
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <article className="product-card">
      <div className="product-image">
        <Link
          to={`/product/${product.slug}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div
              className="product-image-placeholder"
              aria-label="Product image unavailable"
            />
          )}
        </Link>

        <button
          type="button"
          className={
            wishlistActive
              ? "wishlist-button active"
              : "wishlist-button"
          }
          aria-label={
            wishlistActive
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={handleWishlist}
        >
          <Heart
            size={17}
            strokeWidth={1.5}
            fill={
              wishlistActive
                ? "currentColor"
                : "none"
            }
          />
        </button>

        {discount > 0 && (
          <span className="discount-badge">
            {discount}% OFF
          </span>
        )}
      </div>

      <Link
        to={`/product/${product.slug}`}
        className="product-info"
      >
        <div>
          <h3>
            {product.name}
          </h3>

          <p>
            {product.category || "UNTKN"}
          </p>
        </div>

        <div className="product-price">
          <span className="current-price">
            ₹{currentPrice.toLocaleString("en-IN")}
          </span>

          {oldPrice &&
            oldPrice > currentPrice && (
              <span className="old-price">
                ₹{oldPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;