import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  CalendarDays,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";

const inquiries = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "+91 98765 43210",
    subject: "Bulk T-Shirt Order",
    message:
      "I would like to know about bulk pricing for around 50 T-shirts. Please let me know if you offer any special pricing for bulk orders and what the minimum order quantity is.",
    date: "18 Sep 2026",
    time: "10:42 AM",
    status: "New",
  },
  {
    id: 2,
    name: "Priya Das",
    email: "priya.das@gmail.com",
    phone: "+91 98321 45678",
    subject: "Product Availability",
    message:
      "Could you please let me know when the History T-Shirt will be available in XL?",
    date: "18 Sep 2026",
    time: "09:18 AM",
    status: "Read",
  },
  {
    id: 3,
    name: "Arjun Mehta",
    email: "arjun.mehta@gmail.com",
    phone: "+91 98111 22334",
    subject: "Order Query",
    message:
      "I want to know the current status of my recent order. The order was placed recently and I would like to know when it will be shipped.",
    date: "17 Sep 2026",
    time: "04:35 PM",
    status: "Replied",
  },
  {
    id: 4,
    name: "Ananya Roy",
    email: "ananya.roy@gmail.com",
    phone: "+91 99032 11223",
    subject: "Wholesale Enquiry",
    message:
      "Please share information about your wholesale and reseller program. I would like to know about the pricing, minimum order quantity and available products.",
    date: "17 Sep 2026",
    time: "01:22 PM",
    status: "New",
  },
  {
    id: 5,
    name: "Aditya Singh",
    email: "aditya.singh@gmail.com",
    phone: "+91 91234 56789",
    subject: "Return Request",
    message:
      "I would like to discuss returning one of the products from my order. Please let me know the return procedure.",
    date: "16 Sep 2026",
    time: "11:05 AM",
    status: "Read",
  },
  {
    id: 6,
    name: "Sneha Roy",
    email: "sneha.roy@gmail.com",
    phone: "+91 98300 44556",
    subject: "Collaboration",
    message:
      "I am interested in discussing a possible brand collaboration. Please let me know whom I should contact regarding this.",
    date: "15 Sep 2026",
    time: "03:14 PM",
    status: "Replied",
  },
  {
    id: 7,
    name: "Rohan Das",
    email: "rohan.das@gmail.com",
    phone: "+91 98740 77889",
    subject: "Size Exchange",
    message:
      "Can I exchange my current product for one size larger? Please let me know the exchange procedure.",
    date: "14 Sep 2026",
    time: "06:20 PM",
    status: "Closed",
  },
  {
    id: 8,
    name: "Meera Kapoor",
    email: "meera.kapoor@gmail.com",
    phone: "+91 98310 99887",
    subject: "General Enquiry",
    message:
      "I would like some information about your upcoming collection and when it will be available on the website.",
    date: "13 Sep 2026",
    time: "12:10 PM",
    status: "New",
  },
];

function AdminInquiryDetails() {
  const { id } = useParams();

  const inquiry = inquiries.find(
    (item) => String(item.id) === String(id)
  );

  const [inquiryStatus, setInquiryStatus] = useState(
    inquiry?.status || "New"
  );

  const [reply, setReply] = useState("");

  if (!inquiry) {
    return (
      <section className="admin-inquiry-details-page">
        <div className="admin-detail-not-found">
          <MessageSquare
            size={36}
            strokeWidth={1.4}
          />

          <h2>Inquiry Not Found</h2>

          <p>
            The inquiry you are looking for does not exist.
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

  const getStatusClass = (currentStatus) => {
    switch (currentStatus) {
      case "New":
        return "new";

      case "Read":
        return "read";

      case "Replied":
        return "replied";

      case "Closed":
        return "closed";

      default:
        return "";
    }
  };

  const handleStatusUpdate = () => {
    alert(
      `Inquiry status changed to "${inquiryStatus}". Backend update will be connected later.`
    );
  };

  const handleReply = () => {
    if (!reply.trim()) {
      alert("Please write a reply first.");
      return;
    }

    alert(
      "Reply is ready. Email sending will be connected to the backend later."
    );

    setReply("");
  };

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
              {inquiry.date}
            </span>

            <span>{inquiry.time}</span>

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
              >
                <Send
                  size={16}
                  strokeWidth={1.5}
                />
                Send Reply
              </button>
            </div>
          </div>
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

                  <a href={`mailto:${inquiry.email}`}>
                    {inquiry.email}
                  </a>
                </div>
              </div>

              <div className="admin-contact-row">
                <div className="admin-contact-icon">
                  <Phone
                    size={16}
                    strokeWidth={1.5}
                  />
                </div>

                <div>
                  <span>Phone</span>

                  <a href={`tel:${inquiry.phone}`}>
                    {inquiry.phone}
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
                <option value="Read">Read</option>
                <option value="Replied">Replied</option>
                <option value="Closed">Closed</option>
              </select>

              <button
                type="button"
                className="admin-primary-button"
                onClick={handleStatusUpdate}
              >
                <CheckCircle
                  size={16}
                  strokeWidth={1.5}
                />
                Update Status
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

              <a
                href={`tel:${inquiry.phone}`}
                className="admin-secondary-button"
              >
                <Phone
                  size={16}
                  strokeWidth={1.5}
                />
                Call Customer
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default AdminInquiryDetails;