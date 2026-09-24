import { useState } from "react";
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
  const defaultDeliveryMethods = [
    {
      id: "standard",
      name: "STANDARD DELIVERY",
      description: "5–7 BUSINESS DAYS",
      price: 99,
      enabled: true,
    },
    {
      id: "express",
      name: "EXPRESS DELIVERY",
      description: "2–3 BUSINESS DAYS",
      price: 199,
      enabled: true,
    },
  ];

  const [deliveryMethods, setDeliveryMethods] = useState(
    defaultDeliveryMethods
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaving(true);
    setSaved(false);

    /*
      FRONTEND TEMPORARY STORAGE

      This allows the frontend to work before
      your friend's backend API is connected.

      Later your friend can replace this with:

      await api.put("/delivery-methods", {
        deliveryMethods,
      });
    */

    localStorage.setItem(
      "untkn-delivery-methods",
      JSON.stringify(deliveryMethods)
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  /* ========================================
     RESET SETTINGS
  ======================================== */

  const handleReset = () => {
    setDeliveryMethods(defaultDeliveryMethods);

    localStorage.removeItem("untkn-delivery-methods");

    setSaved(false);
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
            disabled={saving}
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

        {deliveryMethods.map((method) => (

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

        ))}

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