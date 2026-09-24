import { useState } from "react";
import EmptyState from "../components/EmptyState";
import { Link } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import api from "../services/api";

function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    loading,
    error,
  } = useCart();

  const [updatingItem, setUpdatingItem] = useState(null);
  const [couponCode, setCouponCode] = useState(
    () =>
      sessionStorage.getItem(
        "untkn_coupon_code"
      ) || ""
  );
  const [couponData, setCouponData] = useState(
    null
  );
  const [couponLoading, setCouponLoading] =
    useState(false);
  const [couponError, setCouponError] =
    useState("");

  const getImageUrl = (item) => {
    const image =
      item?.image_url ||
      item?.image ||
      "";

    if (!image) {
      return "";
    }

    if (image.includes("example.com")) {
      return "";
    }

    return image;
  };

  const handleQuantityChange = async (
    item,
    newQuantity
  ) => {
    if (newQuantity < 1) {
      return;
    }

    const stock =
      item.stock_quantity !== null &&
      item.stock_quantity !== undefined
        ? Number(item.stock_quantity)
        : null;

    if (
      stock !== null &&
      newQuantity > stock
    ) {
      return;
    }

    try {
      setUpdatingItem(item.cartItemId);

      await updateQuantity(
        item.product_id,
        item.size,
        newQuantity,
        item.cartItemId
      );
    } catch (requestError) {
      console.error(
        "Quantity update failed:",
        requestError
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemove = async (item) => {
    try {
      setUpdatingItem(item.cartItemId);

      await removeFromCart(
        item.product_id,
        item.size,
        item.cartItemId
      );
    } catch (requestError) {
      console.error(
        "Remove item failed:",
        requestError
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  const applyCoupon = async () => {
    const cleanCode =
      couponCode.trim().toUpperCase();

    if (!cleanCode) {
      setCouponError("Enter a coupon code.");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await api.post(
        "/coupons/validate",
        {
          code: cleanCode,
          subtotal: Number(subtotal || 0),
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            category_id:
              item.category_id ?? null,
            collection_id:
              item.collection_id ?? null,
            quantity: Number(
              item.quantity || 0
            ),
            unit_price: Number(
              item.unit_price ??
                item.price ??
                0
            ),
          })),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to apply coupon."
        );
      }

      setCouponData(response.data.coupon);

      sessionStorage.setItem(
        "untkn_coupon_code",
        cleanCode
      );

      sessionStorage.setItem(
        "untkn_coupon_data",
        JSON.stringify(
          response.data.coupon
        )
      );

      setCouponCode(cleanCode);
    } catch (requestError) {
      console.error(
        "Cart coupon error:",
        requestError
      );

      setCouponData(null);

      sessionStorage.removeItem(
        "untkn_coupon_code"
      );

      sessionStorage.removeItem(
        "untkn_coupon_data"
      );

      setCouponError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Invalid coupon code."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponError("");

    sessionStorage.removeItem(
      "untkn_coupon_code"
    );

    sessionStorage.removeItem(
      "untkn_coupon_data"
    );
  };

  if (loading) {
    return (
      <div className="cart-page">
        <section className="cart-header">
          <div>
            <p className="eyebrow">
              YOUR BAG
            </p>

            <h1>CART</h1>
          </div>
        </section>

        <div
          style={{
            padding: "60px 0",
            textAlign: "center",
          }}
        >
          LOADING CART...
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="YOUR BAG IS EMPTY."
        description="You haven't added anything to your bag yet. Explore the latest collection and find something you like."
        buttonText="CONTINUE SHOPPING"
        buttonLink="/shop"
      />
    );
  }

  const couponDiscount = Math.min(
    Number(couponData?.discount || 0),
    Number(subtotal || 0)
  );

  const cartTotal =
    Math.max(
      0,
      Number(subtotal || 0) -
        couponDiscount
    );

  return (
    <div className="cart-page">
      {/* HEADER */}

      <section className="cart-header">
        <div>
          <p className="eyebrow">
            YOUR BAG
          </p>

          <h1>CART</h1>
        </div>

        <p>
          {cartItems.reduce(
            (total, item) =>
              total +
              Number(item.quantity || 0),
            0
          )}{" "}
          PRODUCT
          {cartItems.reduce(
            (total, item) =>
              total +
              Number(item.quantity || 0),
            0
          ) !== 1
            ? "S"
            : ""}
        </p>
      </section>

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            border: "1px solid #ddd",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* CART */}

      <section className="cart-layout">
        {/* ITEMS */}

        <div className="cart-items">
          {cartItems.map((item) => {
            const imageUrl =
              getImageUrl(item);

            const unitPrice = Number(
              item.unit_price ??
                item.price ??
                0
            );

            const itemTotal =
              unitPrice *
              Number(item.quantity || 0);

            const isUpdating =
              updatingItem ===
              item.cartItemId;

            const stock =
              item.stock_quantity !== null &&
              item.stock_quantity !== undefined
                ? Number(
                    item.stock_quantity
                  )
                : null;

            return (
              <article
                className="cart-item"
                key={`${item.cartItemId}-${item.product_id}-${item.variant_id}`}
              >
                {/* IMAGE */}

                <Link
                  to={`/product/${item.product_id}`}
                  className="cart-item-image"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        item.product_name ||
                        item.name ||
                        "UNTKN Product"
                      }
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize: "12px",
                        textAlign: "center",
                        padding: "10px",
                      }}
                    >
                      {item.product_name ||
                        item.name ||
                        "UNTKN PRODUCT"}
                    </div>
                  )}
                </Link>

                {/* INFO */}

                <div className="cart-item-info">
                  <div>
                    <h2>
                      {item.product_name ||
                        item.name ||
                        "UNTKN Product"}
                    </h2>

                    {item.color && (
                      <p className="cart-size">
                        COLOR:{" "}
                        {item.color}
                      </p>
                    )}

                    {item.size && (
                      <p className="cart-size">
                        SIZE:{" "}
                        {item.size}
                      </p>
                    )}

                    {item.sku && (
                      <p className="cart-size">
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>

                  <div className="cart-item-bottom">
                    {/* QUANTITY */}

                    <div className="cart-quantity">
                      <button
                        disabled={
                          isUpdating ||
                          Number(
                            item.quantity
                          ) <= 1
                        }
                        onClick={() =>
                          handleQuantityChange(
                            item,
                            Number(
                              item.quantity
                            ) - 1
                          )
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        disabled={
                          isUpdating ||
                          (stock !== null &&
                            Number(
                              item.quantity
                            ) >= stock)
                        }
                        onClick={() =>
                          handleQuantityChange(
                            item,
                            Number(
                              item.quantity
                            ) + 1
                          )
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* REMOVE */}

                    <button
                      className="remove-item"
                      disabled={isUpdating}
                      onClick={() =>
                        handleRemove(item)
                      }
                    >
                      <Trash2
                        size={15}
                      />

                      {isUpdating
                        ? "UPDATING..."
                        : "REMOVE"}
                    </button>
                  </div>
                </div>

                {/* PRICE */}

                <div className="cart-item-price">
                  ₹
                  {itemTotal.toLocaleString(
                    "en-IN"
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* SUMMARY */}

        <aside className="cart-summary">
          <p className="eyebrow">
            ORDER SUMMARY
          </p>

          <h2>SUMMARY</h2>

          <div className="summary-row">
            <span>SUBTOTAL</span>

            <span>
              ₹
              {Number(
                subtotal || 0
              ).toLocaleString(
                "en-IN"
              )}
            </span>
          </div>

          <div className="summary-row">
            <span>SHIPPING</span>

            <span>
              CALCULATED AT CHECKOUT
            </span>
          </div>

          <div
            style={{
              margin: "22px 0",
              padding: "16px",
              border: "1px solid #e5e5e5",
              background: "#fafafa",
            }}
          >
            <p
              className="eyebrow"
              style={{ marginBottom: "6px" }}
            >
              UNTKN OFFERS
            </p>

            <strong
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "13px",
              }}
            >
              HAVE A COUPON?
            </strong>

            <div
              style={{
                display: "flex",
                gap: "7px",
              }}
            >
              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(
                    event.target.value.toUpperCase()
                  );
                  setCouponError("");
                }}
                placeholder="ENTER CODE"
                disabled={couponLoading}
                style={{
                  minWidth: 0,
                  flex: 1,
                  padding: "11px",
                  border:
                    "1px solid #d8d8d8",
                  background: "#fff",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                }}
              />

              {couponData ? (
                <button
                  type="button"
                  onClick={removeCoupon}
                  disabled={couponLoading}
                  style={{
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "0 12px",
                    fontSize: "10px",
                    cursor: "pointer",
                  }}
                >
                  REMOVE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={
                    couponLoading ||
                    !couponCode.trim()
                  }
                  style={{
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "0 14px",
                    fontSize: "10px",
                    cursor: "pointer",
                  }}
                >
                  {couponLoading
                    ? "..."
                    : "APPLY"}
                </button>
              )}
            </div>

            {couponError && (
              <p
                style={{
                  margin:
                    "9px 0 0",
                  color: "#a33",
                  fontSize: "11px",
                }}
              >
                {couponError}
              </p>
            )}

            {couponData && (
              <p
                style={{
                  margin:
                    "10px 0 0",
                  fontSize: "11px",
                }}
              >
                <strong>
                  {couponData.code}
                </strong>{" "}
                applied · You save ₹
                {Number(
                  couponData.discount || 0
                ).toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {couponDiscount > 0 && (
            <div className="summary-row">
              <span>DISCOUNT</span>

              <strong
                style={{
                  color: "#2f6b3f",
                }}
              >
                -₹
                {couponDiscount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          )}

          <div className="summary-total">
            <span>TOTAL</span>

            <strong>
              ₹
              {cartTotal.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <Link
            to="/checkout"
            className="checkout-button"
          >
            PROCEED TO CHECKOUT →
          </Link>

          <Link
            to="/shop"
            className="continue-link"
          >
            ← CONTINUE SHOPPING
          </Link>
        </aside>
      </section>
    </div>
  );
}

export default Cart;