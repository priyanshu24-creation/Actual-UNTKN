import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, AlertCircle } from "lucide-react";

import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
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
    switch (status) {
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
        return String(
          status || "PENDING"
        ).toUpperCase();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/orders"
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load orders."
          );
        }

        const backendOrders =
          response.data?.orders || [];

        if (!cancelled) {
          setOrders(backendOrders);
        }
      } catch (requestError) {
        console.error(
          "Orders page error:",
          requestError
        );

        if (!cancelled) {
          setError(
            requestError.response?.data
              ?.message ||
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
      <div className="orders-page">
        <section
          style={{
            padding: "100px 20px",
            textAlign: "center",
          }}
        >
          LOADING ORDERS...
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
      <div className="orders-page">
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
            UNABLE TO LOAD ORDERS
          </h1>

          <p
            style={{
              marginTop: "12px",
            }}
          >
            {error}
          </p>

          <Link
            to="/shop"
            style={{
              display: "inline-block",
              marginTop: "30px",
            }}
          >
            CONTINUE SHOPPING
          </Link>
        </section>
      </div>
    );
  }

  /*
  ==========================================================
  EMPTY
  ==========================================================
  */

  if (orders.length === 0) {
    return (
      <div className="orders-page">

        <section className="orders-header">
          <div>
            <p className="eyebrow">
              YOUR ACCOUNT
            </p>

            <h1>ORDERS</h1>
          </div>
        </section>

        <section
          style={{
            padding: "100px 20px",
            textAlign: "center",
          }}
        >
          <Package
            size={36}
            strokeWidth={1.2}
          />

          <h2
            style={{
              marginTop: "20px",
            }}
          >
            NO ORDERS YET
          </h2>

          <p
            style={{
              marginTop: "12px",
            }}
          >
            You haven't placed any orders yet.
          </p>

          <Link
            to="/shop"
            style={{
              display: "inline-block",
              marginTop: "30px",
            }}
          >
            START SHOPPING →
          </Link>
        </section>

      </div>
    );
  }

  /*
  ==========================================================
  ORDERS PAGE
  ==========================================================
  */

  return (
    <div className="orders-page">

      {/* HEADER */}

      <section className="orders-header">

        <div>

          <p className="eyebrow">
            YOUR ACCOUNT
          </p>

          <h1>ORDERS</h1>

        </div>

        <p>
          {orders.length} ORDER
          {orders.length !== 1
            ? "S"
            : ""}
        </p>

      </section>


      {/* ORDERS LIST */}

      <section className="orders-list">

        {orders.map((order) => {

          /*
          IMPORTANT:
          Use database ID in URL.

          Example:
          /orders/125

          NOT:
          /orders/UNT-2026-00125
          */

          const orderId =
            Number(order.id);

          return (
            <article
              className="order-card"
              key={order.id}
            >

              {/* ORDER INFORMATION */}

              <div className="order-card-main">

                <div className="order-card-icon">
                  <Package
                    size={22}
                    strokeWidth={1.2}
                  />
                </div>

                <div className="order-card-info">

                  <p className="eyebrow">
                    ORDER
                  </p>

                  <h2>
                    {order.order_number ||
                      `ORDER #${order.id}`}
                  </h2>

                  <p>
                    ORDERED ON{" "}
                    {formatDate(
                      order.created_at
                    )}
                  </p>

                </div>

              </div>


              {/* STATUS */}

              <div className="order-card-status">

                <span>
                  STATUS
                </span>

                <strong>
                  {getStatusLabel(
                    order.order_status
                  )}
                </strong>

              </div>


              {/* TOTAL */}

              <div className="order-card-total">

                <span>
                  TOTAL
                </span>

                <strong>
                  ₹
                  {formatPrice(
                    order.total_amount
                  )}
                </strong>

              </div>


              {/* VIEW ORDER */}

              {Number.isInteger(orderId) &&
              orderId > 0 ? (

                <Link
                  to={`/orders/${orderId}`}
                  className="order-card-link"
                >
                  VIEW ORDER
                  <ChevronRight
                    size={16}
                    strokeWidth={1.3}
                  />
                </Link>

              ) : (

                <span
                  className="order-card-link"
                  style={{
                    opacity: 0.5,
                  }}
                >
                  ORDER ID UNAVAILABLE
                </span>

              )}

            </article>
          );
        })}

      </section>


      {/* CONTINUE SHOPPING */}

      <div
        style={{
          marginTop: "50px",
        }}
      >
        <Link
          to="/shop"
          className="continue-shopping"
        >
          ← CONTINUE SHOPPING
        </Link>
      </div>

    </div>
  );
}

export default Orders;