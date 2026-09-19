import { useState } from "react";
import {
  Truck,
  Zap,
  Save,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

function AdminDeliverySettings() {
  const [deliveryMethods, setDeliveryMethods] = useState([
    {
      id: "standard",
      name: "STANDARD DELIVERY",
      description: "5–7 BUSINESS DAYS",
      price: 99,
    },
    {
      id: "express",
      name: "EXPRESS DELIVERY",
      description: "2–3 BUSINESS DAYS",
      price: 199,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    /*
      BACKEND INTEGRATION

      Your friend can replace this section later with:

      await api.put("/delivery-methods", {
        deliveryMethods,
      });
    */

    await new Promise((resolve) => setTimeout(resolve, 800));

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleReset = () => {
    setDeliveryMethods([
      {
        id: "standard",
        name: "STANDARD DELIVERY",
        description: "5–7 BUSINESS DAYS",
        price: 99,
      },
      {
        id: "express",
        name: "EXPRESS DELIVERY",
        description: "2–3 BUSINESS DAYS",
        price: 199,
      },
    ]);

    setSaved(false);
  };

  return (
    <div className="admin-delivery-settings">
      {/* HEADER */}
      <div className="admin-delivery-header">
        <div>
          <span className="admin-delivery-eyebrow">
            SHIPPING CONFIGURATION
          </span>

          <h1>Delivery Settings</h1>

          <p>
            Manage the delivery methods and fees shown to customers
            during checkout.
          </p>
        </div>

        <div className="admin-delivery-header-actions">
          <button
            type="button"
            className="admin-delivery-reset"
            onClick={handleReset}
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
                <RefreshCw size={15} className="admin-spin" />
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

      {/* INFO */}
      <div className="admin-delivery-info">
        <div className="admin-delivery-info-icon">
          <Truck size={18} />
        </div>

        <div>
          <strong>Checkout delivery fees</strong>

          <p>
            Changes made here will control the delivery charges
            displayed on the customer checkout page once the backend
            API is connected.
          </p>
        </div>
      </div>

      {/* DELIVERY METHODS */}
      <div className="admin-delivery-grid">
        {deliveryMethods.map((method) => (
          <div
            className="admin-delivery-card"
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

              <div>
                <h2>{method.name}</h2>

                <span>{method.description}</span>
              </div>
            </div>

            {/* PRICE */}
            <div className="admin-delivery-price-section">
              <label htmlFor={`delivery-${method.id}`}>
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

            {/* PREVIEW */}
            <div className="admin-delivery-preview">
              <span>CUSTOMER WILL SEE</span>

              <div>
                <strong>{method.name}</strong>

                <strong>
                  ₹{Number(method.price || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              <p>{method.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CURRENT SETTINGS */}
      <section className="admin-delivery-summary">
        <div className="admin-delivery-summary-header">
          <div>
            <span className="admin-delivery-eyebrow">
              CURRENT CONFIGURATION
            </span>

            <h2>Delivery Fees</h2>
          </div>
        </div>

        <div className="admin-delivery-summary-list">
          {deliveryMethods.map((method) => (
            <div
              className="admin-delivery-summary-row"
              key={method.id}
            >
              <div>
                <strong>{method.name}</strong>

                <span>{method.description}</span>
              </div>

              <strong>
                ₹{Number(method.price || 0).toLocaleString("en-IN")}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminDeliverySettings;