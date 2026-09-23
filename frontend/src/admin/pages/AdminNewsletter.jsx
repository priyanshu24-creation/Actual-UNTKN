import { useEffect, useMemo, useState } from "react";
import {
    Mail,
    Search,
    Trash2,
    Download,
    Send,
    Users,
} from "lucide-react";
import api from "../../services/api.js";

function AdminNewsletter() {
    const [subscribers, setSubscribers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/newsletter/admin");

            setSubscribers(response.data?.subscribers || []);
        } catch (err) {
            console.error("Failed to fetch newsletter subscribers:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load newsletter subscribers."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to remove this subscriber?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`/newsletter/admin/${id}`);

            setSubscribers((current) =>
                current.filter(
                    (subscriber) => Number(subscriber.id) !== Number(id)
                )
            );
        } catch (err) {
            console.error("Failed to delete subscriber:", err);

            alert(
                err.response?.data?.message ||
                    "Failed to delete subscriber."
            );
        }
    };

    const filteredSubscribers = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        return subscribers.filter((subscriber) => {
            const name = String(subscriber.name || "").toLowerCase();
            const email = String(subscriber.email || "").toLowerCase();

            const matchesSearch =
                !searchText ||
                name.includes(searchText) ||
                email.includes(searchText);

            const matchesStatus =
                statusFilter === "All" ||
                subscriber.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [subscribers, search, statusFilter]);

    const totalSubscribers = subscribers.length;

    const activeSubscribers = subscribers.filter(
        (subscriber) => Boolean(subscriber.active)
    ).length;

    const unsubscribedSubscribers = subscribers.filter(
        (subscriber) => !subscriber.active
    ).length;

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const exportCSV = () => {
        if (subscribers.length === 0) {
            alert("No subscribers to export.");
            return;
        }

        const headers = [
            "Name",
            "Email",
            "Source",
            "Subscribed",
            "Status",
        ];

        const rows = subscribers.map((subscriber) => [
            subscriber.name || "",
            subscriber.email || "",
            subscriber.source || "",
            formatDate(subscriber.created_at),
            subscriber.status || "",
        ]);

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map((value) => {
                        const safeValue = String(value).replace(
                            /"/g,
                            '""'
                        );

                        return `"${safeValue}"`;
                    })
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "newsletter-subscribers.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const handleSendNewsletter = () => {
        alert(
            "Newsletter campaign sending will be connected to the email service later."
        );
    };

    const styles = {
        page: {
            width: "100%",
            color: "#111111",
            fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },

        header: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "24px",
            marginBottom: "28px",
        },

        eyebrow: {
            margin: 0,
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#777777",
        },

        title: {
            margin: "4px 0 0",
            fontFamily: "Georgia, Times New Roman, serif",
            fontSize: "34px",
            lineHeight: "1.1",
            fontWeight: 500,
            color: "#111111",
        },

        description: {
            margin: "6px 0 0",
            fontSize: "14px",
            color: "#777777",
        },

        sendButton: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            height: "38px",
            padding: "0 18px",
            border: "1px solid #111111",
            borderRadius: "5px",
            background: "#111111",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
        },

        statsGrid: {
            display: "grid",
            gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "20px",
        },

        statCard: {
            minHeight: "88px",
            display: "flex",
            alignItems: "center",
            padding: "20px",
            border: "1px solid #e5e5e5",
            borderRadius: "6px",
            background: "#ffffff",
            boxSizing: "border-box",
        },

        statIcon: {
            width: "38px",
            height: "38px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e5e5e5",
            borderRadius: "50%",
            color: "#222222",
        },

        statContent: {
            marginLeft: "14px",
        },

        statLabel: {
            margin: 0,
            fontSize: "10px",
            lineHeight: "1.2",
            fontWeight: 500,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "#888888",
        },

        statNumber: {
            margin: "5px 0 0",
            fontSize: "23px",
            lineHeight: "1",
            fontWeight: 600,
            color: "#111111",
        },

        filterBar: {
            minHeight: "58px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "10px",
            marginBottom: "14px",
            border: "1px solid #e5e5e5",
            borderRadius: "6px",
            background: "#ffffff",
            boxSizing: "border-box",
        },

        filterLeft: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },

        searchWrapper: {
            position: "relative",
            width: "225px",
        },

        searchIcon: {
            position: "absolute",
            left: "11px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#999999",
            pointerEvents: "none",
        },

        searchInput: {
            width: "100%",
            height: "36px",
            padding: "0 12px 0 34px",
            border: "1px solid #dddddd",
            borderRadius: "4px",
            outline: "none",
            background: "#ffffff",
            color: "#222222",
            fontSize: "13px",
            boxSizing: "border-box",
        },

        select: {
            height: "36px",
            minWidth: "125px",
            padding: "0 30px 0 11px",
            border: "1px solid #dddddd",
            borderRadius: "4px",
            outline: "none",
            background: "#ffffff",
            color: "#333333",
            fontSize: "13px",
            cursor: "pointer",
        },

        exportButton: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            height: "36px",
            padding: "0 14px",
            border: "1px solid #dddddd",
            borderRadius: "4px",
            background: "#ffffff",
            color: "#333333",
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
        },

        tableWrapper: {
            width: "100%",
            overflow: "hidden",
            border: "1px solid #e5e5e5",
            borderRadius: "6px",
            background: "#ffffff",
        },

        table: {
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
        },

        tableHeader: {
            height: "45px",
            padding: "0 16px",
            borderBottom: "1px solid #e5e5e5",
            background: "#fafafa",
            color: "#777777",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "1px",
            textTransform: "uppercase",
            textAlign: "left",
        },

        tableCell: {
            height: "56px",
            padding: "0 16px",
            borderBottom: "1px solid #eeeeee",
            color: "#333333",
            fontSize: "13px",
            verticalAlign: "middle",
            boxSizing: "border-box",
        },

        subscriberCell: {
            display: "flex",
            alignItems: "center",
            gap: "11px",
        },

        avatar: {
            width: "30px",
            height: "30px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#f1f1f1",
            color: "#333333",
            fontSize: "11px",
            fontWeight: 600,
        },

        subscriberName: {
            fontSize: "13px",
            fontWeight: 500,
            color: "#222222",
        },

        email: {
            color: "#666666",
        },

        statusSubscribed: {
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 9px",
            borderRadius: "4px",
            background: "#edf8f0",
            color: "#238342",
            fontSize: "10px",
            fontWeight: 600,
        },

        statusUnsubscribed: {
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 9px",
            borderRadius: "4px",
            background: "#f1f1f1",
            color: "#666666",
            fontSize: "10px",
            fontWeight: 600,
        },

        deleteButton: {
            width: "30px",
            height: "30px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            background: "#ffffff",
            color: "#777777",
            cursor: "pointer",
        },

        empty: {
            padding: "48px 20px",
            textAlign: "center",
            color: "#888888",
            fontSize: "13px",
        },

        error: {
            marginBottom: "18px",
            padding: "11px 14px",
            border: "1px solid #f0caca",
            borderRadius: "5px",
            background: "#fff5f5",
            color: "#c0392b",
            fontSize: "13px",
        },

        loading: {
            padding: "40px 0",
            color: "#777777",
            fontSize: "13px",
        },
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loading}>
                    Loading newsletter subscribers...
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <p style={styles.eyebrow}>Marketing</p>

                    <h1 style={styles.title}>Newsletter</h1>

                    <p style={styles.description}>
                        Manage newsletter subscribers and email campaigns.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSendNewsletter}
                    style={styles.sendButton}
                >
                    <Send size={15} />
                    Send Newsletter
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <Users size={18} />
                    </div>

                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>
                            Total Subscribers
                        </p>

                        <p style={styles.statNumber}>
                            {totalSubscribers}
                        </p>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <Mail size={18} />
                    </div>

                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>
                            Active Subscribers
                        </p>

                        <p style={styles.statNumber}>
                            {activeSubscribers}
                        </p>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <Mail size={18} />
                    </div>

                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>
                            Unsubscribed
                        </p>

                        <p style={styles.statNumber}>
                            {unsubscribedSubscribers}
                        </p>
                    </div>
                </div>
            </div>

            <div style={styles.filterBar}>
                <div style={styles.filterLeft}>
                    <div style={styles.searchWrapper}>
                        <Search
                            size={15}
                            style={styles.searchIcon}
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search subscribers..."
                            style={styles.searchInput}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        style={styles.select}
                    >
                        <option value="All">All Status</option>
                        <option value="Subscribed">
                            Subscribed
                        </option>
                        <option value="Unsubscribed">
                            Unsubscribed
                        </option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={exportCSV}
                    style={styles.exportButton}
                >
                    <Download size={15} />
                    Export CSV
                </button>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th
                                style={{
                                    ...styles.tableHeader,
                                    width: "28%",
                                }}
                            >
                                Subscriber
                            </th>

                            <th
                                style={{
                                    ...styles.tableHeader,
                                    width: "25%",
                                }}
                            >
                                Email
                            </th>

                            <th
                                style={{
                                    ...styles.tableHeader,
                                    width: "16%",
                                }}
                            >
                                Subscribed
                            </th>

                            <th
                                style={{
                                    ...styles.tableHeader,
                                    width: "16%",
                                }}
                            >
                                Status
                            </th>

                            <th
                                style={{
                                    ...styles.tableHeader,
                                    width: "15%",
                                    textAlign: "right",
                                }}
                            >
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredSubscribers.map((subscriber) => {
                            const displayName =
                                subscriber.name ||
                                subscriber.email ||
                                "Unknown";

                            const initial =
                                displayName
                                    .charAt(0)
                                    .toUpperCase();

                            return (
                                <tr key={subscriber.id}>
                                    <td style={styles.tableCell}>
                                        <div
                                            style={
                                                styles.subscriberCell
                                            }
                                        >
                                            <div
                                                style={styles.avatar}
                                            >
                                                {initial}
                                            </div>

                                            <span
                                                style={
                                                    styles.subscriberName
                                                }
                                            >
                                                {displayName}
                                            </span>
                                        </div>
                                    </td>

                                    <td
                                        style={{
                                            ...styles.tableCell,
                                            ...styles.email,
                                        }}
                                    >
                                        {subscriber.email}
                                    </td>

                                    <td
                                        style={{
                                            ...styles.tableCell,
                                            color: "#555555",
                                        }}
                                    >
                                        {formatDate(
                                            subscriber.created_at
                                        )}
                                    </td>

                                    <td style={styles.tableCell}>
                                        <span
                                            style={
                                                subscriber.active
                                                    ? styles.statusSubscribed
                                                    : styles.statusUnsubscribed
                                            }
                                        >
                                            {subscriber.active
                                                ? "Subscribed"
                                                : "Unsubscribed"}
                                        </span>
                                    </td>

                                    <td
                                        style={{
                                            ...styles.tableCell,
                                            textAlign: "right",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDelete(
                                                    subscriber.id
                                                )
                                            }
                                            style={styles.deleteButton}
                                            title="Delete subscriber"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredSubscribers.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        ...styles.tableCell,
                                        ...styles.empty,
                                    }}
                                >
                                    No newsletter subscribers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminNewsletter;