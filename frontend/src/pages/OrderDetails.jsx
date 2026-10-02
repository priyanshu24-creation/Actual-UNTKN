import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ChevronLeft,
  Truck,
  Package,
  MapPin,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeItem, setExchangeItem] = useState(null);
  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeDetails, setExchangeDetails] = useState("");
  const [requestedSize, setRequestedSize] = useState("");
  const [exchangeSubmitted, setExchangeSubmitted] = useState(false);

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "ORDER PENDING";

      case "confirmed":
        return "ORDER CONFIRMED";

      case "processing":
        return "PROCESSING";

      case "shipped":
        return "SHIPPED";

      case "delivered":
        return "DELIVERED";

      case "cancelled":
        return "CANCELLED";

      default:
        return String(
          status || "PENDING"
        ).toUpperCase();
    }
  };

  const statusSteps = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const getStatusIndex = (status) => {
    const index = statusSteps.indexOf(status);

    return index === -1 ? 0 : index;
  };

  const canCancelOrder = [
    "pending",
    "confirmed",
    "processing"
  ].includes(
    String(order?.order_status || "")
      .trim()
      .toLowerCase()
  );

  const canExchangeOrder =
    String(order?.order_status || "")
      .trim()
      .toLowerCase() === "delivered";

  const clearMessages = () => {
    setActionMessage("");
    setActionError("");
  };

  const handleCancelOrder = async () => {
    if (!id || actionLoading || !canCancelOrder) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      const response = await api.patch(
        `/orders/${Number(id)}/cancel`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to cancel order."
        );
      }

      setOrder((previous) => ({
        ...previous,
        order_status: "cancelled",
        payment_status:
          response.data?.refund_processed
            ? "refunded"
            : previous.payment_status
      }));

      setActionMessage(
        response.data?.refund_processed
          ? "Order cancelled successfully. Your refund has been initiated to your original payment method. It will appear in your account once your payment provider completes processing. No action is required from you."
          : "Order cancelled successfully."
      );

    } catch (requestError) {
      console.error(
        "Cancel order error:",
        requestError
      );

      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to cancel this order."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openExchangeForm = (item) => {
    clearMessages();
    setExchangeItem(item);
    setExchangeReason("");
    setExchangeDetails("");
    setRequestedSize("");
    setExchangeSubmitted(false);
    setExchangeOpen(true);
  };

  const closeExchangeForm = () => {
    if (actionLoading) {
      return;
    }

    setExchangeOpen(false);
    setExchangeItem(null);
    setExchangeReason("");
    setExchangeDetails("");
    setRequestedSize("");
  };

  const handleExchangeSubmit = async (event) => {
    event.preventDefault();

    if (
      !exchangeItem ||
      actionLoading ||
      !canExchangeOrder
    ) {
      return;
    }

    if (!exchangeReason) {
      setActionError(
        "Please select an exchange reason."
      );
      return;
    }

    try {
      setActionLoading(true);
      clearMessages();

      const response = await api.post(
        `/orders/${Number(id)}/exchange`,
        {
          order_item_id:
            Number(exchangeItem.id),
          reason: exchangeReason,
          details: exchangeDetails.trim(),
          requested_size:
            requestedSize.trim()
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to submit exchange request."
        );
      }

      setExchangeSubmitted(true);
      setActionMessage(
        "Exchange request submitted successfully. We will review your request and contact you with the next update."
      );

    } catch (requestError) {
      console.error(
        "Exchange request error:",
        requestError
      );

      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to submit exchange request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ------------------------------------------------------
        Validate database order ID
        ------------------------------------------------------
        */

        const orderId = Number(id);

        if (
          !Number.isInteger(orderId) ||
          orderId <= 0
        ) {
          throw new Error(
            "Invalid order ID."
          );
        }

        /*
        ------------------------------------------------------
        Get order directly
        ------------------------------------------------------
        */

        const response = await api.get(
          `/orders/${orderId}`
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load order."
          );
        }

        const backendOrder =
          response.data?.order;

        if (!backendOrder) {
          throw new Error(
            "Order details were not returned."
          );
        }

        /*
        ------------------------------------------------------
        Load order items
        ------------------------------------------------------
        */

        const items =
          backendOrder.items || [];

        /*
        ------------------------------------------------------
        Load real product images
        ------------------------------------------------------
        */

        const itemsWithImages =
          await Promise.all(
            items.map(async (item) => {
              let imageUrl = "";

              try {
                if (item.product_id) {
                  const imageResponse =
                    await api.get(
                      `/products/${Number(
                        item.product_id
                      )}/images`
                    );

                  const images =
                    imageResponse.data
                      ?.images || [];

                  const validImages =
                    images.filter(
                      (image) =>
                        image.image_url &&
                        !image.image_url.includes(
                          "example.com"
                        )
                    );

                  const primaryImage =
                    validImages.find(
                      (image) =>
                        Boolean(
                          image.is_primary
                        )
                    );

                  imageUrl =
                    primaryImage?.image_url ||
                    validImages[0]?.image_url ||
                    "";
                }
              } catch (imageError) {
                console.error(
                  "Failed to load product image:",
                  imageError
                );
              }

              return {
                ...item,
                image_url: imageUrl,
              };
            })
          );

        if (cancelled) {
          return;
        }

        setOrder(backendOrder);
        setOrderItems(itemsWithImages);
      } catch (requestError) {
        console.error(
          "Order details error:",
          requestError
        );

        if (!cancelled) {
          setError(
            requestError.response?.data
              ?.message ||
              requestError.message ||
              "Unable to load order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadOrder();
    } else {
      setError(
        "Order ID is missing."
      );
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <div className="order-details-page">
        <section
          style={{
            padding: "100px 20px",
            textAlign: "center",
          }}
        >
          LOADING ORDER DETAILS...
        </section>
      </div>
    );
  }

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  if (error) {
    return (
      <div className="order-details-page">
        <section
          style={{
            padding: "100px 20px",
            textAlign: "center",
          }}
        >
          <AlertCircle
            size={32}
            strokeWidth={1.2}
          />

          <h1
            style={{
              marginTop: "20px",
            }}
          >
            ORDER NOT FOUND
          </h1>

          <p
            style={{
              marginTop: "12px",
            }}
          >
            {error}
          </p>

          <Link
            to="/orders"
            style={{
              display: "inline-block",
              marginTop: "30px",
            }}
          >
            ← BACK TO ORDERS
          </Link>
        </section>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  /*
  ==========================================================
  ORDER DATA
  ==========================================================
  */

  const currentStatus =
    order.order_status || "pending";

  const currentStatusIndex =
    getStatusIndex(currentStatus);

  const subtotal =
    Number(order.subtotal || 0);

  const shippingFee =
    Number(order.shipping_fee || 0);

  const discount =
    Number(order.discount || 0);

  const totalAmount =
    Number(order.total_amount || 0);

  /*
  ==========================================================
  PAYMENT
  ==========================================================
  */

  let paymentLabel =
    "PAYMENT PENDING";

  if (
    order.payment_status === "paid"
  ) {
    paymentLabel =
      "ONLINE PAYMENT";
  } else if (
    order.payment_status === "refunded"
  ) {
    paymentLabel = "REFUNDED";
  } else if (
    order.payment_status === "failed"
  ) {
    paymentLabel =
      "PAYMENT FAILED";
  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (
    <div className="order-details-page">

      {/* HEADER */}

      <section className="order-details-header">

        <Link
          to="/orders"
          className="order-back"
        >
          <ChevronLeft
            size={16}
            strokeWidth={1.3}
          />

          BACK TO ORDERS
        </Link>

        <div className="order-heading">

          <div>

            <p className="eyebrow">
              ORDER DETAILS
            </p>

            <h1>
              {order.order_number}
            </h1>

            <p className="order-date">
              ORDERED ON{" "}
              {formatDate(
                order.created_at
              )}
            </p>

          </div>

          <div className="order-current-status">
            {getStatusLabel(
              currentStatus
            )}
          </div>

        </div>

      </section>

      {(actionMessage || actionError) && (
        <section
          style={{
            margin: "20px 0 0",
            padding: "16px 18px",
            border:
              "1px solid " +
              (actionError ? "#c62828" : "#222"),
            background:
              actionError ? "#fff5f5" : "#f7f7f5",
            color:
              actionError ? "#b71c1c" : "#111",
            lineHeight: 1.6,
          }}
        >
          <strong>
            {actionError
              ? "ERROR"
              : "SUCCESS"}
          </strong>
          <p style={{ margin: "6px 0 0" }}>
            {actionError || actionMessage}
          </p>
        </section>
      )}

      <section
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        {canCancelOrder && (
          <button
            type="button"
            onClick={handleCancelOrder}
            disabled={actionLoading}
            style={{
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              padding: "13px 20px",
              cursor:
                actionLoading
                  ? "not-allowed"
                  : "pointer",
              opacity:
                actionLoading ? 0.6 : 1,
              letterSpacing: "1px",
              fontSize: "12px",
            }}
          >
            {actionLoading
              ? "PROCESSING..."
              : "CANCEL ORDER"}
          </button>
        )}

        {currentStatus === "shipped" && (
          <p
            style={{
              margin: 0,
              padding: "13px 0",
              color: "#666",
              fontSize: "13px",
            }}
          >
            This order can no longer be cancelled because it has been shipped.
          </p>
        )}

        {currentStatus === "delivered" && (
          <p
            style={{
              margin: 0,
              padding: "13px 0",
              color: "#666",
              fontSize: "13px",
            }}
          >
            Exchange is available for delivered items.
          </p>
        )}
      </section>


      {/* ORDER STATUS */}

      <section className="order-status-section">

        <div className="order-section-heading">

          <div>

            <p className="eyebrow">
              DELIVERY
            </p>

            <h2>
              ORDER STATUS
            </h2>

          </div>

          <Truck
            size={20}
            strokeWidth={1.2}
          />

        </div>


        {currentStatus ===
        "cancelled" ? (

          <div className="order-cancelled">
            <strong>
              ORDER CANCELLED
            </strong>
          </div>

        ) : (

          <div className="order-timeline">

            {statusSteps.map(
              (status, index) => {

                const completed =
                  index <=
                  currentStatusIndex;

                const active =
                  status ===
                  currentStatus;

                return (
                  <div
                    className={
                      completed
                        ? "order-timeline-step completed"
                        : "order-timeline-step"
                    }
                    key={status}
                  >

                    <div className="timeline-marker">
                      {completed
                        ? "✓"
                        : ""}
                    </div>

                    <div className="timeline-content">

                      <strong>
                        {getStatusLabel(
                          status
                        )}
                      </strong>

                      {active &&
                        order.updated_at && (
                          <span>
                            {formatDate(
                              order.updated_at
                            )}
                          </span>
                        )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>


      {/* MAIN CONTENT */}

      <section className="order-details-layout">

        {/* ORDERED ITEMS */}

        <main className="order-items-section">

          <div className="order-section-heading">

            <div>

              <p className="eyebrow">
                YOUR PURCHASE
              </p>

              <h2>
                ORDERED ITEMS
              </h2>

            </div>

            <Package
              size={20}
              strokeWidth={1.2}
            />

          </div>


          <div className="ordered-items">

            {orderItems.length === 0 ? (

              <p>
                No items found for this
                order.
              </p>

            ) : (

              orderItems.map((item) => {

                const unitPrice =
                  Number(
                    item.unit_price || 0
                  );

                const quantity =
                  Number(
                    item.quantity || 0
                  );

                const totalPrice =
                  Number(
                    item.total_price ??
                      unitPrice *
                        quantity
                  );

                return (
                  <article
                    className="ordered-item"
                    key={item.id}
                  >

                    {/* IMAGE */}

                    <div className="ordered-item-image">

                      {item.image_url ? (

                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.product_name ||
                            "Product"
                          }
                          onError={(
                            event
                          ) => {
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
                          }}
                        >
                          <Package
                            size={24}
                            strokeWidth={1.2}
                          />
                        </div>

                      )}

                    </div>


                    {/* PRODUCT INFO */}

                    <div className="ordered-item-info">

                      <h3>
                        {item.product_name ||
                          "UNTKN PRODUCT"}
                      </h3>

                      {item.color_name && (
                        <p>
                          COLOR:{" "}
                          {
                            item.color_name
                          }
                        </p>
                      )}

                      {item.size_name && (
                        <p>
                          SIZE:{" "}
                          {
                            item.size_name
                          }
                        </p>
                      )}

                      {item.sku && (
                        <p>
                          SKU:{" "}
                          {item.sku}
                        </p>
                      )}

                      <p>
                        QUANTITY:{" "}
                        {quantity}
                      </p>

                      {canExchangeOrder &&
                        !exchangeSubmitted && (
                          <button
                            type="button"
                            onClick={() =>
                              openExchangeForm(item)
                            }
                            style={{
                              marginTop: "12px",
                              border:
                                "1px solid #111",
                              background: "#fff",
                              color: "#111",
                              padding:
                                "9px 14px",
                              cursor: "pointer",
                              fontSize: "11px",
                              letterSpacing:
                                "1px",
                            }}
                          >
                            EXCHANGE ITEM
                          </button>
                        )}

                    </div>


                    {/* PRICE */}

                    <div className="ordered-item-price">

                      <strong>
                        ₹
                        {formatPrice(
                          totalPrice
                        )}
                      </strong>

                      {quantity > 1 && (
                        <span>
                          ₹
                          {formatPrice(
                            unitPrice
                          )}{" "}
                          EACH
                        </span>
                      )}

                    </div>

                  </article>
                );
              })

            )}

          </div>

        </main>


        {/* PAYMENT SUMMARY */}

        <aside className="order-payment-summary">

          <p className="eyebrow">
            PAYMENT SUMMARY
          </p>

          <h2>
            ORDER TOTAL
          </h2>


          <div className="order-summary-row">

            <span>
              SUBTOTAL
            </span>

            <strong>
              ₹
              {formatPrice(
                subtotal
              )}
            </strong>

          </div>


          <div className="order-summary-row">

            <span>
              SHIPPING
            </span>

            <strong>
              ₹
              {formatPrice(
                shippingFee
              )}
            </strong>

          </div>


          {discount > 0 && (
            <div className="order-summary-row">

              <span>
                DISCOUNT
              </span>

              <strong>
                -₹
                {formatPrice(
                  discount
                )}
              </strong>

            </div>
          )}


          <div className="order-summary-total">

            <span>
              TOTAL
            </span>

            <strong>
              ₹
              {formatPrice(
                totalAmount
              )}
            </strong>

          </div>


          <div className="order-payment-method">

            <span>
              PAYMENT
            </span>

            <strong>
              METHOD
            </strong>

            <p>
              {paymentLabel}
            </p>

          </div>


          <Link
            to="/shop"
            className="continue-shopping"
          >
            CONTINUE SHOPPING →
          </Link>

        </aside>

      </section>


      {/* SHIPPING ADDRESS */}

      <section className="shipping-address-section">

        <div className="order-section-heading">

          <div>

            <p className="eyebrow">
              DELIVERY TO
            </p>

            <h2>
              SHIPPING ADDRESS
            </h2>

          </div>

          <MapPin
            size={20}
            strokeWidth={1.2}
          />

        </div>


        <div className="shipping-address">

          <strong>
            {order.shipping_name ||
              "—"}
          </strong>

          {order.shipping_email && (
            <p>
              {order.shipping_email}
            </p>
          )}

          {order.shipping_phone && (
            <p>
              {order.shipping_phone}
            </p>
          )}

          {order.shipping_address_line1 && (
            <p>
              {
                order.shipping_address_line1
              }
            </p>
          )}

          {order.shipping_address_line2 && (
            <p>
              {
                order.shipping_address_line2
              }
            </p>
          )}

          {(order.shipping_city ||
            order.shipping_state) && (
            <p>
              {order.shipping_city || ""}
              {order.shipping_state
                ? `, ${order.shipping_state}`
                : ""}
            </p>
          )}

          {order.shipping_postal_code && (
            <p>
              {
                order.shipping_postal_code
              }
            </p>
          )}

          <p>
            {order.shipping_country ||
              "India"}
          </p>

        </div>

      </section>

      {exchangeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeExchangeForm();
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              padding: "28px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
              <div>
                <p className="eyebrow">ORDER EXCHANGE</p>
                <h2 style={{ marginTop: "8px" }}>REQUEST EXCHANGE</h2>
              </div>
              <button
                type="button"
                onClick={closeExchangeForm}
                disabled={actionLoading}
                style={{
                  border: "0",
                  background: "transparent",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {exchangeSubmitted ? (
              <div style={{ marginTop: "25px", padding: "20px", background: "#f7f7f5", lineHeight: 1.7 }}>
                <strong>EXCHANGE REQUEST SUBMITTED</strong>
                <p>
                  Your request for{" "}
                  <strong>{exchangeItem?.product_name || "this item"}</strong>{" "}
                  has been submitted successfully.
                </p>
                <button
                  type="button"
                  onClick={closeExchangeForm}
                  style={{
                    marginTop: "10px",
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "12px 18px",
                    cursor: "pointer",
                    letterSpacing: "1px",
                  }}
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <form onSubmit={handleExchangeSubmit} style={{ marginTop: "25px" }}>
                <div style={{ marginBottom: "20px", padding: "15px", background: "#f7f7f5" }}>
                  <strong>{exchangeItem?.product_name || "UNTKN PRODUCT"}</strong>
                  <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px" }}>
                    Current size: {exchangeItem?.size_name || "Not specified"}
                  </p>
                </div>

                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", letterSpacing: "1px" }}>
                  REASON *
                </label>
                <select
                  value={exchangeReason}
                  onChange={(event) => setExchangeReason(event.target.value)}
                  required
                  style={{ width: "100%", padding: "12px", marginBottom: "18px", boxSizing: "border-box" }}
                >
                  <option value="">SELECT REASON</option>
                  <option value="Wrong Size">Wrong Size</option>
                  <option value="Wrong Product">Wrong Product</option>
                  <option value="Damaged Product">Damaged Product</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Different from Description">Different from Description</option>
                  <option value="Other">Other</option>
                </select>

                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", letterSpacing: "1px" }}>
                  REQUESTED SIZE
                </label>
                <input
                  type="text"
                  value={requestedSize}
                  onChange={(event) => setRequestedSize(event.target.value)}
                  maxLength={50}
                  placeholder="Example: L"
                  style={{ width: "100%", padding: "12px", marginBottom: "18px", boxSizing: "border-box" }}
                />

                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", letterSpacing: "1px" }}>
                  ADDITIONAL DETAILS
                </label>
                <textarea
                  value={exchangeDetails}
                  onChange={(event) => setExchangeDetails(event.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Tell us anything else about the exchange..."
                  style={{ width: "100%", padding: "12px", marginBottom: "8px", boxSizing: "border-box", resize: "vertical" }}
                />

                <p style={{ margin: "0 0 20px", color: "#777", fontSize: "11px" }}>
                  {exchangeDetails.length}/2000
                </p>

                {actionError && (
                  <div style={{
                    marginBottom: "18px",
                    padding: "12px",
                    background: "#fff5f5",
                    color: "#b71c1c",
                    border: "1px solid #c62828",
                    fontSize: "13px",
                  }}>
                    {actionError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    width: "100%",
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "14px",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    opacity: actionLoading ? 0.6 : 1,
                    letterSpacing: "1px",
                  }}
                >
                  {actionLoading ? "SUBMITTING..." : "SUBMIT EXCHANGE REQUEST"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;