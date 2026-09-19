import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";

function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/inquiries/admin");

      setInquiries(response.data?.inquiries || []);
    } catch (err) {
      console.error("Failed to fetch inquiries:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load inquiries. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(inquiry.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(inquiry.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(inquiry.subject || "")
          .toLowerCase()
          .includes(searchText) ||
        String(inquiry.message || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        status === "All" || inquiry.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, search, status]);

  const totalInquiries = inquiries.length;

  const newInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "New"
  ).length;

  const repliedInquiries = inquiries.filter(
    (inquiry) =>
      inquiry.status === "In Progress" ||
      inquiry.status === "Resolved"
  ).length;

  const closedInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "Closed"
  ).length;

  const handleDelete = async (id) => {
    const inquiry = inquiries.find(
      (item) => Number(item.id) === Number(id)
    );

    if (!inquiry) return;

    const confirmed = window.confirm(
      `Delete the inquiry from ${inquiry.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/inquiries/admin/${id}`);

      setInquiries((current) =>
        current.filter(
          (item) => Number(item.id) !== Number(id)
        )
      );
    } catch (err) {
      console.error("Failed to delete inquiry:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete inquiry."
      );
    }
  };

  const getStatusClass = (inquiryStatus) => {
    switch (inquiryStatus) {
      case "New":
        return "new";

      case "In Progress":
        return "read";

      case "Resolved":
        return "replied";

      case "Closed":
        return "closed";

      default:
        return "";
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="admin-inquiries-page">
      {/* PAGE HEADER */}
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">CUSTOMER SUPPORT</p>

          <h1>Inquiries</h1>

          <p>
            View and manage messages submitted by customers.
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="admin-inquiries-summary">
        <div className="admin-inquiry-stat">
          <div className="admin-inquiry-stat-icon">
            <MessageSquare
              size={19}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>Total Inquiries</span>
            <strong>{totalInquiries}</strong>
          </div>
        </div>

        <div className="admin-inquiry-stat">
          <div className="admin-inquiry-stat-icon">
            <Clock
              size={19}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>New</span>
            <strong>{newInquiries}</strong>
          </div>
        </div>

        <div className="admin-inquiry-stat">
          <div className="admin-inquiry-stat-icon">
            <CheckCircle
              size={19}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>Resolved</span>
            <strong>{repliedInquiries}</strong>
          </div>
        </div>

        <div className="admin-inquiry-stat">
          <div className="admin-inquiry-stat-icon">
            <XCircle
              size={19}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>Closed</span>
            <strong>{closedInquiries}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-inquiries-toolbar">
        <div className="admin-search-box">
          <Search
            size={17}
            strokeWidth={1.5}
          />

          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="admin-filter-select"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option value="All">All Status</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* ERROR */}
      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="admin-table-card">
        <div className="admin-table-wrapper">
          {loading ? (
            <div className="admin-empty-state">
              <MessageSquare
                size={30}
                strokeWidth={1.4}
              />

              <h3>Loading inquiries...</h3>

              <p>
                Please wait while inquiries are loaded.
              </p>
            </div>
          ) : (
            <>
              <table className="admin-table admin-inquiries-table">
                <thead>
                  <tr>
                    <th>CUSTOMER</th>
                    <th>SUBJECT</th>
                    <th>MESSAGE</th>
                    <th>DATE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td>
                        <div className="admin-inquiry-customer">
                          <div className="admin-inquiry-avatar">
                            {String(inquiry.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {inquiry.name}
                            </strong>

                            <span>
                              {inquiry.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-inquiry-subject">
                          {inquiry.subject}
                        </span>
                      </td>

                      <td>
                        <span className="admin-inquiry-message">
                          {inquiry.message}
                        </span>
                      </td>

                      <td>
                        {formatDate(inquiry.created_at)}
                      </td>

                      <td>
                        <span
                          className={`admin-inquiry-status ${getStatusClass(
                            inquiry.status
                          )}`}
                        >
                          {inquiry.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-inquiry-actions">
                          <Link
                            to={`/admin/inquiries/${inquiry.id}`}
                            className="admin-action-button"
                            aria-label={`View inquiry from ${inquiry.name}`}
                          >
                            <Eye
                              size={16}
                              strokeWidth={1.5}
                            />
                          </Link>

                          <button
                            type="button"
                            className="admin-action-button delete"
                            onClick={() =>
                              handleDelete(inquiry.id)
                            }
                            aria-label={`Delete inquiry from ${inquiry.name}`}
                          >
                            <Trash2
                              size={16}
                              strokeWidth={1.5}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredInquiries.length === 0 && (
                <div className="admin-empty-state">
                  <MessageSquare
                    size={30}
                    strokeWidth={1.4}
                  />

                  <h3>No inquiries found</h3>

                  <p>
                    Try changing your search or status filter.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminInquiries;