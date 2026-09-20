import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Package, AlertCircle } from "lucide-react";

import api from "../../services/api.js";

function formatCurrency(value, currency = "INR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getOrderStatusLabel(status) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "PENDING";

    case "confirmed":
      return "CONFIRMED";

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
}

function getPaymentStatusLabel(status) {
  switch (normalizeStatus(status)) {
    case "paid":
      return "PAID";

    case "pending":
      return "PENDING";

    case "failed":
      return "FAILED";

    case "refunded":
      return "REFUNDED";

    case "cancelled":
      return "CANCELLED";

    default:
      return String(status || "PENDING").toUpperCase();
  }
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");

  const [orderStatusFilter, setOrderStatusFilter] =
    useState("All");

  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ==========================================================
  LOAD REAL ORDERS
  ==========================================================
  */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/admin");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load orders."
        );
      }

      const backendOrders = Array.isArray(
        response.data?.orders
      )
        ? response.data.orders
        : [];

      setOrders(backendOrders);
    } catch (requestError) {
      console.error(
        "Admin orders load error:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load orders."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /*
  ==========================================================
  FILTER ORDERS
  ==========================================================
  */

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const orderNumber = String(
        order?.order_number || ""
      ).toLowerCase();

      const customerName = String(
        order?.customer_name ||
          order?.shipping_name ||
          ""
      ).toLowerCase();

      const customerEmail = String(
        order?.shipping_email ||
          order?.customer_email ||
          ""
      ).toLowerCase();

      const customerPhone = String(
        order?.shipping_phone || ""
      ).toLowerCase();

      const productName = String(
        order?.product_name || ""
      ).toLowerCase();

      const orderStatus =
        normalizeStatus(
          order?.order_status
        );

      const paymentStatus =
        normalizeStatus(
          order?.payment_status
        );

      const matchesSearch =
        !query ||
        orderNumber.includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        customerPhone.includes(query) ||
        productName.includes(query);

      const matchesOrderStatus =
        orderStatusFilter === "All" ||
        orderStatus ===
          normalizeStatus(orderStatusFilter);

      const matchesPaymentStatus =
        paymentStatusFilter === "All" ||
        paymentStatus ===
          normalizeStatus(paymentStatusFilter);

      return (
        matchesSearch &&
        matchesOrderStatus &&
        matchesPaymentStatus
      );
    });
  }, [
    orders,
    search,
    orderStatusFilter,
    paymentStatusFilter,
  ]);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <div className="admin-page">

        <div className="admin-page-header">
          <div>
            <p className="admin-eyebrow">
              SALES
            </p>

            <h1>Orders</h1>

            <p>
              Manage customer orders and fulfillment.
            </p>
          </div>
        </div>

        <div className="admin-empty-state">
          <Package
            size={32}
            strokeWidth={1.3}
          />

          <h3>
            Loading orders...
          </h3>

          <p>
            Fetching orders from the database.
          </p>
        </div>

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
      <div className="admin-page">

        <div className="admin-page-header">
          <div>
            <p className="admin-eyebrow">
              SALES
            </p>

            <h1>Orders</h1>

            <p>
              Manage customer orders and fulfillment.
            </p>
          </div>
        </div>

        <div className="admin-empty-state">

          <AlertCircle
            size={32}
            strokeWidth={1.3}
          />

          <h3>
            Failed to load orders
          </h3>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="admin-primary-button"
            onClick={loadOrders}
          >
            TRY AGAIN
          </button>

        </div>

      </div>
    );
  }

  /*
  ==========================================================
  MAIN PAGE
  ==========================================================
  */

  return (
    <div className="admin-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-page-header">

        <div>

          <p className="admin-eyebrow">
            SALES
          </p>

          <h1>
            Orders
          </h1>

          <p>
            Manage customer orders and fulfillment.
          </p>

        </div>

      </div>


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="admin-filters">

        {/* SEARCH */}

        <div className="admin-search">

          <Search
            size={18}
            strokeWidth={1.5}
          />

          <input
            type="text"
            placeholder="Search order, customer or product..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        {/* ORDER STATUS */}

        <div className="admin-filter-group">

          <select
            value={orderStatusFilter}
            onChange={(event) =>
              setOrderStatusFilter(
                event.target.value
              )
            }
            aria-label="Filter by order status"
          >

            <option value="All">
              All Order Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="processing">
              Processing
            </option>

            <option value="shipped">
              Shipped
            </option>

            <option value="delivered">
              Delivered
            </option>

            <option value="cancelled">
              Cancelled
            </option>

          </select>

        </div>


        {/* PAYMENT STATUS */}

        <div className="admin-filter-group">

          <select
            value={paymentStatusFilter}
            onChange={(event) =>
              setPaymentStatusFilter(
                event.target.value
              )
            }
            aria-label="Filter by payment status"
          >

            <option value="All">
              All Payments
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="failed">
              Failed
            </option>

            <option value="refunded">
              Refunded
            </option>

            <option value="cancelled">
              Cancelled
            </option>

          </select>

        </div>

      </div>


      {/* =====================================================
          ORDERS TABLE
      ===================================================== */}

      <div className="admin-table-card">

        <div className="admin-table-header">

          <div>

            <h2>
              All Orders
            </h2>

            <p>
              {filteredOrders.length} order
              {filteredOrders.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

        </div>


        <div className="admin-table-wrapper">

          <table className="admin-table">

            <thead>

              <tr>

                <th>
                  ORDER
                </th>

                <th>
                  CUSTOMER
                </th>

                <th>
                  PRODUCT
                </th>

                <th>
                  AMOUNT
                </th>

                <th>
                  DATE
                </th>

                <th>
                  PAYMENT
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTION
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredOrders.map((order) => {

                const orderId =
                  Number(order?.id);

                const customerName =
                  order?.customer_name ||
                  order?.shipping_name ||
                  "Unknown Customer";

                const customerEmail =
                  order?.shipping_email ||
                  order?.customer_email ||
                  "—";

                const productName =
                  order?.product_name ||
                  order?.product ||
                  "—";

                const itemCount =
                  Number(
                    order?.item_count ||
                      order?.items_count ||
                      0
                  );

                const totalAmount =
                  Number(
                    order?.total_amount || 0
                  );

                const currency =
                  order?.currency ||
                  "INR";

                return (
                  <tr
                    key={
                      orderId ||
                      order?.order_number
                    }
                  >

                    {/* ORDER */}

                    <td>

                      <strong>
                        #
                        {order?.order_number ||
                          orderId}
                      </strong>

                    </td>


                    {/* CUSTOMER */}

                    <td>

                      <div className="admin-table-primary">

                        <strong>
                          {customerName}
                        </strong>

                        <span>
                          {customerEmail}
                        </span>

                      </div>

                    </td>


                    {/* PRODUCT */}

                    <td>

                      <div className="admin-table-primary">

                        <strong>
                          {productName}
                        </strong>

                        <span>
                          {itemCount > 0
                            ? `${itemCount} item${
                                itemCount !== 1
                                  ? "s"
                                  : ""
                              }`
                            : "Order items"}
                        </span>

                      </div>

                    </td>


                    {/* AMOUNT */}

                    <td>

                      <strong>
                        {formatCurrency(
                          totalAmount,
                          currency
                        )}
                      </strong>

                    </td>


                    {/* DATE */}

                    <td>
                      {formatDate(
                        order?.created_at
                      )}
                    </td>


                    {/* PAYMENT */}

                    <td>

                      <span
                        className={`admin-status-badge payment-${normalizeStatus(
                          order?.payment_status
                        )}`}
                      >
                        {getPaymentStatusLabel(
                          order?.payment_status
                        )}
                      </span>

                    </td>


                    {/* ORDER STATUS */}

                    <td>

                      <span
                        className={`admin-status-badge status-${normalizeStatus(
                          order?.order_status
                        )}`}
                      >
                        {getOrderStatusLabel(
                          order?.order_status
                        )}
                      </span>

                    </td>


                    {/* ACTION */}

                    <td>

                      {orderId > 0 ? (

                        <button
                          type="button"
                          className="admin-icon-button"
                          title="View order"
                          aria-label={`View order ${
                            order?.order_number ||
                            orderId
                          }`}
                          onClick={() => {
                            window.location.href =
                              `/admin/orders/${orderId}`;
                          }}
                        >

                          <Eye
                            size={16}
                            strokeWidth={1.5}
                          />

                        </button>

                      ) : (

                        <span>
                          —
                        </span>

                      )}

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>


        {/* ===================================================
            EMPTY FILTER RESULT
        =================================================== */}

        {filteredOrders.length === 0 && (

          <div className="admin-empty-state">

            <Package
              size={32}
              strokeWidth={1.3}
            />

            <h3>
              No orders found
            </h3>

            <p>
              No database orders match the
              current search or filters.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminOrders;