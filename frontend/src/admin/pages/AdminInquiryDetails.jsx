import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  CalendarDays,
  MessageSquare,
  CheckCircle,
  Send,
} from "lucide-react";
import api from "../../services/api.js";

function AdminInquiryDetails() {
  const { id } = useParams();

  const [inquiry, setInquiry] = useState(null);
  const [inquiryStatus, setInquiryStatus] = useState("New");
  const [reply, setReply] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingReply, setSavingReply] = useState(false);
  const [error, setError] = useState("");

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/inquiries/admin/${id}`
      );

      const data = response.data?.inquiry;

      setInquiry(data || null);
      setInquiryStatus(data?.status || "New");
      setReply(data?.admin_response || "");
    } catch (err) {
      console.error("Failed to fetch inquiry:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load inquiry."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  const getStatusClass = (currentStatus) => {
    switch (currentStatus) {
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

    return new Date(dateValue).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "";

    return new Date(dateValue).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const handleStatusUpdate = async () => {
    try {
      setSavingStatus(true);

      const response = await api.patch(
        `/inquiries/admin/${id}`,
        {
          status: inquiryStatus,
        }
      );

      const updatedInquiry =
        response.data?.inquiry;

      if (updatedInquiry) {
        setInquiry(updatedInquiry);
        setInquiryStatus(updatedInquiry.status);
        setReply(updatedInquiry.admin_response || "");
      }

      alert("Inquiry status updated successfully.");
    } catch (err) {
      console.error(
        "Failed to update inquiry status:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update inquiry status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) {
      alert("Please write a reply first.");
      return;
    }

    try {
      setSavingReply(true);

      const response = await api.patch(
        `/inquiries/admin/${id}`,
        {
          admin_response: reply.trim(),
          status:
            inquiryStatus === "New"
              ? "Resolved"
              : inquiryStatus,
        }
      );

      const updatedInquiry =
        response.data?.inquiry;

      if (updatedInquiry) {
        setInquiry(updatedInquiry);
        setInquiryStatus(updatedInquiry.status);
        setReply(updatedInquiry.admin_response || "");
      }

      alert(
        "Reply saved successfully. Email sending will be connected later."
      );
    } catch (err) {
      console.error(
        "Failed to save inquiry reply:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to save reply."
      );
    } finally {
      setSavingReply(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-inquiry-details-page">
        <div className="admin-detail-not-found">
          <MessageSquare
            size={36}
            strokeWidth={1.4}
          />

          <h2>Loading Inquiry...</h2>

          <p>
            Please wait while the inquiry is loaded.
          </p>
        </div>
      </section>
    );
  }

  if (error || !inquiry) {
    return (
      <section className="admin-inquiry-details-page">
        <div className="admin-detail-not-found">
          <MessageSquare
            size={36}
            strokeWidth={1.4}
          />

          <h2>Inquiry Not Found</h2>

          <p>
            {error ||
              "The inquiry you are looking for does not exist."}
          </p>

          <Link
            to="/admin/inquiries"
            className="admin-primary-button"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.5}
            />

            Back to Inquiries
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-inquiry-details-page">
      {/* BACK */}
      <Link
        to="/admin/inquiries"
        className="admin-back-link"
      >
        <ArrowLeft
          size={16}
          strokeWidth={1.5}
        />

        <span>Back to Inquiries</span>
      </Link>

      {/* HEADER */}
      <div className="admin-inquiry-detail-header">
        <div>
          <p className="admin-eyebrow">
            CUSTOMER INQUIRY
          </p>

          <h1>{inquiry.subject}</h1>

          <div className="admin-inquiry-detail-meta">
            <span>
              <CalendarDays
                size={14}
                strokeWidth={1.5}
              />

              {formatDate(inquiry.created_at)}
            </span>

            <span>
              {formatTime(inquiry.created_at)}
            </span>

            <span
              className={`admin-inquiry-status ${getStatusClass(
                inquiryStatus
              )}`}
            >
              {inquiryStatus}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-inquiry-details-grid">
        {/* LEFT */}
        <div className="admin-inquiry-details-main">
          {/* MESSAGE */}
          <div className="admin-detail-panel">
            <div className="admin-detail-panel-header">
              <div>
                <p className="admin-panel-eyebrow">
                  MESSAGE
                </p>

                <h2>Customer Message</h2>
              </div>

              <MessageSquare
                size={20}
                strokeWidth={1.4}
              />
            </div>

            <div className="admin-inquiry-full-message">
              <p>{inquiry.message}</p>
            </div>
          </div>

          {/* REPLY */}
          <div className="admin-detail-panel">
            <div className="admin-detail-panel-header">
              <div>
                <p className="admin-panel-eyebrow">
                  RESPONSE
                </p>

                <h2>Reply to Customer</h2>
              </div>

              <Send
                size={20}
                strokeWidth={1.4}
              />
            </div>

            <textarea
              className="admin-inquiry-reply"
              placeholder="Write your reply..."
              value={reply}
              onChange={(event) =>
                setReply(event.target.value)
              }
              rows={7}
            />

            <div className="admin-reply-footer">
              <span>
                Reply will be sent to {inquiry.email}
              </span>

              <button
                type="button"
                className="admin-primary-button"
                onClick={handleReply}
                disabled={savingReply}
              >
                <Send
                  size={16}
                  strokeWidth={1.5}
                />

                {savingReply
                  ? "Saving..."
                  : "Save Reply"}
              </button>
            </div>
          </div>

          {/* EXISTING RESPONSE */}
          {inquiry.admin_response && (
            <div className="admin-detail-panel">
              <div className="admin-detail-panel-header">
                <div>
                  <p className="admin-panel-eyebrow">
                    SAVED RESPONSE
                  </p>

                  <h2>Admin Response</h2>
                </div>
              </div>

              <div className="admin-inquiry-full-message">
                <p>{inquiry.admin_response}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <aside className="admin-inquiry-details-side">
          {/* CUSTOMER */}
          <div className="admin-detail-panel">
            <div className="admin-detail-panel-header">
              <div>
                <p className="admin-panel-eyebrow">
                  CUSTOMER
                </p>

                <h2>Contact Information</h2>
              </div>
            </div>

            <div className="admin-customer-contact">
              <div className="admin-contact-row">
                <div className="admin-contact-icon">
                  <User
                    size={16}
                    strokeWidth={1.5}
                  />
                </div>

                <div>
                  <span>Name</span>
                  <strong>{inquiry.name}</strong>
                </div>
              </div>

              <div className="admin-contact-row">
                <div className="admin-contact-icon">
                  <Mail
                    size={16}
                    strokeWidth={1.5}
                  />
                </div>

                <div>
                  <span>Email</span>

                  <a
                    href={`mailto:${inquiry.email}`}
                  >
                    {inquiry.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div className="admin-detail-panel">
            <div className="admin-detail-panel-header">
              <div>
                <p className="admin-panel-eyebrow">
                  MANAGEMENT
                </p>

                <h2>Inquiry Status</h2>
              </div>
            </div>

            <div className="admin-inquiry-status-control">
              <label htmlFor="inquiry-status">
                STATUS
              </label>

              <select
                id="inquiry-status"
                value={inquiryStatus}
                onChange={(event) =>
                  setInquiryStatus(event.target.value)
                }
              >
                <option value="New">New</option>
                <option value="In Progress">
                  In Progress
                </option>
                <option value="Resolved">
                  Resolved
                </option>
                <option value="Closed">
                  Closed
                </option>
              </select>

              <button
                type="button"
                className="admin-primary-button"
                onClick={handleStatusUpdate}
                disabled={savingStatus}
              >
                <CheckCircle
                  size={16}
                  strokeWidth={1.5}
                />

                {savingStatus
                  ? "Updating..."
                  : "Update Status"}
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="admin-detail-panel">
            <div className="admin-detail-panel-header">
              <div>
                <p className="admin-panel-eyebrow">
                  QUICK ACTIONS
                </p>

                <h2>Contact Customer</h2>
              </div>
            </div>

            <div className="admin-quick-actions">
              <a
                href={`mailto:${inquiry.email}`}
                className="admin-secondary-button"
              >
                <Mail
                  size={16}
                  strokeWidth={1.5}
                />

                Email Customer
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default AdminInquiryDetails;