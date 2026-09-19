import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

const demoOrders = [
  {
    id: "UNT-1024",
    customer: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "+91 98765 43210",
    product: "Karma T-Shirt",
    size: "L",
    quantity: 1,
    amount: 549,
    date: "18 Sep 2026",
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Delivered",
    address: {
      line1: "24 Park Street",
      line2: "Flat 4B",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700016",
      country: "India",
    },
  },
  {
    id: "UNT-1023",
    customer: "Priya Das",
    email: "priya@example.com",
    phone: "+91 98765 12345",
    product: "History T-Shirt",
    size: "M",
    quantity: 1,
    amount: 549,
    date: "18 Sep 2026",
    payment: "Paid",
    paymentMethod: "Card",
    status: "Processing",
    address: {
      line1: "18 Lake View Road",
      line2: "Flat 2A",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700029",
      country: "India",
    },
  },
  {
    id: "UNT-1022",
    customer: "Arjun Mehta",
    email: "arjun@example.com",
    phone: "+91 91234 56789",
    product: "Misery World",
    size: "XL",
    quantity: 2,
    amount: 1798,
    date: "17 Sep 2026",
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Shipped",
    address: {
      line1: "11 Salt Lake Avenue",
      line2: "Sector V",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700091",
      country: "India",
    },
  },
  {
    id: "UNT-1021",
    customer: "Ananya Roy",
    email: "ananya@example.com",
    phone: "+91 99887 66554",
    product: "Dragon Flame",
    size: "S",
    quantity: 1,
    amount: 899,
    date: "17 Sep 2026",
    payment: "Pending",
    paymentMethod: "Cash on Delivery",
    status: "Processing",
    address: {
      line1: "7 New Town Road",
      line2: "Action Area 1",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700156",
      country: "India",
    },
  },
  {
    id: "UNT-1020",
    customer: "Aditya Singh",
    email: "aditya@example.com",
    phone: "+91 90000 11122",
    product: "Karma T-Shirt",
    size: "M",
    quantity: 1,
    amount: 549,
    date: "16 Sep 2026",
    payment: "Paid",
    paymentMethod: "Card",
    status: "Delivered",
    address: {
      line1: "42 Ballygunge Circular Road",
      line2: "Flat 5C",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700019",
      country: "India",
    },
  },
  {
    id: "UNT-1019",
    customer: "Sneha Roy",
    email: "sneha@example.com",
    phone: "+91 93333 44455",
    product: "History T-Shirt",
    size: "L",
    quantity: 2,
    amount: 1098,
    date: "15 Sep 2026",
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Shipped",
    address: {
      line1: "15 Gariahat Road",
      line2: "Flat 3B",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700029",
      country: "India",
    },
  },
  {
    id: "UNT-1018",
    customer: "Rohan Das",
    email: "rohan@example.com",
    phone: "+91 95555 66677",
    product: "Misery World",
    size: "M",
    quantity: 1,
    amount: 899,
    date: "14 Sep 2026",
    payment: "Failed",
    paymentMethod: "Card",
    status: "Cancelled",
    address: {
      line1: "8 Dum Dum Road",
      line2: "Flat 1A",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700074",
      country: "India",
    },
  },
];

function AdminOrderDetails() {
  const { id } = useParams();

  const order = demoOrders.find(
    (item) => item.id === id
  );

  const [orderStatus, setOrderStatus] = useState(
    order?.status || "Processing"
  );

  const handleStatusChange = (event) => {
    setOrderStatus(event.target.value);
  };

  if (!order) {
    return (
      <section className="admin-order-not-found">

        <p className="admin-page-eyebrow">
          SALES
        </p>

        <h1>Order Not Found</h1>

        <p>
          The order you're looking for does not exist.
        </p>

        <Link
          to="/admin/orders"
          className="admin-primary-button"
        >
          <ArrowLeft size={17} />
          Back to Orders
        </Link>

      </section>
    );
  }

  return (
    <section className="admin-order-details-page">

      {/* HEADER */}

      <div className="admin-order-details-header">

        <div>

          <Link
            to="/admin/orders"
            className="admin-back-link"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>

          <p className="admin-page-eyebrow">
            ORDER DETAILS
          </p>

          <div className="admin-order-title-row">

            <h1>
              #{order.id}
            </h1>

            <span
              className={`admin-order-status ${orderStatus.toLowerCase()}`}
            >
              {orderStatus}
            </span>

          </div>

          <p>
            Placed on {order.date}
          </p>

        </div>

      </div>

      {/* MAIN GRID */}

      <div className="admin-order-details-grid">

        {/* LEFT COLUMN */}

        <div className="admin-order-details-main">

          {/* ORDER ITEMS */}

          <div className="admin-order-details-panel">

            <div className="admin-details-panel-header">

              <div>
                <h2>Order Items</h2>
                <span>Products in this order</span>
              </div>

              <Package
                size={20}
                strokeWidth={1.5}
              />

            </div>

            <div className="admin-order-item">

              <div className="admin-order-item-image">
                <div>
                  {order.product.charAt(0)}
                </div>
              </div>

              <div className="admin-order-item-info">

                <strong>
                  {order.product}
                </strong>

                <span>
                  Size: {order.size}
                </span>

                <span>
                  Quantity: {order.quantity}
                </span>

              </div>

              <strong className="admin-order-item-price">
                ₹{order.amount.toLocaleString("en-IN")}
              </strong>

            </div>

          </div>

          {/* TIMELINE */}

          <div className="admin-order-details-panel">

            <div className="admin-details-panel-header">

              <div>
                <h2>Order Timeline</h2>
                <span>
                  Order fulfillment progress
                </span>
              </div>

              <Clock3
                size={20}
                strokeWidth={1.5}
              />

            </div>

            <div className="admin-order-timeline">

              <div className="admin-timeline-item completed">

                <div className="admin-timeline-icon">
                  <CheckCircle2 size={16} />
                </div>

                <div>
                  <strong>
                    Order Placed
                  </strong>

                  <span>
                    Customer placed the order
                  </span>
                </div>

              </div>

              <div
                className={
                  orderStatus === "Cancelled"
                    ? "admin-timeline-item cancelled"
                    : "admin-timeline-item completed"
                }
              >

                <div className="admin-timeline-icon">
                  {orderStatus === "Cancelled" ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>

                <div>
                  <strong>
                    Payment
                  </strong>

                  <span>
                    {order.payment} ·{" "}
                    {order.paymentMethod}
                  </span>
                </div>

              </div>

              <div
                className={
                  ["Shipped", "Delivered"].includes(
                    orderStatus
                  )
                    ? "admin-timeline-item completed"
                    : "admin-timeline-item"
                }
              >

                <div className="admin-timeline-icon">
                  <Truck size={16} />
                </div>

                <div>
                  <strong>
                    Shipped
                  </strong>

                  <span>
                    {["Shipped", "Delivered"].includes(
                      orderStatus
                    )
                      ? "Order has been shipped"
                      : "Waiting for shipment"}
                  </span>
                </div>

              </div>

              <div
                className={
                  orderStatus === "Delivered"
                    ? "admin-timeline-item completed"
                    : "admin-timeline-item"
                }
              >

                <div className="admin-timeline-icon">
                  <CheckCircle2 size={16} />
                </div>

                <div>
                  <strong>
                    Delivered
                  </strong>

                  <span>
                    {orderStatus === "Delivered"
                      ? "Order delivered successfully"
                      : "Waiting for delivery"}
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* PAYMENT SUMMARY */}

          <div className="admin-order-details-panel">

            <div className="admin-details-panel-header">

              <div>
                <h2>Payment Summary</h2>
                <span>
                  Order payment information
                </span>
              </div>

              <CreditCard
                size={20}
                strokeWidth={1.5}
              />

            </div>

            <div className="admin-payment-summary">

              <div>
                <span>Subtotal</span>
                <strong>
                  ₹{order.amount.toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Shipping</span>
                <strong>₹0</strong>
              </div>

              <div>
                <span>Discount</span>
                <strong>₹0</strong>
              </div>

              <div className="total">
                <span>Total</span>
                <strong>
                  ₹{order.amount.toLocaleString("en-IN")}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN */}

        <div className="admin-order-details-side">

          {/* CUSTOMER */}

          <div className="admin-order-details-panel">

            <div className="admin-details-panel-header">

              <div>
                <h2>Customer</h2>
                <span>
                  Customer information
                </span>
              </div>

              <User
                size={20}
                strokeWidth={1.5}
              />

            </div>

            <div className="admin-customer-details">

              <strong>
                {order.customer}
              </strong>

              <span>
                {order.email}
              </span>

              <span>
                {order.phone}
              </span>

            </div>

          </div>

          {/* SHIPPING */}

          <div className="admin-order-details-panel">

            <div className="admin-details-panel-header">

              <div>
                <h2>Shipping Address</h2>
                <span>
                  Delivery information
                </span>
              </div>

              <MapPin
                size={20}
                strokeWidth={1.5}
              />

            </div>

            <div className="admin-address-details">

              <strong>
                {order.customer}
              </strong>

              <span>
                {order.address.line1}
              </span>

              <span>
                {order.address.line2}
              </span>

              <span>
                {order.address.city},{" "}
                {order.address.state}
              </span>

              <span>
                {order.address.pincode}
              </span>

              <span>
                {order.address.country}
              </span>

            </div>

          </div>

          {/* UPDATE STATUS */}

          <div className="admin-order-details-panel">

            <div className="admin-details-panel-header">

              <div>
                <h2>Order Status</h2>
                <span>
                  Update fulfillment status
                </span>
              </div>

            </div>

            <div className="admin-order-status-control">

              <label htmlFor="orderStatus">
                Current Status
              </label>

              <select
                id="orderStatus"
                value={orderStatus}
                onChange={handleStatusChange}
              >
                <option value="Processing">
                  Processing
                </option>

                <option value="Shipped">
                  Shipped
                </option>

                <option value="Delivered">
                  Delivered
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>

              <button
                type="button"
                className="admin-update-status-button"
                onClick={() =>
                  alert(
                    `Status changed to ${orderStatus}. Backend connection will be added later.`
                  )
                }
              >
                Update Status
              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default AdminOrderDetails;