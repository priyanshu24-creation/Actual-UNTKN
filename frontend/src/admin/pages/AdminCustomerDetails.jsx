import { useState } from "react";
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

const demoCustomers = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "+91 98765 43210",
    orders: 8,
    totalSpent: 4392,
    registered: "12 Aug 2026",
    status: "Active",
    address: {
      line1: "24 Lake View Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700029",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1024",
        product: "Karma T-Shirt",
        quantity: 1,
        amount: 549,
        date: "18 Sep 2026",
        status: "Delivered",
      },
      {
        id: "UNT-1008",
        product: "History T-Shirt",
        quantity: 2,
        amount: 1098,
        date: "04 Sep 2026",
        status: "Delivered",
      },
      {
        id: "UNT-0987",
        product: "Misery World",
        quantity: 1,
        amount: 899,
        date: "22 Aug 2026",
        status: "Delivered",
      },
    ],
  },
  {
    id: 2,
    name: "Priya Das",
    email: "priya@example.com",
    phone: "+91 98765 12345",
    orders: 5,
    totalSpent: 2745,
    registered: "28 Jul 2026",
    status: "Active",
    address: {
      line1: "18 Park Street",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700016",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1023",
        product: "History T-Shirt",
        quantity: 1,
        amount: 549,
        date: "18 Sep 2026",
        status: "Processing",
      },
      {
        id: "UNT-0992",
        product: "Karma T-Shirt",
        quantity: 2,
        amount: 1098,
        date: "28 Aug 2026",
        status: "Delivered",
      },
    ],
  },
  {
    id: 3,
    name: "Arjun Mehta",
    email: "arjun@example.com",
    phone: "+91 91234 56789",
    orders: 11,
    totalSpent: 8690,
    registered: "14 Jun 2026",
    status: "Active",
    address: {
      line1: "42 Ballygunge Circular Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700019",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1022",
        product: "Misery World",
        quantity: 2,
        amount: 1798,
        date: "17 Sep 2026",
        status: "Shipped",
      },
      {
        id: "UNT-1001",
        product: "Dragon Flame",
        quantity: 1,
        amount: 899,
        date: "01 Sep 2026",
        status: "Delivered",
      },
    ],
  },
  {
    id: 4,
    name: "Ananya Roy",
    email: "ananya@example.com",
    phone: "+91 99887 66554",
    orders: 3,
    totalSpent: 1798,
    registered: "02 Sep 2026",
    status: "Active",
    address: {
      line1: "7 Salt Lake Avenue",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700091",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1021",
        product: "Dragon Flame",
        quantity: 1,
        amount: 899,
        date: "17 Sep 2026",
        status: "Processing",
      },
    ],
  },
  {
    id: 5,
    name: "Aditya Singh",
    email: "aditya@example.com",
    phone: "+91 90012 34567",
    orders: 6,
    totalSpent: 3294,
    registered: "19 Jul 2026",
    status: "Active",
    address: {
      line1: "15 New Town Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700156",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1020",
        product: "Karma T-Shirt",
        quantity: 1,
        amount: 549,
        date: "16 Sep 2026",
        status: "Delivered",
      },
    ],
  },
  {
    id: 6,
    name: "Sneha Roy",
    email: "sneha@example.com",
    phone: "+91 93333 22110",
    orders: 4,
    totalSpent: 2196,
    registered: "05 Aug 2026",
    status: "Active",
    address: {
      line1: "31 Gariahat Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700029",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1019",
        product: "History T-Shirt",
        quantity: 2,
        amount: 1098,
        date: "15 Sep 2026",
        status: "Shipped",
      },
    ],
  },
  {
    id: 7,
    name: "Rohan Das",
    email: "rohan@example.com",
    phone: "+91 87777 66554",
    orders: 2,
    totalSpent: 1448,
    registered: "10 Sep 2026",
    status: "Active",
    address: {
      line1: "9 Behala Main Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700034",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1018",
        product: "Misery World",
        quantity: 1,
        amount: 899,
        date: "14 Sep 2026",
        status: "Cancelled",
      },
    ],
  },
  {
    id: 8,
    name: "Meera Kapoor",
    email: "meera@example.com",
    phone: "+91 95555 44332",
    orders: 7,
    totalSpent: 4895,
    registered: "21 May 2026",
    status: "Active",
    address: {
      line1: "12 Camac Street",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700017",
      country: "India",
    },
    orderHistory: [
      {
        id: "UNT-1009",
        product: "Karma T-Shirt",
        quantity: 1,
        amount: 549,
        date: "05 Sep 2026",
        status: "Delivered",
      },
    ],
  },
];

