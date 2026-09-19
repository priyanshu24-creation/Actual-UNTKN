import { useMemo, useState } from "react";
import {
  Mail,
  Search,
  Trash2,
  Download,
  Send,
  Users,
} from "lucide-react";

const initialSubscribers = [
  {
    id: 1,
    email: "rahul.sharma@gmail.com",
    name: "Rahul Sharma",
    subscribed: "18 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 2,
    email: "priya.das@gmail.com",
    name: "Priya Das",
    subscribed: "17 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 3,
    email: "arjun.mehta@gmail.com",
    name: "Arjun Mehta",
    subscribed: "16 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 4,
    email: "ananya.roy@gmail.com",
    name: "Ananya Roy",
    subscribed: "15 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 5,
    email: "aditya.singh@gmail.com",
    name: "Aditya Singh",
    subscribed: "14 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 6,
    email: "sneha.roy@gmail.com",
    name: "Sneha Roy",
    subscribed: "13 Sep 2026",
    status: "Unsubscribed",
  },
  {
    id: 7,
    email: "rohan.das@gmail.com",
    name: "Rohan Das",
    subscribed: "12 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 8,
    email: "meera.kapoor@gmail.com",
    name: "Meera Kapoor",
    subscribed: "11 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 9,
    email: "kabir.sen@gmail.com",
    name: "Kabir Sen",
    subscribed: "10 Sep 2026",
    status: "Subscribed",
  },
  {
    id: 10,
    email: "ishita.das@gmail.com",
    name: "Ishita Das",
    subscribed: "09 Sep 2026",
    status: "Subscribed",
  },
];

function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        subscriber.name.toLowerCase().includes(searchText) ||
        subscriber.email.toLowerCase().includes(searchText);

      const matchesStatus =
        status === "All" || subscriber.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [subscribers, search, status]);

  const totalSubscribers = subscribers.length;

  const activeSubscribers = subscribers.filter(
    (subscriber) => subscriber.status === "Subscribed"
  ).length;

  const unsubscribed = subscribers.filter(
    (subscriber) => subscriber.status === "Unsubscribed"
  ).length;

  const handleDelete = (id) => {
    const subscriber = subscribers.find(
      (item) => item.id === id
    );

    if (!subscriber) return;

    const confirmed = window.confirm(
      `Remove ${subscriber.email} from the newsletter list?`
    );

    if (!confirmed) return;

    setSubscribers((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const handleExport = () => {
    const csvRows = [
      ["Name", "Email", "Subscribed Date", "Status"],
      ...filteredSubscribers.map((subscriber) => [
        subscriber.name,
        subscriber.email,
        subscriber.subscribed,
        subscriber.status,
      ]),
    ];

    const csvContent = csvRows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "untkn-newsletter-subscribers.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleSendNewsletter = () => {
    alert(
      "Newsletter campaign UI is ready. Sending will be connected to the backend later."
    );
  };

  return (
    <section className="admin-newsletter-page">
      {/* PAGE HEADER */}
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">MARKETING</p>

          <h1>Newsletter</h1>

          <p>
            Manage newsletter subscribers and email campaigns.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={handleSendNewsletter}
        >
          <Send size={17} strokeWidth={1.7} />
          <span>Send Newsletter</span>
        </button>
      </div>

      {/* SUMMARY */}
      <div className="admin-newsletter-summary">
        <div className="admin-newsletter-stat">
          <div className="admin-newsletter-stat-icon">
            <Users size={19} strokeWidth={1.5} />
          </div>

          <div>
            <span>Total Subscribers</span>
            <strong>{totalSubscribers.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-newsletter-stat">
          <div className="admin-newsletter-stat-icon">
            <Mail size={19} strokeWidth={1.5} />
          </div>

          <div>
            <span>Active Subscribers</span>
            <strong>{activeSubscribers.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-newsletter-stat">
          <div className="admin-newsletter-stat-icon">
            <Mail size={19} strokeWidth={1.5} />
          </div>

          <div>
            <span>Unsubscribed</span>
            <strong>{unsubscribed.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-newsletter-toolbar">
        <div className="admin-search-box">
          <Search size={17} strokeWidth={1.5} />

          <input
            type="text"
            placeholder="Search subscribers..."
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
          <option value="Subscribed">Subscribed</option>
          <option value="Unsubscribed">Unsubscribed</option>
        </select>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={handleExport}
        >
          <Download size={16} strokeWidth={1.5} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table admin-newsletter-table">
            <thead>
              <tr>
                <th>SUBSCRIBER</th>
                <th>EMAIL</th>
                <th>SUBSCRIBED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td>
                    <div className="admin-newsletter-subscriber">
                      <div className="admin-newsletter-avatar">
                        {subscriber.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span>{subscriber.name}</span>
                    </div>
                  </td>

                  <td>
                    <span className="admin-newsletter-email">
                      {subscriber.email}
                    </span>
                  </td>

                  <td>{subscriber.subscribed}</td>

                  <td>
                    <span
                      className={
                        subscriber.status === "Subscribed"
                          ? "admin-status-badge subscribed"
                          : "admin-status-badge unsubscribed"
                      }
                    >
                      {subscriber.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="admin-action-button delete"
                      onClick={() =>
                        handleDelete(subscriber.id)
                      }
                      aria-label={`Delete ${subscriber.email}`}
                    >
                      <Trash2
                        size={16}
                        strokeWidth={1.5}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSubscribers.length === 0 && (
            <div className="admin-empty-state">
              <Mail size={30} strokeWidth={1.4} />

              <h3>No subscribers found</h3>

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

export default AdminNewsletter;