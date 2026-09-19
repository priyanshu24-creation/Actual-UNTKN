import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  ShoppingBag,
} from "lucide-react";

const demoOrders = [
  {
    id: "UNT-1024",
    customer: "Rahul Sharma",
    email: "rahul@example.com",
    product: "Karma T-Shirt",
    items: 1,
    amount: 549,
    date: "18 Sep 2026",
    payment: "Paid",
    status: "Delivered",
  },
  {
    id: "UNT-1023",
    customer: "Priya Das",
    email: "priya@example.com",
    product: "History T-Shirt",
    items: 1,
    amount: 549,
    date: "18 Sep 2026",
    payment: "Paid",
    status: "Processing",
  },
  {
    id: "UNT-1022",
    customer: "Arjun Mehta",
    email: "arjun@example.com",
    product: "Misery World",
    items: 2,
    amount: 1798,
    date: "17 Sep 2026",
    payment: "Paid",
    status: "Shipped",
  },
  {
    id: "UNT-1021",
    customer: "Ananya Roy",
    email: "ananya@example.com",
    product: "Dragon Flame",
    items: 1,
    amount: 899,
    date: "17 Sep 2026",
    payment: "Pending",
    status: "Processing",
  },
  {
    id: "UNT-1020",
    customer: "Aditya Singh",
    email: "aditya@example.com",
    product: "Karma T-Shirt",
    items: 1,
    amount: 549,
    date: "16 Sep 2026",
    payment: "Paid",
    status: "Delivered",
  },
  {
    id: "UNT-1019",
    customer: "Sneha Roy",
    email: "sneha@example.com",
    product: "History T-Shirt",
    items: 2,
    amount: 1098,
    date: "15 Sep 2026",
    payment: "Paid",
    status: "Shipped",
  },
  {
    id: "UNT-1018",
    customer: "Rohan Das",
    email: "rohan@example.com",
    product: "Misery World",
    items: 1,
    amount: 899,
    date: "14 Sep 2026",
    payment: "Failed",
    status: "Cancelled",
  },
];

function AdminOrders() {
  const [orders] = useState(demoOrders);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        order.id.toLowerCase().includes(searchValue) ||
        order.customer.toLowerCase().includes(searchValue) ||
        order.email.toLowerCase().includes(searchValue) ||
        order.product.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        order.payment === paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);

  return (
    <section className="admin-orders-page">

      {/* HEADER */}

      <div className="admin-page-header">

        <div>

          <p className="admin-page-eyebrow">
            SALES
          </p>

          <h1>Orders</h1>

          <p>
            Manage customer orders and fulfillment.
          </p>

        </div>

      </div>

      {/* FILTERS */}

      <div className="admin-orders-toolbar">

        <div className="admin-orders-search">

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

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="admin-orders-filter"
        >
          <option value="All">
            All Order Status
          </option>

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

        <select
          value={paymentFilter}
          onChange={(event) =>
            setPaymentFilter(event.target.value)
          }
          className="admin-orders-filter"
        >
          <option value="All">
            All Payments
          </option>

          <option value="Paid">
            Paid
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Failed">
            Failed
          </option>
        </select>

      </div>

      {/* ORDERS PANEL */}

      <div className="admin-orders-panel">

        <div className="admin-panel-heading">

          <div>

            <h2>
              All Orders
            </h2>

            <span>
              {filteredOrders.length} orders
            </span>

          </div>

        </div>

        {filteredOrders.length === 0 ? (

          <div className="admin-orders-empty">

            <ShoppingBag
              size={38}
              strokeWidth={1.3}
            />

            <h3>
              No orders found
            </h3>

            <p>
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          <div className="admin-orders-table-wrapper">

            <table className="admin-orders-table">

              <thead>

                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>PRODUCT</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                  <th>PAYMENT</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>

              </thead>

              <tbody>

                {filteredOrders.map((order) => (

                  <tr key={order.id}>

                    {/* ORDER */}

                    <td>

                      <strong className="admin-order-id">
                        #{order.id}
                      </strong>

                    </td>

                    {/* CUSTOMER */}

                    <td>

                      <div className="admin-order-customer">

                        <strong>
                          {order.customer}
                        </strong>

                        <span>
                          {order.email}
                        </span>

                      </div>

                    </td>

                    {/* PRODUCT */}

                    <td>

                      <div className="admin-order-product">

                        <span>
                          {order.product}
                        </span>

                        <small>
                          {order.items}{" "}
                          {order.items === 1
                            ? "item"
                            : "items"}
                        </small>

                      </div>

                    </td>

                    {/* AMOUNT */}

                    <td>
                      <strong>
                        ₹{order.amount.toLocaleString("en-IN")}
                      </strong>
                    </td>

                    {/* DATE */}

                    <td>
                      {order.date}
                    </td>

                    {/* PAYMENT */}

                    <td>

                      <span
                        className={`admin-payment-status ${order.payment
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {order.payment}
                      </span>

                    </td>

                    {/* ORDER STATUS */}

                    <td>

                      <span
                        className={`admin-order-status ${order.status
                          .toLowerCase()}`}
                      >
                        {order.status}
                      </span>

                    </td>

                    {/* ACTION */}

                    <td>

                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="admin-order-view-button"
                        aria-label={`View ${order.id}`}
                      >
                        <Eye
                          size={16}
                          strokeWidth={1.5}
                        />
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  );
}

export default AdminOrders;