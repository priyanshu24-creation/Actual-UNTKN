import { useEffect, useState } from "react";
import {
  Truck,
  Zap,
  Save,
  RefreshCw,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

function AdminDeliverySettings() {
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /* ========================================
     LOAD DELIVERY METHODS
  ======================================== */

  const normalizeDeliveryMethods = (methods) => {
    if (!Array.isArray(methods)) {
      return [];
    }

    return methods.map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description || "",
      price: Number(method.price ?? 0),
      enabled:
        method.isActive ??
        method.enabled ??
        method.is_active ??
        false,
    }));
  };

  const loadDeliveryMethods = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/delivery-methods/admin");

      const methods = normalizeDeliveryMethods(
        response.data?.deliveryMethods ??
          response.data?.methods ??
          []
      );

      setDeliveryMethods(methods);

      if (methods.length === 0) {
        setError("No delivery methods are configured.");
      }
    } catch (requestError) {
      console.error(
        "Failed to load delivery methods:",
        requestError
      );

      setDeliveryMethods([]);
      setError(
        requestError?.response?.data?.message ||
          "Unable to load delivery settings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  /* ========================================
     TOGGLE DELIVERY METHOD
  ======================================== */

  const handleToggle = (id) => {
    setDeliveryMethods((currentMethods) =>
      currentMethods.map((method) =>
        method.id === id
          ? {
              ...method,
              enabled: !method.enabled,
            }
          : method
      )
    );

    setSaved(false);
    setError("");
  };

  /* ========================================
     CHANGE DELIVERY PRICE
  ======================================== */

  const handlePriceChange = (id, value) => {
    setDeliveryMethods((currentMethods) =>
      currentMethods.map((method) =>
        method.id === id
          ? {
              ...method,
              price: value,
            }
          : method
      )
    );

    setSaved(false);
  };

  /* ========================================
     SAVE SETTINGS
  ======================================== */

  const handleSave = async () => {
    if (saving || loading) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const payload = {
        deliveryMethods: deliveryMethods.map((method) => ({
          id: method.id,
          name: method.name,
          description: method.description,
          price: Math.max(0, Number(method.price || 0)),
          isActive: Boolean(method.enabled),
        })),
      };

      const response = await api.put(
        "/delivery-methods/admin",
        payload
      );

      const updatedMethods = normalizeDeliveryMethods(
        response.data?.deliveryMethods ??
          response.data?.methods ??
          payload.deliveryMethods
      );

      setDeliveryMethods(updatedMethods);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (requestError) {
      console.error(
        "Failed to save delivery methods:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          "Unable to save delivery settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================
     RESET SETTINGS
  ======================================== */

  const handleReset = async () => {
    if (saving || loading) {
      return;
    }

    setSaved(false);
    await loadDeliveryMethods();
  };

  return (
    <div className="admin-delivery-settings">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="admin-delivery-header">

        <div>
          <span className="admin-delivery-eyebrow">
            SHIPPING CONFIGURATION
          </span>

          <h1>Delivery Settings</h1>

          <p>
            Manage the delivery methods, availability and fees shown
            to customers during checkout.
          </p>
        </div>

        <div className="admin-delivery-header-actions">

          {/* RESET */}
          <button
            type="button"
            className="admin-delivery-reset"
            onClick={handleReset}
          >
            <RefreshCw size={15} />
            RESET
          </button>

          {/* SAVE */}
          <button
            type="button"
            className="admin-delivery-save"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <RefreshCw
                  size={15}
                  className="admin-spin"
                />

                SAVING...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={15} />

                SAVED
              </>
            ) : (
              <>
                <Save size={15} />

                SAVE CHANGES
              </>
            )}
          </button>

        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            border: "1px solid #b3261e",
            background: "#fff5f5",
            color: "#8a1c16",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          {error}
        </div>
      )}

      {/* ========================================
          INFO
      ======================================== */}

      <div className="admin-delivery-info">

        <div className="admin-delivery-info-icon">
          <Truck size={18} />
        </div>

        <div>
          <strong>Delivery availability</strong>

          <p>
            Turn a delivery method OFF when you cannot currently
            provide that service. Disabled methods will not be shown
            to customers during checkout.
          </p>
        </div>

      </div>

      {/* ========================================
          DELIVERY METHODS
      ======================================== */}

      <div className="admin-delivery-grid">

        {loading ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "40px 0",
              textAlign: "center",
              fontSize: "13px",
              letterSpacing: "0.04em",
            }}
          >
            LOADING DELIVERY SETTINGS...
          </div>
        ) : deliveryMethods.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "40px 0",
              textAlign: "center",
              fontSize: "13px",
            }}
          >
            NO DELIVERY METHODS ARE CONFIGURED.
          </div>
        ) : (
          deliveryMethods.map((method) => (

          <div
            className={`admin-delivery-card ${
              !method.enabled
                ? "admin-delivery-card-disabled"
                : ""
            }`}
            key={method.id}
          >

            {/* CARD HEADER */}

            <div className="admin-delivery-card-header">

              <div className="admin-delivery-method-icon">

                {method.id === "express" ? (
                  <Zap size={19} />
                ) : (
                  <Truck size={19} />
                )}

              </div>

              <div className="admin-delivery-method-title">

                <h2>{method.name}</h2>

                <span>{method.description}</span>

              </div>

            </div>

            {/* ========================================
                ENABLE / DISABLE
            ======================================== */}

            <div className="admin-delivery-enable-section">

              <div>

                <span className="admin-delivery-enable-label">
                  DELIVERY STATUS
                </span>

                <strong
                  className={
                    method.enabled
                      ? "delivery-status-enabled"
                      : "delivery-status-disabled"
                  }
                >
                  {method.enabled
                    ? "AVAILABLE"
                    : "UNAVAILABLE"}
                </strong>

              </div>

              <button
                type="button"
                className={`admin-delivery-toggle ${
                  method.enabled
                    ? "is-enabled"
                    : "is-disabled"
                }`}
                onClick={() =>
                  handleToggle(method.id)
                }
                aria-label={`${
                  method.enabled
                    ? "Disable"
                    : "Enable"
                } ${method.name}`}
                aria-pressed={method.enabled}
                disabled={saving || loading}
              >
                {method.enabled ? (
                  <ToggleRight size={38} />
                ) : (
                  <ToggleLeft size={38} />
                )}
              </button>

            </div>

            {/* ========================================
                PRICE
            ======================================== */}

            <div className="admin-delivery-price-section">

              <label
                htmlFor={`delivery-${method.id}`}
              >
                DELIVERY FEE
              </label>

              <div className="admin-delivery-price-input">

                <span>₹</span>

                <input
                  id={`delivery-${method.id}`}
                  type="number"
                  min="0"
                  step="1"
                  value={method.price}
                  disabled={saving || loading}
                  onChange={(event) =>
                    handlePriceChange(
                      method.id,
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* ========================================
                PREVIEW
            ======================================== */}

            <div
              className={`admin-delivery-preview ${
                !method.enabled
                  ? "preview-disabled"
                  : ""
              }`}
            >

              <span>
                CUSTOMER WILL SEE
              </span>

              {method.enabled ? (
                <>
                  <div>

                    <strong>
                      {method.name}
                    </strong>

                    <strong>
                      ₹
                      {Number(
                        method.price || 0
                      ).toLocaleString("en-IN")}
                    </strong>

                  </div>

                  <p>
                    {method.description}
                  </p>
                </>
              ) : (
                <div className="admin-delivery-preview-disabled">
                  <strong>
                    NOT SHOWN TO CUSTOMERS
                  </strong>

                  <p>
                    This delivery method is currently disabled.
                  </p>
                </div>
              )}

            </div>

          </div>

          ))
        )}

      </div>

      {/* ========================================
          CURRENT CONFIGURATION
      ======================================== */}

      <section className="admin-delivery-summary">

        <div className="admin-delivery-summary-header">

          <div>

            <span className="admin-delivery-eyebrow">
              CURRENT CONFIGURATION
            </span>

            <h2>Delivery Methods</h2>

          </div>

        </div>

        <div className="admin-delivery-summary-list">

          {deliveryMethods.map((method) => (

            <div
              className="admin-delivery-summary-row"
              key={method.id}
            >

              <div>

                <strong>
                  {method.name}
                </strong>

                <span>
                  {method.description}
                </span>

              </div>

              <div className="admin-delivery-summary-right">

                <span
                  className={
                    method.enabled
                      ? "summary-status-enabled"
                      : "summary-status-disabled"
                  }
                >
                  {method.enabled
                    ? "ENABLED"
                    : "DISABLED"}
                </span>

                <strong>
                  ₹
                  {Number(
                    method.price || 0
                  ).toLocaleString("en-IN")}
                </strong>

              </div>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}

export default AdminDeliverySettings;