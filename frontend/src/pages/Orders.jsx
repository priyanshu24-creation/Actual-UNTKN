import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, AlertCircle } from "lucide-react";

import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatPrice = (value) => {
    const amount = Number(value || 0);

    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

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
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "ORDER PLACED";

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
        return String(status || "PENDING").toUpperCase();
    }
  };

  const getOrderId = (order) => {
    const id = Number(order?.id);

    if (Number.isInteger(id) && id > 0) {
      return id;
    }

    return null;
  };

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/orders");

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to load orders."
          );
        }

        const backendOrders = Array.isArray(response.data?.orders)
          ? response.data.orders
          : [];

        if (!cancelled) {
          setOrders(backendOrders);
        }
      } catch (requestError) {
        console.error("Orders page error:", requestError);

        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load orders."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <main className="orders-page">
        <section className="orders-empty">
          <Package size={36} strokeWidth={1.2} />

          <h2>LOADING ORDERS</h2>

          <p>
            Please wait while we load your order history.
          </p>
        </section>
      </main>
    );
  }

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  if (error) {
    return (
      <main className="orders-page">
        <section className="orders-header">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1>ORDERS</h1>
          </div>
        </section>

        <section className="orders-empty">
          <AlertCircle size={36} strokeWidth={1.2} />

          <h2>UNABLE TO LOAD ORDERS</h2>

          <p>{error}</p>

          <Link to="/shop">
            CONTINUE SHOPPING
          </Link>
        </section>
      </main>
    );
  }

  /*
  ==========================================================
  EMPTY
  ==========================================================
  */

  if (orders.length === 0) {
    return (
      <main className="orders-page">
        <section className="orders-header">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>

            <h1>ORDERS</h1>
          </div>

          <p className="orders-intro">
            YOUR ORDER HISTORY WILL APPEAR HERE.
          </p>
        </section>

        <section className="orders-empty">
          <Package size={36} strokeWidth={1.2} />

          <h2>NO ORDERS YET</h2>

          <p>
            You haven't placed any orders yet.
          </p>

          <Link to="/shop">
            START SHOPPING →
          </Link>
        </section>
      </main>
    );
  }

  /*
  ==========================================================
  ORDERS PAGE
  ==========================================================
  */

  return (
    <main className="orders-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="orders-header">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>

          <h1>ORDERS</h1>
        </div>

        <p className="orders-intro">
          {orders.length} ORDER
          {orders.length !== 1 ? "S" : ""}
        </p>
      </section>

      {/* =====================================================
          ORDERS LIST
      ===================================================== */}

      <section className="orders-content">
        <div className="orders-list">

          {orders.map((order) => {
            const orderId = getOrderId(order);

            const orderNumber =
              order?.order_number ||
              `ORDER #${order?.id || ""}`;

            const orderDate = formatDate(
              order?.created_at
            );

            const status = getStatusLabel(
              order?.order_status
            );

            const total = formatPrice(
              order?.total_amount
            );

            return (
              <article
                className="order-card"
                key={order?.id || order?.order_number}
              >

                {/* =================================================
                    ORDER HEADER
                ================================================= */}

                <div className="order-card-top">

                  <div>
                    <p className="order-label">
                      ORDER
                    </p>

                    <h2>
                      {orderNumber}
                    </h2>
                  </div>

                  <span className="order-status">
                    {status}
                  </span>

                </div>

                {/* =================================================
                    ORDER META
                ================================================= */}

                <div className="order-meta">

                  <div>
                    <span>ORDERED ON</span>

                    <strong>
                      {orderDate || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>ORDER STATUS</span>

                    <strong>
                      {status}
                    </strong>
                  </div>

                  <div>
                    <span>TOTAL</span>

                    <strong>
                      ₹{total}
                    </strong>
                  </div>

                </div>

                {/* =================================================
                    VIEW ORDER
                ================================================= */}

                {orderId ? (
                  <Link
                    to={`/orders/${orderId}`}
                    className="order-details-link"
                  >
                    <span>
                      VIEW ORDER
                    </span>

                    <ChevronRight
                      size={16}
                      strokeWidth={1.3}
                    />
                  </Link>
                ) : (
                  <div
                    className="order-details-link"
                    style={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}
                  >
                    <span>
                      ORDER ID UNAVAILABLE
                    </span>
                  </div>
                )}

              </article>
            );
          })}

        </div>
      </section>

      {/* =====================================================
          CONTINUE SHOPPING
      ===================================================== */}

      <div
        style={{
          marginTop: "50px",
          textAlign: "center",
        }}
      >
        <Link
          to="/shop"
          className="continue-shopping"
        >
          ← CONTINUE SHOPPING
        </Link>
      </div>

    </main>
  );
}

export default Orders;