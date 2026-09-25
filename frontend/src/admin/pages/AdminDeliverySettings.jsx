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
  const [deliveryMethods, setDeliveryMethods] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toBoolean = (value) => {
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
      id: String(method.id),
      name: method.name,
      description:
        method.description || "",
      price: Number(
        method.price ?? 0
      ),
      enabled: toBoolean(
        method.isActive ??
          method.is_active ??
          method.enabled
      ),
    }));
  };

  const loadDeliveryMethods =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/delivery-methods/admin",
            {
              params: {
                _: Date.now(),
              },
              headers: {
                "Cache-Control":
                  "no-cache",
                Pragma: "no-cache",
              },
            }
          );

        const methods =
          normalizeMethods(
            response.data
              ?.deliveryMethods
          );

        setDeliveryMethods(
          methods
        );
      } catch (requestError) {
        console.error(
          "Failed to load delivery methods:",
          requestError
        );

        setDeliveryMethods([]);

        setError(
          requestError?.response
            ?.data?.message ||
            "Unable to load delivery settings."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE
  |--------------------------------------------------------------------------
  | Toggle is saved immediately.
  */
  const handleToggle = async (id) => {
    if (loading || saving) {
      return;
    }

    const currentMethod =
      deliveryMethods.find(
        (method) =>
          method.id === id
      );

    if (!currentMethod) {
      return;
    }

    const newValue =
      !currentMethod.enabled;

    setError("");
    setSaved(false);

    setDeliveryMethods(
      (currentMethods) =>
        currentMethods.map(
          (method) =>
            method.id === id
              ? {
                  ...method,
                  enabled:
                    newValue,
                }
              : method
        )
    );

    try {
      setSaving(true);

      const response =
        await api.patch(
          `/delivery-methods/admin/${encodeURIComponent(
            id
          )}`,
          {
            isActive: newValue,
          }
        );

      const updated =
        response.data
          ?.deliveryMethod;

      if (updated) {
        setDeliveryMethods(
          (currentMethods) =>
            currentMethods.map(
              (method) =>
                method.id === id
                  ? {
                      ...method,
                      enabled:
                        toBoolean(
                          updated.isActive
                        ),
                      price: Number(
                        updated.price ??
                          method.price
                      ),
                    }
                  : method
            )
        );
      }

      setSaved(true);

      window.setTimeout(
        () => {
          setSaved(false);
        },
        2000
      );
    } catch (requestError) {
      console.error(
        "Failed to update delivery availability:",
        requestError
      );

      setDeliveryMethods(
        (currentMethods) =>
          currentMethods.map(
            (method) =>
              method.id === id
                ? {
                    ...method,
                    enabled:
                      currentMethod.enabled,
                  }
                : method
          )
      );

      setError(
        requestError?.response
          ?.data?.message ||
          "Unable to update delivery availability."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CHANGE PRICE
  |--------------------------------------------------------------------------
  */
  const handlePriceChange = (
    id,
    value
  ) => {
    setDeliveryMethods(
      (currentMethods) =>
        currentMethods.map(
          (method) =>
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

  /*
  |--------------------------------------------------------------------------
  | SAVE PRICE + CURRENT STATE
  |--------------------------------------------------------------------------
  */
  const handleSave = async () => {
    if (
      saving ||
      loading ||
      deliveryMethods.length === 0
    ) {
      return;
    }

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const payload = {
        deliveryMethods:
          deliveryMethods.map(
            (method) => ({
              id: method.id,
              name: method.name,
              description:
                method.description,
              price: Math.max(
                0,
                Number(
                  method.price || 0
                )
              ),
              isActive:
                method.enabled ===
                true,
            })
          ),
      };

      await api.put(
        "/delivery-methods/admin",
        payload
      );

      await loadDeliveryMethods();

      setSaved(true);

      window.setTimeout(
        () => {
          setSaved(false);
        },
        2500
      );
    } catch (requestError) {
      console.error(
        "Failed to save delivery settings:",
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          "Unable to save delivery settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      saving ||
      loading
    ) {
      return;
    }

    setSaved(false);

    await loadDeliveryMethods();
  };

  return (
    <div className="admin-delivery-settings">

      <div className="admin-delivery-header">
        <div>
          <span className="admin-delivery-eyebrow">
            SHIPPING CONFIGURATION
          </span>

          <h1>
            Delivery Settings
          </h1>

          <p>
            Manage the delivery
            methods, availability
            and fees shown to
            customers during
            checkout.
          </p>
        </div>

        <div className="admin-delivery-header-actions">
          <button
            type="button"
            className="admin-delivery-reset"
            onClick={handleReset}
            disabled={
              loading || saving
            }
          >
            <RefreshCw size={15} />
            RESET
          </button>

          <button
            type="button"
            className="admin-delivery-save"
            onClick={handleSave}
            disabled={
              loading ||
              saving ||
              deliveryMethods.length === 0
            }
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
            padding:
              "14px 16px",
            border:
              "1px solid #b3261e",
            background:
              "#fff5f5",
            color: "#8a1c16",
            fontSize: "13px",
            lineHeight: "1.5",
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
            Turn a delivery
            method OFF when
            you do not want
            customers to pay
            for that delivery
            service.
          </p>
        </div>
      </div>

      <div className="admin-delivery-grid">

        {loading ? (
          <div
            style={{
              gridColumn:
                "1 / -1",
              padding: "40px 0",
              textAlign:
                "center",
              fontSize: "13px",
            }}
          >
            LOADING DELIVERY
            SETTINGS...
          </div>
        ) : deliveryMethods.length ===
          0 ? (
          <div
            style={{
              gridColumn:
                "1 / -1",
              padding: "40px 0",
              textAlign:
                "center",
              fontSize: "13px",
            }}
          >
            NO DELIVERY
            METHODS ARE
            CONFIGURED.
          </div>
        ) : (
          deliveryMethods.map(
            (method) => (
              <div
                className={`admin-delivery-card ${
                  !method.enabled
                    ? "admin-delivery-card-disabled"
                    : ""
                }`}
                key={method.id}
              >

                <div className="admin-delivery-card-header">

                  <div className="admin-delivery-method-icon">
                    {method.id ===
                    "express" ? (
                      <Zap size={19} />
                    ) : (
                      <Truck size={19} />
                    )}
                  </div>

                  <div className="admin-delivery-method-title">
                    <h2>
                      {method.name}
                    </h2>

                    <span>
                      {method.description}
                    </span>
                  </div>

                </div>

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
                      handleToggle(
                        method.id
                      )
                    }
                    disabled={
                      saving ||
                      loading
                    }
                    aria-label={`${
                      method.enabled
                        ? "Disable"
                        : "Enable"
                    } ${
                      method.name
                    }`}
                    aria-pressed={
                      method.enabled
                    }
                  >
                    {method.enabled ? (
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
                      value={
                        method.price
                      }
                      disabled={
                        saving ||
                        loading
                      }
                      onChange={(
                        event
                      ) =>
                        handlePriceChange(
                          method.id,
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                </div>

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
                            method.price ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      <p>
                        {
                          method.description
                        }
                      </p>
                    </>
                  ) : (
                    <div className="admin-delivery-preview-disabled">
                      <strong>
                        NOT SHOWN TO
                        CUSTOMERS
                      </strong>

                      <p>
                        This delivery
                        method is
                        currently
                        disabled.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )
          )
        )}

      </div>

      <section className="admin-delivery-summary">

        <div className="admin-delivery-summary-header">
          <div>
            <span className="admin-delivery-eyebrow">
              CURRENT CONFIGURATION
            </span>

            <h2>
              Delivery Methods
            </h2>
          </div>
        </div>

        <div className="admin-delivery-summary-list">

          {deliveryMethods.map(
            (method) => (
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
                      method.price ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>

              </div>
            )
          )}

        </div>
      </section>

    </div>
  );
}

export default AdminDeliverySettings;