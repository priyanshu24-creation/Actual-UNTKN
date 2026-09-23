import { useEffect, useState } from "react";
import {
  ShoppingBag,
  IndianRupee,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

import api from "../../services/api";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("30");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");

      if (response.data?.success) {
        setDashboard(response.data);
      } else {
        setError(
          response.data?.message || "Failed to load dashboard"
        );
      }
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOrderStatusClass = (status) => {
    if (!status) return "";

    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  /*
   * Backend dashboard data
   *
   * Expected:
   *
   * dashboard.stats
   * dashboard.recent_orders
   *
   * The fallbacks prevent the UI from crashing
   * if a particular value is missing.
   */

  const statsData = dashboard?.statistics || {};

  const stats = [
    {
      label: "TOTAL SALES",
      value: formatCurrency(
        statsData.total_revenue
      ),
      change: statsData.sales_change
        ? `${statsData.sales_change}%`
        : "—",
      positive:
        Number(statsData.sales_change || 0) >= 0,
      icon: IndianRupee,
    },
    {
      label: "TOTAL ORDERS",
      value: Number(
        statsData.total_orders || 0
      ).toLocaleString("en-IN"),
      change: statsData.orders_change
        ? `${statsData.orders_change}%`
        : "—",
      positive:
        Number(statsData.orders_change || 0) >= 0,
      icon: ShoppingBag,
    },
    {
      label: "CUSTOMERS",
      value: Number(
        statsData.total_users || 0
      ).toLocaleString("en-IN"),
      change: statsData.customers_change
        ? `${statsData.customers_change}%`
        : "—",
      positive:
        Number(statsData.customers_change || 0) >= 0,
      icon: Users,
    },
    {
      label: "PRODUCTS",
      value: Number(
        statsData.total_products || 0
      ).toLocaleString("en-IN"),
      change: statsData.products_change
        ? `${statsData.products_change}%`
        : "—",
      positive:
        Number(statsData.products_change || 0) >= 0,
      icon: Package,
    },
  ];

  const recentOrders =
    dashboard?.recent_orders || [];

  /*
   * Low stock data
   *
   * If your backend later returns low_stock_products,
   * this section will automatically use it.
   */

  const lowStockProducts =
    dashboard?.low_stock_products || [];

  const displayLowStock =
    lowStockProducts.length > 0
      ? lowStockProducts
      : [];

  return (
    <div className="admin-dashboard">

      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="admin-page-header">

        <div>
          <p className="admin-eyebrow">
            01 / OVERVIEW
          </p>

          <h1>Dashboard</h1>

          <p className="admin-page-description">
            Welcome back. Here's what's happening
            with your store today.
          </p>
        </div>

        <div className="admin-date">

          <Clock
            size={15}
            strokeWidth={1.5}
          />

          <span>
            {new Date().toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            ).toUpperCase()}
          </span>

        </div>

      </div>


      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="admin-dashboard-error">
          {error}
        </div>
      )}


      {/* =========================================
          STAT CARDS
      ========================================= */}

      <section className="admin-stats">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="admin-stat-card"
              key={stat.label}
            >

              <div className="admin-stat-top">

                <span className="admin-stat-label">
                  {stat.label}
                </span>

                <Icon
                  size={18}
                  strokeWidth={1.4}
                />

              </div>

              <div className="admin-stat-value">

                {loading
                  ? "—"
                  : stat.value}

              </div>

              <div
                className={
                  stat.positive
                    ? "admin-stat-change positive"
                    : "admin-stat-change negative"
                }
              >

                {stat.positive ? (
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                  />
                ) : (
                  <ArrowDownRight
                    size={14}
                    strokeWidth={1.5}
                  />
                )}

                <span>
                  {loading
                    ? "—"
                    : stat.change}
                </span>

                <span className="admin-stat-period">
                  vs last month
                </span>

              </div>

            </div>
          );
        })}

      </section>


      {/* =========================================
          DASHBOARD GRID
      ========================================= */}

      <section className="admin-dashboard-grid">

        {/* =====================================
            SALES OVERVIEW
        ===================================== */}

        <div className="admin-panel admin-sales-panel">

          <div className="admin-panel-header">

            <div>

              <p className="admin-panel-label">
                SALES
              </p>

              <h2>
                Sales Overview
              </h2>

            </div>

            <select
              className="admin-select"
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value)
              }
            >

              <option value="7">
                Last 7 days
              </option>

              <option value="30">
                Last 30 days
              </option>

              <option value="90">
                Last 90 days
              </option>

            </select>

          </div>


          {/* =====================================
              SALES CHART
          ===================================== */}

          <div className="admin-chart">

            <div className="admin-chart-y-axis">
              <span>₹50K</span>
              <span>₹40K</span>
              <span>₹30K</span>
              <span>₹20K</span>
              <span>₹10K</span>
              <span>₹0</span>
            </div>

            <div className="admin-chart-area">

              <div className="admin-chart-lines">
                {/* Horizontal guideline lines */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>

              <div className="admin-chart-bars">
                {(() => {
                  const sales = dashboard?.sales_overview || [];
                  if (sales.length === 0) return null;
                  const maxTotal = Math.max(...sales.map((s) => s.total), 0);
                  return sales.map((s) => {
                    const height = maxTotal ? (s.total / maxTotal) * 100 : 0;
                    return (
                      <div
                        key={s.date}
                        className="admin-chart-bar"
                        title={`${formatDate(s.date)}: ${formatCurrency(s.total)}`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  });
                })()}
              </div>

              <div className="admin-chart-x-axis">
                {(() => {
                  const sales = dashboard?.sales_overview || [];
                  return sales.map((s) => (
                    <span key={s.date}>
                      {new Date(s.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  ));
                })()}
              </div>

            </div>

          </div>

        </div>


        {/* =====================================
            LOW STOCK
        ===================================== */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>

              <p className="admin-panel-label">
                INVENTORY
              </p>

              <h2>
                Low Stock
              </h2>

            </div>

            <span className="admin-panel-count">
              {displayLowStock.length} ITEMS
            </span>

          </div>


          <div className="admin-stock-list">

            {loading ? (
              <div className="admin-stock-empty">
                Loading inventory...
              </div>
            ) : displayLowStock.length === 0 ? (
              <div className="admin-stock-empty">
                No low-stock products.
              </div>
            ) : (
              displayLowStock.map(
                (product) => (
                  <div
                    className="admin-stock-item"
                    key={
                      product.id ||
                      product.name
                    }
                  >

                    <div>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.category ||
                          "Product"}
                      </p>

                    </div>

                    <span className="admin-stock-number">
                      {product.stock ??
                        product.stock_quantity ??
                        0}
                    </span>

                  </div>
                )
              )
            )}

          </div>

        </div>

      </section>


      {/* =========================================
          RECENT ORDERS
      ========================================= */}

      <section className="admin-panel admin-orders-panel">

        <div className="admin-panel-header">

          <div>

            <p className="admin-panel-label">
              ORDERS
            </p>

            <h2>
              Recent Orders
            </h2>

          </div>

          <button
            type="button"
            className="admin-text-button"
          >
            VIEW ALL →
          </button>

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
                  STATUS
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="5"
                    className="admin-table-empty"
                  >
                    Loading orders...
                  </td>

                </tr>

              ) : recentOrders.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="admin-table-empty"
                  >
                    No recent orders found.
                  </td>

                </tr>

              ) : (

                recentOrders.map(
                  (order) => (

                    <tr
                      key={
                        order.id ||
                        order.order_id
                      }
                    >

                      <td>

                        <strong>
                          {order.order_number ||
                            `#${order.id}`}
                        </strong>

                      </td>


                      <td>
                        {order.customer_name ||
                          order.shipping_name ||
                          "Unknown"}
                      </td>


                      <td>
                        {order.product_name ||
                          order.product ||
                          "Multiple items"}
                      </td>


                      <td>
                        {formatCurrency(
                          order.total_amount ??
                            order.amount
                        )}
                      </td>


                      <td>

                        <span
                          className={`admin-order-status ${getOrderStatusClass(
                            order.order_status ||
                              order.status
                          )}`}
                        >
                          {order.order_status ||
                            order.status ||
                            "Pending"}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default AdminDashboard;