function AdminCustomerDetails() {
  const { id } = useParams();

  const customer = demoCustomers.find(
    (item) => item.id === Number(id)
  );

  const [customerStatus, setCustomerStatus] = useState(
    customer?.status || "Active"
  );

  if (!customer) {
    return (
      <section className="admin-page admin-customer-details-page">

        <div className="admin-not-found">

          <UsersFallback />

          <h2>Customer Not Found</h2>

          <p>
            The customer you are looking for does not exist.
          </p>

          <Link
            to="/admin/customers"
            className="admin-back-button"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to Customers
          </Link>

        </div>

      </section>
    );
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

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
            {customer.name.charAt(0)}
          </div>

          <h2>{customer.name}</h2>

          <p className="admin-profile-role">
            UNTKN Customer
          </p>

          <div className="admin-profile-contact">

            <a href={`mailto:${customer.email}`}>
              <Mail size={16} strokeWidth={1.5} />
              {customer.email}
            </a>

            <a href={`tel:${customer.phone}`}>
              <Phone size={16} strokeWidth={1.5} />
              {customer.phone}
            </a>

            <span>
              <CalendarDays
                size={16}
                strokeWidth={1.5}
              />
              Joined {customer.registered}
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

            <span>Total Orders</span>

            <strong>{customer.orders}</strong>

          </div>

          <div className="admin-panel admin-customer-stat-card">

            <ShoppingBag
              size={20}
              strokeWidth={1.5}
            />

            <span>Total Spent</span>

            <strong>
              {formatCurrency(customer.totalSpent)}
            </strong>

          </div>

          <div className="admin-panel admin-customer-stat-card">

            <CalendarDays
              size={20}
              strokeWidth={1.5}
            />

            <span>Customer Since</span>

            <strong className="customer-since">
              {customer.registered}
            </strong>

          </div>

          <div className="admin-panel admin-customer-stat-card">

            <UsersFallback />

            <span>Account Status</span>

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
              {customer.orderHistory.length}
            </span>

          </div>

          <div className="admin-customer-orders-list">

            {customer.orderHistory.map((order) => (

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
                    #{order.id}
                  </Link>

                  <span>
                    {order.product}
                  </span>

                  <small>
                    {order.date} · Qty {order.quantity}
                  </small>

                </div>

                <div className="admin-customer-order-right">

                  <strong>
                    {formatCurrency(order.amount)}
                  </strong>

                  <span
                    className={`admin-status-badge ${
                      order.status === "Delivered"
                        ? "delivered"
                        : order.status === "Processing"
                        ? "processing"
                        : order.status === "Shipped"
                        ? "shipped"
                        : "cancelled"
                    }`}
                  >
                    {order.status}
                  </span>

                </div>

              </div>

            ))}

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
                {customer.address.line1}
              </p>

              <p>
                {customer.address.city},{" "}
                {customer.address.state}
              </p>

              <p>
                {customer.address.pincode}
              </p>

              <p>
                {customer.address.country}
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
                  setCustomerStatus(event.target.value)
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
                onClick={() =>
                  alert(
                    "Customer status updated. Backend connection will be added later."
                  )
                }
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


/*
  Small fallback icon component.
  Keeps this page independent from additional icon imports.
*/

function UsersFallback() {
  return (
    <div className="admin-fallback-users-icon">
      <span />
      <span />
    </div>
  );
}

export default AdminCustomerDetails;