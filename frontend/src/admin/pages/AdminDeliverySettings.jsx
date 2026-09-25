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

  const loadDeliveryMethods = async () => {
    try {
      setLoading(true);
      setError("");
      setSaved(false);

      const response = await api.get(
        "/delivery-methods/admin"
      );

      const methods = Array.isArray(
        response.data?.deliveryMethods
      )
        ? response.data.deliveryMethods
        : [];

      setDeliveryMethods(
        methods.map((method) => ({
          id: method.id,
          name: method.name,
          description: method.description || "",
          price: Number(method.price || 0),
          isActive:
            method.isActive === true ||
            method.isActive === 1 ||
            method.is_active === true ||
            method.is_active === 1,
        }))
      );
    } catch (requestError) {
      console.error(
        "Failed to load delivery methods:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "Unable to load delivery methods."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  const handleToggle = (id) => {
    setDeliveryMethods((currentMethods) =>
      currentMethods.map((method) =>
        method.id === id
          ? {
              ...method,
              isActive: !method.isActive,
            }
          : method
      )
    );

    setSaved(false);
    setError("");
  };

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
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const payload = {
        deliveryMethods: deliveryMethods.map(
          (method) => ({
            id: method.id,
            name: method.name,
            description: method.description,
            price: Number(method.price || 0),
            isActive: Boolean(
              method.isActive
            ),
          })
        ),
      };

      const response = await api.put(
        "/delivery-methods/admin",
        payload
      );

      const updatedMethods = Array.isArray(
        response.data?.deliveryMethods
      )
        ? response.data.deliveryMethods
        : [];

      setDeliveryMethods(
        updatedMethods.map((method) => ({
          id: method.id,
          name: method.name,
          description: method.description || "",
          price: Number(method.price || 0),
          isActive:
            method.isActive === true ||
            method.isActive === 1 ||
            method.is_active === true ||
            method.is_active === 1,
        }))
      );

      setSaved(true);
    } catch (requestError) {
      console.error(
        "Failed to save delivery methods:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "Unable to save delivery settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await loadDeliveryMethods();
  };

  if (loading) {
    return (
      <div className="admin-delivery-settings">
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          LOADING DELIVERY SETTINGS...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-delivery-settings">
      <div className="admin-delivery-header">
        <div>
          <span className="admin-delivery-eyebrow">
            SHIPPING CONFIGURATION
          </span>

          <h1>Delivery Settings</h1>

          <p>
            Manage the delivery methods, availability
            and fees shown to customers during
            checkout.
          </p>
        </div>

        <div className="admin-delivery-header-actions">
          <button
            type="button"
            className="admin-delivery-reset"
            onClick={handleReset}
            disabled={saving}
          >
            <RefreshCw size={15} />
            RESET
          </button>

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

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border: "1px solid #d33",
            color: "#d33",
            background: "#fff",
          }}
        >
          {error}
        </div>
      )}

      <div className="admin-delivery-info">
        <div className="admin-delivery-info-icon">
          <Truck size={18} />
        </div>

        <div>
          <strong>
            Delivery availability
          </strong>

          <p>
            Turn a delivery method OFF when you
            cannot currently provide that service.
            Disabled methods will not appear to
            customers during checkout.
          </p>
        </div>
      </div>

      <div className="admin-delivery-grid">
        {deliveryMethods.map((method) => (
          <div
            className={`admin-delivery-card ${
              !method.isActive
                ? "admin-delivery-card-disabled"
                : ""
            }`}
            key={method.id}
          >
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

                <span>
                  {method.description}
                </span>
              </div>
            </div>

            <div className="admin-delivery-enable-section">
              <div>
                <strong>
                  {method.isActive
                    ? "AVAILABLE"
                    : "DISABLED"}
                </strong>

                <p>
                  {method.isActive
                    ? "Customers can select this delivery method."
                    : "Customers cannot select this delivery method."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleToggle(method.id)
                }
                disabled={saving}
                aria-label={`Toggle ${method.name}`}
              >
                {method.isActive ? (
                  <ToggleRight
                    size={38}
                  />
                ) : (
                  <ToggleLeft
                    size={38}
                  />
                )}
              </button>
            </div>

            <div className="admin-delivery-price-section">
              <label>
                DELIVERY PRICE
              </label>

              <div>
                <span>₹</span>

                <input
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
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDeliverySettings;