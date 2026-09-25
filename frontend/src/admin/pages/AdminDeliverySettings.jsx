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

import api from "../../services/api";

function AdminDeliverySettings() {
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const normalizeBoolean = (value) => {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true"
    );
  };

  const normalizeMethods = (methods) => {
    if (!Array.isArray(methods)) {
      return [];
    }

    return methods.map((method) => ({
      id: String(method?.id ?? ""),
      name: String(method?.name ?? ""),
      description: String(method?.description ?? ""),
      price: Number(method?.price ?? 0),
      enabled: normalizeBoolean(
        method?.isActive ??
          method?.is_active ??
          method?.enabled
      ),
    }));
  };

  const loadDeliveryMethods = async () => {
    try {
      setLoading(true);
      setError("");
      setSaved(false);

      const response = await api.get(
        `/delivery-methods/admin?_=${Date.now()}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load delivery settings."
        );
      }

      const methods = normalizeMethods(
        response.data?.deliveryMethods
      );

      setDeliveryMethods(methods);

      if (methods.length === 0) {
        setError(
          "No delivery methods are configured in the database."
        );
      }
    } catch (requestError) {
      console.error(
        "Failed to load delivery methods:",
        requestError
      );

      setDeliveryMethods([]);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load delivery settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  const handleToggle = (id) => {
    setDeliveryMethods((current) =>
      current.map((method) =>
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

  const handlePriceChange = (id, value) => {
    setDeliveryMethods((current) =>
      current.map((method) =>
        method.id === id
          ? {
              ...method,
              price: value,
            }
          : method
      )
    );

    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    if (saving || loading) {
      return;
    }

    if (deliveryMethods.length === 0) {
      setError("No delivery methods available to save.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const payload = {
        deliveryMethods: deliveryMethods.map((method) => {
          const numericPrice = Number(method.price);

          if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
          ) {
            throw new Error(
              `Invalid price for ${method.name || method.id}.`
            );
          }

          return {
            id: method.id,
            name: method.name,
            description: method.description,
            price: Number(numericPrice.toFixed(2)),
            isActive: Boolean(method.enabled),
          };
        }),
      };

      console.log(
        "Saving delivery settings:",
        payload
      );

      const response = await api.put(
        "/delivery-methods/admin",
        payload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to save delivery settings."
        );
      }

      console.log(
        "Delivery settings save response:",
        response.data
      );

      setSaved(true);

      await loadDeliveryMethods();
    } catch (requestError) {
      console.error(
        "Failed to save delivery methods:",
        requestError
      );

      setSaved(false);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to save delivery settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (saving || loading) {
      return;
    }

    await loadDeliveryMethods();
  };

  const getIcon = (method) => {
    const name = String(
      method?.name || ""
    ).toLowerCase();

    if (name.includes("express")) {
      return <Zap size={22} strokeWidth={1.6} />;
    }

    return <Truck size={22} strokeWidth={1.6} />;
  };

  return (
    <div className="admin-delivery-settings">

      <div className="admin-delivery-header">

        <div>
          <span className="admin-delivery-eyebrow">
            SHIPPING CONFIGURATION
          </span>

          <h1>Delivery Settings</h1>

          <p>
            Manage the delivery methods, availability and
            delivery fees shown to customers.
          </p>
        </div>

        <div className="admin-delivery-actions">

          <button
            type="button"
            className="admin-delivery-reset"
            onClick={handleReset}
            disabled={loading || saving}
          >
            <RefreshCw size={15} />
            REFRESH
          </button>

          <button
            type="button"
            className="admin-delivery-save"
            onClick={handleSave}
            disabled={loading || saving}
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
          className="admin-delivery-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-delivery-loading">
          <RefreshCw
            size={22}
            className="admin-spin"
          />
          <span>
            Loading delivery settings...
          </span>
        </div>
      ) : deliveryMethods.length === 0 ? (
        <div className="admin-delivery-empty">
          <Truck size={30} strokeWidth={1.4} />
          <h3>No delivery methods</h3>
          <p>
            No delivery methods are available in the
            database.
          </p>
        </div>
      ) : (
        <div className="admin-delivery-list">

          {deliveryMethods.map((method) => (
            <div
              key={method.id}
              className={`admin-delivery-card ${
                method.enabled
                  ? "is-enabled"
                  : "is-disabled"
              }`}
            >

              <div className="admin-delivery-card-top">

                <div className="admin-delivery-method-icon">
                  {getIcon(method)}
                </div>

                <div className="admin-delivery-method-info">
                  <span className="admin-delivery-method-id">
                    ID: {method.id}
                  </span>

                  <h2>
                    {method.name}
                  </h2>

                  <p>
                    {method.description}
                  </p>
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
                  disabled={saving}
                  aria-label={
                    method.enabled
                      ? `Disable ${method.name}`
                      : `Enable ${method.name}`
                  }
                >
                  {method.enabled ? (
                    <ToggleRight size={34} />
                  ) : (
                    <ToggleLeft size={34} />
                  )}
                </button>

              </div>

              <div className="admin-delivery-card-bottom">

                <div className="admin-delivery-status">

                  <span
                    className={`admin-delivery-status-dot ${
                      method.enabled
                        ? "active"
                        : "inactive"
                    }`}
                  />

                  <span>
                    {method.enabled
                      ? "AVAILABLE TO CUSTOMERS"
                      : "HIDDEN FROM CUSTOMERS"}
                  </span>

                </div>

                <div className="admin-delivery-price">

                  <label
                    htmlFor={`delivery-price-${method.id}`}
                  >
                    DELIVERY FEE
                  </label>

                  <div className="admin-delivery-price-input">

                    <span>₹</span>

                    <input
                      id={`delivery-price-${method.id}`}
                      type="number"
                      min="0"
                      step="1"
                      value={method.price}
                      disabled={saving}
                      onChange={(event) =>
                        handlePriceChange(
                          method.id,
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

              </div>

            </div>
          ))}

        </div>
      )}

      <div className="admin-delivery-note">
        <strong>DATABASE CONTROL</strong>
        <p>
          These settings are loaded from and saved to the
          database. Customer checkout uses the active
          delivery methods and prices stored here.
        </p>
      </div>

    </div>
  );
}

export default AdminDeliverySettings;