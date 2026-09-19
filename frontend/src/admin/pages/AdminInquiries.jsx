import { useMemo, useState } from "react";
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

const initialInquiries = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "+91 98765 43210",
    subject: "Bulk T-Shirt Order",
    message:
      "I would like to know about bulk pricing for around 50 T-shirts.",
    date: "18 Sep 2026",
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
    status: "Read",
  },
  {
    id: 3,
    name: "Arjun Mehta",
    email: "arjun.mehta@gmail.com",
    phone: "+91 98111 22334",
    subject: "Order Query",
    message:
      "I want to know the current status of my recent order.",
    date: "17 Sep 2026",
    status: "Replied",
  },
  {
    id: 4,
    name: "Ananya Roy",
    email: "ananya.roy@gmail.com",
    phone: "+91 99032 11223",
    subject: "Wholesale Enquiry",
    message:
      "Please share information about your wholesale and reseller program.",
    date: "17 Sep 2026",
    status: "New",
  },
  {
    id: 5,
    name: "Aditya Singh",
    email: "aditya.singh@gmail.com",
    phone: "+91 91234 56789",
    subject: "Return Request",
    message:
      "I would like to discuss returning one of the products from my order.",
    date: "16 Sep 2026",
    status: "Read",
  },
  {
    id: 6,
    name: "Sneha Roy",
    email: "sneha.roy@gmail.com",
    phone: "+91 98300 44556",
    subject: "Collaboration",
    message:
      "I am interested in discussing a possible brand collaboration.",
    date: "15 Sep 2026",
    status: "Replied",
  },
  {
    id: 7,
    name: "Rohan Das",
    email: "rohan.das@gmail.com",
    phone: "+91 98740 77889",
    subject: "Size Exchange",
    message:
      "Can I exchange my current product for one size larger?",
    date: "14 Sep 2026",
    status: "Closed",
  },
  {
    id: 8,
    name: "Meera Kapoor",
    email: "meera.kapoor@gmail.com",
    phone: "+91 98310 99887",
    subject: "General Enquiry",
    message:
      "I would like some information about your upcoming collection.",
    date: "13 Sep 2026",
    status: "New",
  },
];

function AdminInquiries() {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        inquiry.name.toLowerCase().includes(searchText) ||
        inquiry.email.toLowerCase().includes(searchText) ||
        inquiry.subject.toLowerCase().includes(searchText) ||
        inquiry.message.toLowerCase().includes(searchText);

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
    (inquiry) => inquiry.status === "Replied"
  ).length;

  const closedInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "Closed"
  ).length;

  const handleDelete = (id) => {
    const inquiry = inquiries.find(
      (item) => item.id === id
    );

    if (!inquiry) return;

    const confirmed = window.confirm(
      `Delete the inquiry from ${inquiry.name}?`
    );

    if (!confirmed) return;

    setInquiries((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const getStatusClass = (inquiryStatus) => {
    switch (inquiryStatus) {
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
            <span>Replied</span>
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
          <option value="Read">Read</option>
          <option value="Replied">Replied</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="admin-table-card">
        <div className="admin-table-wrapper">
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
                        {inquiry.name
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

                  <td>{inquiry.date}</td>

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
        </div>
      </div>
    </section>
  );
}

export default AdminInquiries;