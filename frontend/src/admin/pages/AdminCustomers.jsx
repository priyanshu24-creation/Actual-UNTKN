import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Users,
  Eye,
  Mail,
  CalendarDays,
} from "lucide-react";

import api from "../../services/api.js";

function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH CUSTOMERS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/customers");

        if (response.data?.success) {
          setCustomers(response.data.customers || []);
        } else {
          setCustomers([]);
          setError(
            response.data?.message || "Failed to load customers."
          );
        }
      } catch (err) {
        console.error("ADMIN CUSTOMERS FETCH ERROR:", err);

        setCustomers([]);

        setError(
          err.response?.data?.message ||
            "Failed to load customers. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER CUSTOMERS
  |--------------------------------------------------------------------------
  */

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";
      const phone = customer.phone?.toLowerCase() || "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [search, customers]);

  /*
  |--------------------------------------------------------------------------
  | NEW THIS MONTH
  |--------------------------------------------------------------------------
  */

  const newThisMonth = useMemo(() => {
    const now = new Date();

    return customers.filter((customer) => {
      if (!customer.registered) {
        return false;
      }

      const registeredDate = new Date(customer.registered);

      return (
        registeredDate.getMonth() === now.getMonth() &&
        registeredDate.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [customers]);

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
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section className="admin-page admin-customers-page">

        <div className="admin-page-header">
          <div>
            <p className="admin-eyebrow">CUSTOMERS</p>

            <h1 className="admin-page-title">
              Customers
            </h1>

            <p className="admin-page-description">
              Manage customer accounts and view their purchase activity.
            </p>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-empty-state">
            <Users
              size={32}
              strokeWidth={1.2}
            />

            <h3>Loading customers...</h3>

            <p>
              Please wait while customer data is being loaded.
            </p>
          </div>
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
    <section className="admin-page admin-customers-page">

      {/* PAGE HEADER */}

      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            CUSTOMERS
          </p>

          <h1 className="admin-page-title">
            Customers
          </h1>

          <p className="admin-page-description">
            Manage customer accounts and view their purchase activity.
          </p>
        </div>
      </div>


      {/* ERROR */}

      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}


      {/* SUMMARY */}

      <div className="admin-customer-summary">

        {/* TOTAL CUSTOMERS */}

        <div className="admin-customer-summary-card">

          <div className="admin-customer-summary-icon">
            <Users
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>
              Total Customers
            </span>

            <strong>
              {customers.length}
            </strong>
          </div>

        </div>


        {/* ACTIVE CUSTOMERS */}

        <div className="admin-customer-summary-card">

          <div className="admin-customer-summary-icon">
            <Mail
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>
              Active Customers
            </span>

            <strong>
              {
                customers.filter(
                  (customer) =>
                    customer.status === "Active"
                ).length
              }
            </strong>
          </div>

        </div>


        {/* NEW THIS MONTH */}

        <div className="admin-customer-summary-card">

          <div className="admin-customer-summary-icon">
            <CalendarDays
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>
              New This Month
            </span>

            <strong>
              {newThisMonth}
            </strong>
          </div>

        </div>

      </div>


      {/* TOOLBAR */}

      <div className="admin-toolbar">

        <div className="admin-search-box">

          <Search
            size={18}
            strokeWidth={1.5}
          />

          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <div className="admin-result-count">

          {filteredCustomers.length} customer
          {filteredCustomers.length !== 1 ? "s" : ""}

        </div>

      </div>


      {/* CUSTOMER TABLE */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-table admin-customers-table">

            <thead>

              <tr>
                <th>
                  CUSTOMER
                </th>

                <th>
                  CONTACT
                </th>

                <th>
                  ORDERS
                </th>

                <th>
                  TOTAL SPENT
                </th>

                <th>
                  REGISTERED
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

              {filteredCustomers.map((customer) => (

                <tr key={customer.id}>

                  {/* CUSTOMER */}

                  <td>

                    <div className="admin-customer-info">

                      <div className="admin-customer-avatar">
                        {customer.name
                          ?.charAt(0)
                          .toUpperCase() || "?"}
                      </div>

                      <div>

                        <strong>
                          {customer.name || "Unnamed Customer"}
                        </strong>

                        <span>
                          Customer #{customer.id}
                        </span>

                      </div>

                    </div>

                  </td>


                  {/* CONTACT */}

                  <td>

                    <div className="admin-customer-contact">

                      <span>
                        {customer.email || "—"}
                      </span>

                      <span>
                        {customer.phone || "—"}
                      </span>

                    </div>

                  </td>


                  {/* ORDERS */}

                  <td>

                    <span className="admin-customer-orders">
                      {Number(customer.orders) || 0}
                    </span>

                  </td>


                  {/* TOTAL SPENT */}

                  <td>

                    <strong className="admin-customer-spending">
                      {formatCurrency(customer.totalSpent)}
                    </strong>

                  </td>


                  {/* REGISTERED */}

                  <td>

                    <span className="admin-customer-date">
                      {formatDate(customer.registered)}
                    </span>

                  </td>


                  {/* STATUS */}

                  <td>

                    <span className="admin-status-badge delivered">
                      {customer.status || "Active"}
                    </span>

                  </td>


                  {/* ACTION */}

                  <td>

                    <Link
                      to={`/admin/customers/${customer.id}`}
                      className="admin-view-button"
                      aria-label={`View ${customer.name}`}
                    >
                      <Eye
                        size={17}
                        strokeWidth={1.5}
                      />
                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* EMPTY STATE */}

        {filteredCustomers.length === 0 && (

          <div className="admin-empty-state">

            <Users
              size={32}
              strokeWidth={1.2}
            />

            <h3>
              No customers found
            </h3>

            <p>
              {search
                ? "Try changing your search."
                : "No customer accounts have been registered yet."}
            </p>

          </div>

        )}

      </div>

    </section>
  );
}

export default AdminCustomers;