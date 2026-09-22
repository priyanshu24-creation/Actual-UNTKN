import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
  WalletCards,
  X,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../../services/api.js";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (
    value === "delivered" ||
    value === "paid" ||
    value === "confirmed"
  ) {
    return "success";
  }

  if (
    value === "cancelled" ||
    value === "failed" ||
    value === "blocked"
  ) {
    return "danger";
  }

  if (
    value === "processing" ||
    value === "shipped" ||
    value === "pending"
  ) {
    return "warning";
  }

  return "neutral";
}

function AdminCustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [address, setAddress] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [status, setStatus] = useState("Active");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/admin/customers/${encodeURIComponent(id)}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load customer."
        );
      }

      const loadedCustomer =
        response.data.customer || null;

      const loadedAddress =
        response.data.address || null;

      const loadedOrders =
        Array.isArray(response.data.orders)
          ? response.data.orders
          : [];

      setCustomer(loadedCustomer);
      setAddress(loadedAddress);
      setOrders(loadedOrders);

      const loadedStatus =
        String(loadedCustomer?.status || "")
          .trim()
          .toLowerCase() === "blocked"
          ? "Blocked"
          : "Active";

      setStatus(loadedStatus);
    } catch (requestError) {
      console.error(
        "Failed to load customer:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load customer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [notice]);

  const handleStatusUpdate = async () => {
    if (!customer || savingStatus) {
      return;
    }

    const nextStatus =
      String(status).toLowerCase() === "blocked"
        ? "Blocked"
        : "Active";

    if (nextStatus === customerStatus) {
      return;
    }

    try {
      setSavingStatus(true);
      setError("");
      setNotice("");

      let response;

      try {
        response = await api.patch(
          `/admin/customers/${encodeURIComponent(customer.id)}/status`,
          {
            status: nextStatus,
          }
        );
      } catch (patchError) {
        const httpStatus = patchError.response?.status;

        if (httpStatus !== 404 && httpStatus !== 405) {
          throw patchError;
        }

        response = await api.put(
          `/admin/customers/${encodeURIComponent(customer.id)}/status`,
          {
            status: nextStatus,
          }
        );
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update customer status."
        );
      }

      const updatedCustomer =
        response.data.customer || {};

      const updatedStatus =
        updatedCustomer.status === "Blocked"
          ? "Blocked"
          : updatedCustomer.status === "Active"
            ? "Active"
            : nextStatus;

      setStatus(updatedStatus);

      setCustomer((current) =>
        current
          ? {
              ...current,
              ...updatedCustomer,
              status: updatedStatus,
            }
          : current
      );

      setNotice(
        updatedStatus === "Blocked"
          ? "Customer account has been blocked."
          : "Customer account is active again."
      );
    } catch (requestError) {
      console.error(
        "Failed to update customer status:",
        requestError
      );

      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to update customer status.";

      setError(message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await api.delete(
        `/admin/customers/${customer.id}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to delete customer."
        );
      }

      setShowDeleteModal(false);

      navigate("/admin/customers", {
        replace: true,
        state: {
          message:
            "Customer account deleted successfully.",
        },
      });
    } catch (requestError) {
      console.error(
        "Failed to delete customer:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to delete customer."
      );

      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-page admin-customer-details-page">
        <div className="untkn-customer-loading">
          <div className="untkn-loading-orb" />
          <p>LOADING CUSTOMER PROFILE</p>
        </div>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="admin-page admin-customer-details-page">
        <div className="untkn-customer-error">
          <div className="untkn-error-icon">
            <UserRound size={26} />
          </div>

          <p className="admin-eyebrow">
            CUSTOMER ERROR
          </p>

          <h1>CUSTOMER NOT FOUND.</h1>

          <p>
            {error ||
              "The customer you're looking for does not exist."}
          </p>

          <Link
            to="/admin/customers"
            className="untkn-customer-back"
          >
            <ArrowLeft size={16} />
            BACK TO CUSTOMERS
          </Link>
        </div>
      </section>
    );
  }

  const totalOrders = Number(
    customer.orders ?? orders.length
  );

  const totalSpent = Number(
    customer.totalSpent ?? 0
  );

  const customerStatus =
    String(status).toLowerCase() === "blocked"
      ? "Blocked"
      : "Active";

  return (
    <>
      <style>{`
        .untkn-customer-details-page {
          position: relative;
          min-height: 100vh;
          padding: 34px;
          background:
            radial-gradient(
              circle at 85% 8%,
              rgba(212, 175, 55, 0.07),
              transparent 28%
            ),
            #f7f7f5;
        }

        .untkn-customer-shell {
          width: min(1480px, 100%);
          margin: 0 auto;
        }

        .untkn-customer-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .untkn-customer-topbar-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .untkn-customer-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          color: #555;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          transition: color 0.2s ease;
        }

        .untkn-customer-back:hover {
          color: #111;
        }

        .untkn-customer-kicker {
          margin: 0 0 7px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #999;
        }

        .untkn-customer-title {
          margin: 0;
          font-size: clamp(32px, 4vw, 58px);
          line-height: 0.96;
          letter-spacing: -0.055em;
          font-weight: 900;
          color: #111;
        }

        .untkn-customer-subtitle {
          margin: 12px 0 0;
          color: #777;
          font-size: 13px;
        }

        .untkn-customer-top-status {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 15px;
          border: 1px solid rgba(17, 17, 17, 0.09);
          border-radius: 999px;
          background: rgba(255,255,255,0.82);
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .untkn-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #111;
        }

        .untkn-status-dot.blocked {
          background: #a33;
        }

        .untkn-customer-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          padding: 14px 17px;
          border: 1px solid rgba(150, 50, 50, 0.15);
          border-radius: 14px;
          background: #fff7f7;
          color: #7d2e2e;
          font-size: 12px;
        }

        .untkn-customer-alert button {
          border: 0;
          background: transparent;
          cursor: pointer;
          color: inherit;
        }

        .untkn-customer-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
          gap: 18px;
        }

        .untkn-customer-main {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .untkn-customer-side {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .untkn-customer-card {
          border: 1px solid rgba(17,17,17,0.08);
          border-radius: 22px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 18px 55px rgba(17,17,17,0.055);
          overflow: hidden;
        }

        .untkn-profile-card {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 26px;
          padding: 28px;
          align-items: center;
        }

        .untkn-profile-avatar {
          width: 132px;
          height: 132px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(
              circle at 35% 25%,
              #3a3a3a,
              #080808 70%
            );
          color: white;
          font-size: 42px;
          font-weight: 800;
          box-shadow:
            0 18px 40px rgba(0,0,0,0.16),
            inset 0 0 0 1px rgba(255,255,255,0.08);
        }

        .untkn-profile-name {
          margin: 0;
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .untkn-profile-role {
          display: inline-flex;
          margin-top: 9px;
          color: #999;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .untkn-profile-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin-top: 22px;
        }

        .untkn-profile-meta span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #666;
          font-size: 12px;
        }

        .untkn-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 18px;
        }

        .untkn-stat {
          min-height: 118px;
          padding: 20px;
          border-radius: 17px;
          background: #f8f8f6;
          border: 1px solid rgba(17,17,17,0.055);
        }

        .untkn-stat-icon {
          color: #777;
        }

        .untkn-stat-label {
          display: block;
          margin-top: 18px;
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .untkn-stat-value {
          display: block;
          margin-top: 5px;
          font-size: 23px;
          letter-spacing: -0.035em;
        }

        .untkn-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 22px 24px;
          border-bottom: 1px solid rgba(17,17,17,0.07);
        }

        .untkn-card-kicker {
          margin: 0 0 4px;
          color: #aaa;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .untkn-card-title {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.025em;
        }

        .untkn-card-count {
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 30px;
          padding: 0 9px;
          border-radius: 999px;
          background: #111;
          color: white;
          font-size: 11px;
          font-weight: 800;
        }

        .untkn-orders {
          padding: 7px 24px 20px;
        }

        .untkn-order {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 17px 0;
          border-bottom: 1px solid rgba(17,17,17,0.065);
        }

        .untkn-order:last-child {
          border-bottom: 0;
        }

        .untkn-order-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #f2f2f0;
          color: #555;
        }

        .untkn-order-number {
          display: block;
          color: #111;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        .untkn-order-date {
          display: block;
          margin-top: 5px;
          color: #999;
          font-size: 10px;
        }

        .untkn-order-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .untkn-order-total {
          font-size: 13px;
          font-weight: 800;
        }

        .untkn-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .untkn-badge.success {
          background: #edf7ef;
          color: #367244;
        }

        .untkn-badge.warning {
          background: #fff5e5;
          color: #9a681c;
        }

        .untkn-badge.danger {
          background: #fff0f0;
          color: #a43a3a;
        }

        .untkn-badge.neutral {
          background: #f0f0ef;
          color: #666;
        }

        .untkn-address {
          padding: 24px;
        }

        .untkn-address-name {
          font-size: 15px;
          font-weight: 800;
        }

        .untkn-address-lines {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 12px;
          color: #777;
          font-size: 12px;
          line-height: 1.55;
        }

        .untkn-address-empty {
          padding: 24px;
          color: #999;
          font-size: 12px;
          line-height: 1.6;
        }

        .untkn-status-panel {
          padding: 22px;
        }

        .untkn-status-label {
          display: block;
          margin-bottom: 8px;
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .untkn-status-select {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          border: 1px solid rgba(17,17,17,0.1);
          border-radius: 12px;
          background: #fafafa;
          color: #111;
          outline: none;
          font-size: 12px;
          font-weight: 700;
        }

        .untkn-status-update {
          width: 100%;
          height: 46px;
          margin-top: 10px;
          border: 0;
          border-radius: 12px;
          background: #111;
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.13em;
          transition: transform .2s ease, opacity .2s ease;
        }

        .untkn-status-update:hover {
          transform: translateY(-1px);
        }

        .untkn-status-update:disabled {
          opacity: .5;
          cursor: wait;
        }

        .untkn-danger-card {
          border-color: rgba(170,55,55,0.13);
          background: linear-gradient(
            145deg,
            rgba(255,255,255,.96),
            rgba(255,248,248,.96)
          );
        }

        .untkn-danger-content {
          padding: 22px;
        }

        .untkn-danger-content p {
          margin: 0;
          color: #888;
          font-size: 11px;
          line-height: 1.6;
        }

        .untkn-delete-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 46px;
          margin-top: 15px;
          border: 1px solid rgba(160,50,50,.22);
          border-radius: 12px;
          background: #fff;
          color: #9d3535;
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .12em;
          transition: all .2s ease;
        }

        .untkn-delete-button:hover {
          background: #9d3535;
          color: white;
          border-color: #9d3535;
        }

        .untkn-delete-button:disabled {
          opacity: .5;
          cursor: wait;
        }

        .untkn-empty-orders {
          padding: 60px 24px;
          text-align: center;
          color: #999;
        }

        .untkn-empty-orders svg {
          margin-bottom: 12px;
          color: #bbb;
        }

        .untkn-empty-orders h3 {
          margin: 0;
          color: #444;
          font-size: 15px;
        }

        .untkn-empty-orders p {
          margin: 7px 0 0;
          font-size: 11px;
        }

        .untkn-customer-loading,
        .untkn-customer-error {
          min-height: 65vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          text-align: center;
        }

        .untkn-customer-loading p,
        .untkn-customer-error p {
          margin: 0;
          color: #888;
          font-size: 11px;
          letter-spacing: .12em;
        }

        .untkn-loading-orb {
          width: 34px;
          height: 34px;
          border: 2px solid #ddd;
          border-top-color: #111;
          border-radius: 50%;
          animation: untknCustomerSpin .8s linear infinite;
        }

        .untkn-error-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: #111;
          color: white;
        }

        .untkn-customer-error h1 {
          margin: 0;
          font-size: 42px;
          letter-spacing: -.05em;
        }

        .untkn-customer-error .admin-eyebrow {
          margin: 0;
        }

        .untkn-customer-error .untkn-customer-back {
          margin-top: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          background: #111;
          color: white;
        }

        .untkn-toast {
          position: fixed;
          z-index: 9999;
          right: 26px;
          top: 26px;
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 290px;
          max-width: 390px;
          padding: 14px 16px;
          border: 1px solid rgba(17,17,17,.08);
          border-radius: 16px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 22px 60px rgba(0,0,0,.16);
          backdrop-filter: blur(18px);
          animation: untknToastIn .35s ease both;
        }

        .untkn-toast-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #111;
          color: white;
          flex: 0 0 auto;
        }

        .untkn-toast strong {
          display: block;
          color: #111;
          font-size: 12px;
        }

        .untkn-toast span {
          display: block;
          margin-top: 3px;
          color: #777;
          font-size: 10px;
        }

        .untkn-toast button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: #888;
          cursor: pointer;
        }

        .untkn-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(8,8,8,.56);
          backdrop-filter: blur(10px);
          animation: untknFadeIn .2s ease both;
        }

        .untkn-delete-modal {
          width: min(470px, 100%);
          padding: 27px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 24px;
          background: #111;
          color: white;
          box-shadow: 0 30px 100px rgba(0,0,0,.35);
          animation: untknModalIn .25s ease both;
        }

        .untkn-delete-modal-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: rgba(255,255,255,.08);
          color: #ff9b9b;
        }

        .untkn-delete-modal h2 {
          margin: 22px 0 8px;
          font-size: 26px;
          letter-spacing: -.04em;
        }

        .untkn-delete-modal p {
          margin: 0;
          color: #aaa;
          font-size: 12px;
          line-height: 1.65;
        }

        .untkn-delete-modal-name {
          color: white;
          font-weight: 800;
        }

        .untkn-modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 24px;
        }

        .untkn-modal-cancel,
        .untkn-modal-delete {
          height: 46px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .11em;
        }

        .untkn-modal-cancel {
          border: 1px solid rgba(255,255,255,.12);
          background: transparent;
          color: white;
        }

        .untkn-modal-delete {
          border: 0;
          background: #f06c6c;
          color: #111;
        }

        .untkn-modal-delete:disabled {
          opacity: .5;
          cursor: wait;
        }

        @keyframes untknToastIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes untknModalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes untknFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes untknCustomerSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .untkn-customer-grid {
            grid-template-columns: 1fr;
          }

          .untkn-customer-side {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .untkn-customer-details-page {
            padding: 18px;
          }

          .untkn-customer-topbar {
            flex-direction: column;
          }

          .untkn-profile-card {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .untkn-profile-avatar {
            margin: 0 auto;
          }

          .untkn-profile-meta {
            justify-content: center;
          }

          .untkn-stat-grid {
            grid-template-columns: 1fr;
          }

          .untkn-customer-side {
            grid-template-columns: 1fr;
          }

          .untkn-order {
            grid-template-columns: 40px minmax(0, 1fr);
          }

          .untkn-order-right {
            grid-column: 2;
            justify-content: space-between;
          }

          .untkn-customer-title {
            font-size: 39px;
          }

          .untkn-toast {
            right: 14px;
            left: 14px;
            min-width: 0;
          }
        }
      `}</style>

      {notice && (
        <div className="untkn-toast">
          <div className="untkn-toast-icon">
            <Check size={16} />
          </div>

          <div>
            <strong>ACCOUNT UPDATED</strong>
            <span>{notice}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="untkn-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div
            className="untkn-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-title"
          >
            <div className="untkn-delete-modal-icon">
              <AlertTriangle size={24} />
            </div>

            <h2 id="delete-customer-title">
              Delete customer?
            </h2>

            <p>
              This will permanently remove{" "}
              <span className="untkn-delete-modal-name">
                {customer.name}
              </span>{" "}
              and their account data. Their orders and
              related account records will also be removed.
            </p>

            <div className="untkn-modal-actions">
              <button
                type="button"
                className="untkn-modal-cancel"
                disabled={deleting}
                onClick={() =>
                  setShowDeleteModal(false)
                }
              >
                KEEP ACCOUNT
              </button>

              <button
                type="button"
                className="untkn-modal-delete"
                disabled={deleting}
                onClick={handleDeleteCustomer}
              >
                {deleting
                  ? "DELETING..."
                  : "DELETE ACCOUNT"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="untkn-customer-shell">
        <div className="untkn-customer-topbar">
          <div className="untkn-customer-topbar-left">
            <Link
              to="/admin/customers"
              className="untkn-customer-back"
            >
              <ArrowLeft size={15} />
              CUSTOMERS
            </Link>

            <div>
              <p className="untkn-customer-kicker">
                CUSTOMER PROFILE
              </p>

              <h1 className="untkn-customer-title">
                {customer.name}
              </h1>

              <p className="untkn-customer-subtitle">
                Customer account overview and purchase history.
              </p>
            </div>
          </div>

          <div className="untkn-customer-top-status">
            <span
              className={`untkn-status-dot ${
                customerStatus === "Blocked"
                  ? "blocked"
                  : ""
              }`}
            />
            {customerStatus.toUpperCase()}
          </div>
        </div>

        {error && (
          <div className="untkn-customer-alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="untkn-customer-grid">
          <main className="untkn-customer-main">
            <section className="untkn-customer-card untkn-profile-card">
              <div className="untkn-profile-avatar">
                {String(customer.name || "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2 className="untkn-profile-name">
                  {customer.name}
                </h2>

                <span className="untkn-profile-role">
                  UNTKN CUSTOMER
                </span>

                <div className="untkn-profile-meta">
                  <span>
                    <Mail size={14} />
                    {customer.email || "—"}
                  </span>

                  <span>
                    <Phone size={14} />
                    {customer.phone || "—"}
                  </span>

                  <span>
                    <CalendarDays size={14} />
                    Joined {formatDate(customer.registered)}
                  </span>
                </div>
              </div>
            </section>

            <section className="untkn-customer-card untkn-stat-grid">
              <div className="untkn-stat">
                <ShoppingBag
                  size={19}
                  className="untkn-stat-icon"
                />

                <span className="untkn-stat-label">
                  TOTAL ORDERS
                </span>

                <strong className="untkn-stat-value">
                  {totalOrders}
                </strong>
              </div>

              <div className="untkn-stat">
                <WalletCards
                  size={19}
                  className="untkn-stat-icon"
                />

                <span className="untkn-stat-label">
                  TOTAL SPENT
                </span>

                <strong className="untkn-stat-value">
                  {formatMoney(totalSpent)}
                </strong>
              </div>

              <div className="untkn-stat">
                <ShieldCheck
                  size={19}
                  className="untkn-stat-icon"
                />

                <span className="untkn-stat-label">
                  ACCOUNT STATUS
                </span>

                <strong className="untkn-stat-value">
                  {customerStatus}
                </strong>
              </div>
            </section>

            <section className="untkn-customer-card">
              <div className="untkn-card-header">
                <div>
                  <p className="untkn-card-kicker">
                    PURCHASES
                  </p>

                  <h2 className="untkn-card-title">
                    Order History
                  </h2>
                </div>

                <span className="untkn-card-count">
                  {orders.length}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="untkn-empty-orders">
                  <ShoppingBag size={30} />
                  <h3>No orders yet</h3>
                  <p>
                    This customer has not placed any orders.
                  </p>
                </div>
              ) : (
                <div className="untkn-orders">
                  {orders.map((order) => (
                    <div
                      className="untkn-order"
                      key={order.id}
                    >
                      <div className="untkn-order-icon">
                        <ShoppingBag size={17} />
                      </div>

                      <div>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="untkn-order-number"
                        >
                          #
                          {order.order_number ||
                            order.id}
                        </Link>

                        <span className="untkn-order-date">
                          {formatDate(order.created_at)}
                        </span>
                      </div>

                      <div className="untkn-order-right">
                        <strong className="untkn-order-total">
                          {formatMoney(order.total_amount)}
                        </strong>

                        <span
                          className={`untkn-badge ${getStatusClass(
                            order.order_status
                          )}`}
                        >
                          {order.order_status ||
                            "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="untkn-customer-side">
            <section className="untkn-customer-card">
              <div className="untkn-card-header">
                <div>
                  <p className="untkn-card-kicker">
                    DELIVERY
                  </p>

                  <h2 className="untkn-card-title">
                    Shipping Address
                  </h2>
                </div>

                <MapPin size={19} />
              </div>

              {address ? (
                <div className="untkn-address">
                  <div className="untkn-address-name">
                    {address.full_name ||
                      customer.name}
                  </div>

                  <div className="untkn-address-lines">
                    {address.address_line1 && (
                      <span>
                        {address.address_line1}
                      </span>
                    )}

                    {address.address_line2 && (
                      <span>
                        {address.address_line2}
                      </span>
                    )}

                    {(address.city ||
                      address.state) && (
                      <span>
                        {address.city || ""}
                        {address.city &&
                        address.state
                          ? ", "
                          : ""}
                        {address.state || ""}
                      </span>
                    )}

                    {address.postal_code && (
                      <span>
                        {address.postal_code}
                      </span>
                    )}

                    {address.country && (
                      <span>
                        {address.country}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="untkn-address-empty">
                  No shipping address is available yet.
                  Once this customer places an order,
                  their latest shipping address will appear
                  here.
                </div>
              )}
            </section>

            <section className="untkn-customer-card">
              <div className="untkn-card-header">
                <div>
                  <p className="untkn-card-kicker">
                    ACCOUNT
                  </p>

                  <h2 className="untkn-card-title">
                    Customer Status
                  </h2>
                </div>

                {customerStatus === "Blocked" ? (
                  <Ban size={19} />
                ) : (
                  <ShieldCheck size={19} />
                )}
              </div>

              <div className="untkn-status-panel">
                <label
                  className="untkn-status-label"
                  htmlFor="customer-status"
                >
                  ACCOUNT STATUS
                </label>

                <select
                  id="customer-status"
                  className="untkn-status-select"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  disabled={savingStatus}
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Blocked">
                    Blocked
                  </option>
                </select>

                <button
                  type="button"
                  className="untkn-status-update"
                  onClick={handleStatusUpdate}
                  disabled={
                    savingStatus ||
                    status === customerStatus
                  }
                >
                  {savingStatus
                    ? "UPDATING..."
                    : "UPDATE STATUS"}
                </button>
              </div>
            </section>

            <section className="untkn-customer-card untkn-danger-card">
              <div className="untkn-card-header">
                <div>
                  <p className="untkn-card-kicker">
                    DANGER ZONE
                  </p>

                  <h2 className="untkn-card-title">
                    Delete Customer
                  </h2>
                </div>

                <Trash2 size={18} />
              </div>

              <div className="untkn-danger-content">
                <p>
                  Permanently remove this customer account
                  and its related account records. This
                  action cannot be undone.
                </p>

                <button
                  type="button"
                  className="untkn-delete-button"
                  onClick={() =>
                    setShowDeleteModal(true)
                  }
                  disabled={deleting}
                >
                  <Trash2 size={15} />
                  DELETE CUSTOMER ACCOUNT
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}

export default AdminCustomerDetails;