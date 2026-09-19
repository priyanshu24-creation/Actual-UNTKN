import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Package,
  ShoppingBag,
} from "lucide-react";

import api from "../../services/api.js";

function AdminCustomerDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerStatus, setCustomerStatus] = useState("Active");

  /*
  |--------------------------------------------------------------------------
  | FETCH CUSTOMER DETAILS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/admin/customers/${id}`
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to fetch customer details."
          );
        }

        const customerData = response.data.customer;
        const orderData = response.data.orders || [];

        setCustomer(customerData);
        setOrders(orderData);

        setCustomerStatus(
          customerData.status || "Active"
        );

      } catch (err) {
        console.error(
          "ADMIN CUSTOMER DETAILS ERROR:",
          err
        );

        setCustomer(null);
        setOrders([]);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load customer details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);


  /*
  |--------------------------------------------------------------------------
  | FORMAT CURRENCY
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;

    return `₹${value.toLocaleString("en-IN")}`;
  };


  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (dateValue) => {
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
  };


  /*
  |--------------------------------------------------------------------------
  | ORDER STATUS CLASS
  |--------------------------------------------------------------------------
  */

  const getOrderStatusClass = (status) => {
    const normalizedStatus =
      String(status || "").toLowerCase();

    if (normalizedStatus === "delivered") {
      return "delivered";
    }

    if (normalizedStatus === "processing") {
      return "processing";
    }

    if (normalizedStatus === "shipped") {
      return "shipped";
    }

    if (normalizedStatus === "cancelled") {
      return "cancelled";
    }

    return "processing";
  };


  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section className="admin-page admin-customer-details-page">

        <div className="admin-details-header">
          <div>

            <Link
              to="/admin/customers"
              className="admin-back-link"
            >
              <ArrowLeft
                size={16}
                strokeWidth={1.5}
              />

              Customers
            </Link>

            <p className="admin-eyebrow">
              CUSTOMER PROFILE
            </p>

            <h1 className="admin-page-title">
              Loading...
            </h1>

          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-empty-state">

            <Package
              size={32}
              strokeWidth={1.2}
            />

            <h3>
              Loading customer details...
            </h3>

            <p>
              Please wait while the customer information is being loaded.
            </p>

          </div>
        </div>

      </section>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | CUSTOMER NOT FOUND / ERROR
  |--------------------------------------------------------------------------
  */

  if (!customer) {
    return (
      <section className="admin-page admin-customer-details-page">

        <div className="admin-not-found">

          <div className="admin-fallback-users-icon">
            <span />
            <span />
          </div>

          <h2>
            Customer Not Found
          </h2>

          <p>
            {error ||
              "The customer you are looking for does not exist."}
          </p>

          <Link
            to="/admin/customers"
            className="admin-back-button"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.5}
            />

            Back to Customers
          </Link>

        </div>

      </section>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (
    <section className="admin-page admin-customer-details-page">

      {/* HEADER */}

      <div className="admin-details-header">

        <div>

          <Link
            to="/admin/customers"
            className="admin-back-link"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.5}
            />

            Customers
          </Link>

          <p className="admin-eyebrow">
            CUSTOMER PROFILE
          </p>

          <h1 className="admin-page-title">
            {customer.name}
          </h1>

        </div>

        <span className="admin-status-badge delivered">
          {customerStatus}
        </span>

      </div>


      {/* PROFILE + STATS */}

      <div className="admin-customer-profile-grid">

        {/* PROFILE CARD */}

        <div className="admin-panel admin-customer-profile-card">

          <div className="admin-profile-avatar">
            {customer.name
              ?.charAt(0)
              .toUpperCase() || "?"}
          </div>

          <h2>
            {customer.name}
          </h2>

          <p className="admin-profile-role">
            UNTKN Customer
          </p>

          <div className="admin-profile-contact">

            <a
              href={`mailto:${customer.email}`}
            >
              <Mail
                size={16}
                strokeWidth={1.5}
              />

              {customer.email}
            </a>

            <a
              href={`tel:${customer.phone}`}
            >
              <Phone
                size={16}
                strokeWidth={1.5}
              />

              {customer.phone || "No phone number"}
            </a>

            <span>
              <CalendarDays
                size={16}
                strokeWidth={1.5}
              />

              Joined {formatDate(customer.registered)}
            </span>

          </div>

        </div>


        {/* STATS */}

        <div className="admin-customer-stat-grid">

          <div className="admin-panel admin-customer-stat-card">

            <Package
              size={20}
              strokeWidth={1.5}
            />

            <span>
              Total Orders
            </span>

            <strong>
              {Number(customer.orders) || 0}
            </strong>

          </div>


          <div className="admin-panel admin-customer-stat-card">

            <ShoppingBag
              size={20}
              strokeWidth={1.5}
            />

            <span>
              Total Spent
            </span>

            <strong>
              {formatCurrency(customer.totalSpent)}
            </strong>

          </div>


          <div className="admin-panel admin-customer-stat-card">

            <CalendarDays
              size={20}
              strokeWidth={1.5}
            />

            <span>
              Customer Since
            </span>

            <strong className="customer-since">
              {formatDate(customer.registered)}
            </strong>

          </div>


          <div className="admin-panel admin-customer-stat-card">

            <div className="admin-fallback-users-icon">
              <span />
              <span />
            </div>

            <span>
              Account Status
            </span>

            <strong className="customer-active-text">
              {customerStatus}
            </strong>

          </div>

        </div>

      </div>


      {/* MAIN GRID */}

      <div className="admin-customer-content-grid">

        {/* ORDER HISTORY */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>

              <p className="admin-eyebrow">
                PURCHASES
              </p>

              <h2>
                Order History
              </h2>

            </div>

            <span className="admin-panel-count">
              {orders.length}
            </span>

          </div>


          <div className="admin-customer-orders-list">

            {orders.length === 0 ? (

              <div className="admin-empty-state">

                <Package
                  size={32}
                  strokeWidth={1.2}
                />

                <h3>
                  No orders yet
                </h3>

                <p>
                  This customer has not placed any orders.
                </p>

              </div>

            ) : (

              orders.map((order) => (

                <div
                  className="admin-customer-order"
                  key={order.id}
                >

                  <div className="admin-customer-order-icon">

                    <Package
                      size={17}
                      strokeWidth={1.5}
                    />

                  </div>


                  <div className="admin-customer-order-info">

                    <Link
                      to={`/admin/orders/${order.id}`}
                    >
                      #{order.order_number || order.id}
                    </Link>

                    <span>
                      Order #{order.id}
                    </span>

                    <small>
                      {formatDate(order.created_at)}
                    </small>

                  </div>


                  <div className="admin-customer-order-right">

                    <strong>
                      {formatCurrency(order.total_amount)}
                    </strong>

                    <span
                      className={`admin-status-badge ${getOrderStatusClass(
                        order.order_status
                      )}`}
                    >
                      {order.order_status || "Pending"}
                    </span>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>


        {/* RIGHT COLUMN */}

        <div className="admin-customer-side-column">

          {/* ADDRESS */}

          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <p className="admin-eyebrow">
                  DELIVERY
                </p>

                <h2>
                  Shipping Address
                </h2>

              </div>

              <MapPin
                size={19}
                strokeWidth={1.5}
              />

            </div>


            <div className="admin-address">

              <strong>
                {customer.name}
              </strong>

              <p>
                Shipping address information is not currently available from the customer details API.
              </p>

            </div>

          </div>


          {/* ACCOUNT STATUS */}

          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <p className="admin-eyebrow">
                  ACCOUNT
                </p>

                <h2>
                  Customer Status
                </h2>

              </div>

            </div>


            <div className="admin-status-control">

              <label htmlFor="customer-status">
                Account Status
              </label>

              <select
                id="customer-status"
                value={customerStatus}
                onChange={(event) =>
                  setCustomerStatus(
                    event.target.value
                  )
                }
              >

                <option value="Active">
                  Active
                </option>

                <option value="Blocked">
                  Blocked
                </option>

              </select>


              <button
                type="button"
                className="admin-primary-button"
                onClick={() => {
                  alert(
                    "Customer status update API will be connected next."
                  );
                }}
              >
                UPDATE STATUS
              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default AdminCustomerDetails;