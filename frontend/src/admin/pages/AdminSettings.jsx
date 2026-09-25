import { useEffect, useState } from "react";

import {
  Save,
  Store,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
} from "lucide-react";

import api from "../../services/api.js";

const DEFAULT_SETTINGS = {
  storeName: "UNTKN",
  tagline: "More than just a T-shirt",

  runningBannerEnabled: true,
  runningBannerMessage1:
    "FREE SHIPPING ON ORDERS ABOVE ₹999",
  runningBannerMessage2: "NEW DROP LIVE NOW",
  runningBannerMessage3: "EASY RETURNS",

  email: "support@untkn.in",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  address: "Kolkata, West Bengal, India",

  instagram:
    "https://www.instagram.com/untknofficialstore/",
  facebook: "",
  youtube: "",
  website: "https://untkn.in",

  currency: "INR",
  currencySymbol: "₹",
  freeShipping: "999",
  shippingCharge: "99",

  contactEnabled: true,
  newsletterEnabled: true,
  maintenanceMode: false,
};

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const safeBoolean = (value, fallback = false) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return Boolean(value);
};

const safeNumberString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (value === "") {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return String(number);
};

const normalizeMessages = (bannerSettings) => {
  if (!bannerSettings) {
    return [
      DEFAULT_SETTINGS.runningBannerMessage1,
      DEFAULT_SETTINGS.runningBannerMessage2,
      DEFAULT_SETTINGS.runningBannerMessage3,
    ];
  }

  if (
    Array.isArray(bannerSettings.messages)
  ) {
    return [
      safeString(
        bannerSettings.messages[0],
        DEFAULT_SETTINGS.runningBannerMessage1
      ),
      safeString(
        bannerSettings.messages[1],
        DEFAULT_SETTINGS.runningBannerMessage2
      ),
      safeString(
        bannerSettings.messages[2],
        DEFAULT_SETTINGS.runningBannerMessage3
      ),
    ];
  }

  return [
    safeString(
      bannerSettings.message_1,
      DEFAULT_SETTINGS.runningBannerMessage1
    ),
    safeString(
      bannerSettings.message_2,
      DEFAULT_SETTINGS.runningBannerMessage2
    ),
    safeString(
      bannerSettings.message_3,
      DEFAULT_SETTINGS.runningBannerMessage3
    ),
  ];
};

const normalizeSettings = (
  storeSettings = {},
  bannerSettings = {}
) => {
  const messages = normalizeMessages(
    bannerSettings
  );

  return {
    storeName: safeString(
      storeSettings.storeName,
      DEFAULT_SETTINGS.storeName
    ),

    tagline: safeString(
      storeSettings.tagline,
      DEFAULT_SETTINGS.tagline
    ),

    runningBannerEnabled: safeBoolean(
      bannerSettings.enabled,
      DEFAULT_SETTINGS.runningBannerEnabled
    ),

    runningBannerMessage1:
      messages[0],

    runningBannerMessage2:
      messages[1],

    runningBannerMessage3:
      messages[2],

    email: safeString(
      storeSettings.email,
      DEFAULT_SETTINGS.email
    ),

    phone: safeString(
      storeSettings.phone,
      DEFAULT_SETTINGS.phone
    ),

    whatsapp: safeString(
      storeSettings.whatsapp,
      DEFAULT_SETTINGS.whatsapp
    ),

    address: safeString(
      storeSettings.address,
      DEFAULT_SETTINGS.address
    ),

    instagram: safeString(
      storeSettings.instagram,
      DEFAULT_SETTINGS.instagram
    ),

    facebook: safeString(
      storeSettings.facebook,
      DEFAULT_SETTINGS.facebook
    ),

    youtube: safeString(
      storeSettings.youtube,
      DEFAULT_SETTINGS.youtube
    ),

    website: safeString(
      storeSettings.website,
      DEFAULT_SETTINGS.website
    ),

    currency: safeString(
      storeSettings.currency,
      DEFAULT_SETTINGS.currency
    ),

    currencySymbol: safeString(
      storeSettings.currencySymbol,
      DEFAULT_SETTINGS.currencySymbol
    ),

    freeShipping: safeNumberString(
      storeSettings.freeShipping,
      DEFAULT_SETTINGS.freeShipping
    ),

    shippingCharge: safeNumberString(
      storeSettings.shippingCharge,
      DEFAULT_SETTINGS.shippingCharge
    ),

    contactEnabled: safeBoolean(
      storeSettings.contactEnabled,
      DEFAULT_SETTINGS.contactEnabled
    ),

    newsletterEnabled: safeBoolean(
      storeSettings.newsletterEnabled,
      DEFAULT_SETTINGS.newsletterEnabled
    ),

    maintenanceMode: safeBoolean(
      storeSettings.maintenanceMode,
      DEFAULT_SETTINGS.maintenanceMode
    ),
  };
};

const getResponseSettings = (response) => {
  if (!response) {
    return {};
  }

  if (
    response.data &&
    typeof response.data === "object"
  ) {
    if (
      response.data.settings &&
      typeof response.data.settings === "object"
    ) {
      return response.data.settings;
    }

    return response.data;
  }

  return {};
};

function AdminSettings() {
  const [settings, setSettings] =
    useState(() => ({
      ...DEFAULT_SETTINGS,
    }));

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          settingsResponse,
          bannerResponse,
        ] = await Promise.all([
          api.get("/settings/admin", {
            params: {
              _: Date.now(),
            },
          }),

          api.get(
            "/settings/running-banner",
            {
              params: {
                _: Date.now(),
              },
            }
          ),
        ]);

        if (!mounted) {
          return;
        }

        const storeSettings =
          getResponseSettings(
            settingsResponse
          );

        const bannerSettings =
          getResponseSettings(
            bannerResponse
          );

        const normalized =
          normalizeSettings(
            storeSettings,
            bannerSettings
          );

        setSettings(normalized);
      } catch (err) {
        console.error(
          "Failed to load settings:",
          err
        );

        if (!mounted) {
          return;
        }

        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load store settings.";

        setError(message);

        setSettings({
          ...DEFAULT_SETTINGS,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? Boolean(checked)
          : value ?? "",
    }));

    setSaved(false);
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const storeName = safeString(
        settings.storeName
      ).trim();

      const email = safeString(
        settings.email
      ).trim();

      const freeShippingValue =
        safeString(
          settings.freeShipping
        ).trim();

      const shippingChargeValue =
        safeString(
          settings.shippingCharge
        ).trim();

      if (!storeName) {
        setError(
          "Store Name is required."
        );
        return;
      }

      if (!email) {
        setError(
          "Email Address is required."
        );
        return;
      }

      if (!freeShippingValue) {
        setError(
          "Free Shipping Above must be a valid number."
        );
        return;
      }

      if (!shippingChargeValue) {
        setError(
          "Standard Shipping Charge must be a valid number."
        );
        return;
      }

      const freeShipping =
        Number(freeShippingValue);

      const shippingCharge =
        Number(shippingChargeValue);

      if (
        !Number.isFinite(
          freeShipping
        ) ||
        freeShipping < 0
      ) {
        setError(
          "Free Shipping Above must be a valid number."
        );
        return;
      }

      if (
        !Number.isFinite(
          shippingCharge
        ) ||
        shippingCharge < 0
      ) {
        setError(
          "Standard Shipping Charge must be a valid number."
        );
        return;
      }

      const bannerMessages = [
        safeString(
          settings.runningBannerMessage1
        )
          .trim()
          .slice(0, 80),

        safeString(
          settings.runningBannerMessage2
        )
          .trim()
          .slice(0, 80),

        safeString(
          settings.runningBannerMessage3
        )
          .trim()
          .slice(0, 80),
      ];

      if (
        bannerMessages.some(
          (message) => !message
        )
      ) {
        setError(
          "All three running banner messages are required."
        );
        return;
      }

      const storePayload = {
        storeName,

        tagline: safeString(
          settings.tagline
        ).trim(),

        email,

        phone: safeString(
          settings.phone
        ).trim(),

        whatsapp: safeString(
          settings.whatsapp
        ).trim(),

        address: safeString(
          settings.address
        ).trim(),

        instagram: safeString(
          settings.instagram
        ).trim(),

        facebook: safeString(
          settings.facebook
        ).trim(),

        youtube: safeString(
          settings.youtube
        ).trim(),

        website: safeString(
          settings.website
        ).trim(),

        currency: safeString(
          settings.currency,
          "INR"
        ),

        currencySymbol: safeString(
          settings.currencySymbol,
          "₹"
        ),

        freeShipping,

        shippingCharge,

        contactEnabled:
          Boolean(
            settings.contactEnabled
          ),

        newsletterEnabled:
          Boolean(
            settings.newsletterEnabled
          ),

        maintenanceMode:
          Boolean(
            settings.maintenanceMode
          ),
      };

      const bannerPayload = {
        enabled:
          Boolean(
            settings.runningBannerEnabled
          ),

        messages:
          bannerMessages,

        message_1:
          bannerMessages[0],

        message_2:
          bannerMessages[1],

        message_3:
          bannerMessages[2],
      };

      const [
        settingsResponse,
        bannerResponse,
      ] = await Promise.all([
        api.put(
          "/settings/admin",
          storePayload
        ),

        api.put(
          "/settings/running-banner",
          bannerPayload
        ),
      ]);

      const savedStoreSettings =
        getResponseSettings(
          settingsResponse
        );

      const savedBannerSettings =
        getResponseSettings(
          bannerResponse
        );

      const normalizedSaved =
        normalizeSettings(
          {
            ...storePayload,
            ...savedStoreSettings,
          },
          {
            ...bannerPayload,
            ...savedBannerSettings,
          }
        );

      setSettings(
        normalizedSaved
      );

      window.dispatchEvent(
        new Event(
          "runningBannerUpdated"
        )
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Failed to save settings:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save store settings.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-settings-page">
        <div className="admin-page-header">
          <div>
            <p className="admin-eyebrow">
              CONFIGURATION
            </p>

            <h1>Settings</h1>

            <p>
              Loading store settings...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-settings-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            CONFIGURATION
          </p>

          <h1>Settings</h1>

          <p>
            Manage your store information
            and storefront settings.
          </p>
        </div>

        <button
          type="submit"
          form="admin-settings-form"
          className="admin-primary-button"
          disabled={saving}
        >
          <Save
            size={17}
            strokeWidth={1.6}
          />

          <span>
            {saving
              ? "Saving..."
              : saved
              ? "Saved"
              : "Save Changes"}
          </span>
        </button>
      </div>

      {error && (
        <div
          className="admin-error-message"
          style={{
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <form
        id="admin-settings-form"
        onSubmit={handleSave}
        className="admin-settings-form"
      >
        <div className="admin-settings-panel">
          <div className="admin-settings-panel-header">
            <div className="admin-settings-panel-icon">
              <Store
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="admin-panel-eyebrow">
                STORE
              </p>

              <h2>
                Store Information
              </h2>

              <p>
                Basic information displayed
                across the storefront.
              </p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <div className="admin-settings-field">
              <label htmlFor="storeName">
                Store Name
              </label>

              <input
                id="storeName"
                name="storeName"
                type="text"
                value={
                  settings.storeName ?? ""
                }
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="tagline">
                Tagline
              </label>

              <input
                id="tagline"
                name="tagline"
                type="text"
                value={
                  settings.tagline ?? ""
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-settings-field full">
              <label htmlFor="website">
                Website
              </label>

              <div className="admin-settings-input-icon">
                <Globe
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="website"
                  name="website"
                  type="url"
                  value={
                    settings.website ?? ""
                  }
                  onChange={handleChange}
                  placeholder="https://untkn.in"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-settings-panel">
          <div className="admin-settings-panel-header">
            <div className="admin-settings-panel-icon">
              <Mail
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="admin-panel-eyebrow">
                CONTACT
              </p>

              <h2>
                Contact Information
              </h2>

              <p>
                Contact details shown on
                the website.
              </p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <div className="admin-settings-field">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="admin-settings-input-icon">
                <Mail
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    settings.email ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="phone">
                Phone Number
              </label>

              <div className="admin-settings-input-icon">
                <Phone
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={
                    settings.phone ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="whatsapp">
                WhatsApp Number
              </label>

              <div className="admin-settings-input-icon">
                <MessageCircle
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={
                    settings.whatsapp ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="address">
                Store Address
              </label>

              <div className="admin-settings-input-icon">
                <MapPin
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={
                    settings.address ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-settings-panel">
          <div className="admin-settings-panel-header">
            <div className="admin-settings-panel-icon">
              <Globe
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="admin-panel-eyebrow">
                SOCIAL
              </p>

              <h2>
                Social Links
              </h2>

              <p>
                Manage your social media
                profile links.
              </p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <div className="admin-settings-field">
              <label htmlFor="instagram">
                Instagram
              </label>

              <div className="admin-settings-input-icon">
                <Globe
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="instagram"
                  name="instagram"
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={
                    settings.instagram ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="facebook">
                Facebook
              </label>

              <div className="admin-settings-input-icon">
                <Globe
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="facebook"
                  name="facebook"
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={
                    settings.facebook ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="youtube">
                YouTube
              </label>

              <div className="admin-settings-input-icon">
                <Globe
                  size={16}
                  strokeWidth={1.5}
                />

                <input
                  id="youtube"
                  name="youtube"
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={
                    settings.youtube ?? ""
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-settings-panel">
          <div className="admin-settings-panel-header">
            <div className="admin-settings-panel-icon">
              <MessageCircle
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="admin-panel-eyebrow">
                HOMEPAGE
              </p>

              <h2>
                Running Banner
              </h2>

              <p>
                Manage the scrolling
                announcement bar displayed
                at the top of the website.
              </p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <div className="admin-settings-field full">
              <label htmlFor="runningBannerMessage1">
                Message 1
              </label>

              <input
                id="runningBannerMessage1"
                name="runningBannerMessage1"
                type="text"
                maxLength={80}
                value={
                  settings.runningBannerMessage1 ??
                  ""
                }
                onChange={handleChange}
                placeholder="FREE SHIPPING ON ORDERS ABOVE ₹999"
                disabled={saving}
              />
            </div>

            <div className="admin-settings-field full">
              <label htmlFor="runningBannerMessage2">
                Message 2
              </label>

              <input
                id="runningBannerMessage2"
                name="runningBannerMessage2"
                type="text"
                maxLength={80}
                value={
                  settings.runningBannerMessage2 ??
                  ""
                }
                onChange={handleChange}
                placeholder="NEW DROP LIVE NOW"
                disabled={saving}
              />
            </div>

            <div className="admin-settings-field full">
              <label htmlFor="runningBannerMessage3">
                Message 3
              </label>

              <input
                id="runningBannerMessage3"
                name="runningBannerMessage3"
                type="text"
                maxLength={80}
                value={
                  settings.runningBannerMessage3 ??
                  ""
                }
                onChange={handleChange}
                placeholder="EASY RETURNS"
                disabled={saving}
              />
            </div>
          </div>

          <div className="admin-settings-toggles">
            <label className="admin-settings-toggle">
              <div>
                <strong>
                  Running Banner
                </strong>

                <span>
                  Show the scrolling
                  announcement bar on the
                  customer website.
                </span>
              </div>

              <input
                type="checkbox"
                name="runningBannerEnabled"
                checked={Boolean(
                  settings.runningBannerEnabled
                )}
                onChange={handleChange}
                disabled={saving}
              />

              <span className="admin-toggle-slider" />
            </label>
          </div>
        </div>

        <div className="admin-settings-panel">
          <div className="admin-settings-panel-header">
            <div className="admin-settings-panel-icon">
              <Store
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="admin-panel-eyebrow">
                STORE CONFIGURATION
              </p>

              <h2>
                Store Settings
              </h2>

              <p>
                Configure currency and
                shipping options.
              </p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <div className="admin-settings-field">
              <label htmlFor="currency">
                Currency
              </label>

              <select
                id="currency"
                name="currency"
                value={
                  settings.currency ?? "INR"
                }
                onChange={handleChange}
                disabled={saving}
              >
                <option value="INR">
                  INR — Indian Rupee
                </option>

                <option value="USD">
                  USD — US Dollar
                </option>

                <option value="EUR">
                  EUR — Euro
                </option>
              </select>
            </div>

            <div className="admin-settings-field">
              <label htmlFor="currencySymbol">
                Currency Symbol
              </label>

              <input
                id="currencySymbol"
                name="currencySymbol"
                type="text"
                value={
                  settings.currencySymbol ?? "₹"
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="freeShipping">
                Free Shipping Above
              </label>

              <input
                id="freeShipping"
                name="freeShipping"
                type="number"
                min="0"
                step="0.01"
                value={
                  settings.freeShipping ?? ""
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="shippingCharge">
                Standard Shipping Charge
              </label>

              <input
                id="shippingCharge"
                name="shippingCharge"
                type="number"
                min="0"
                step="0.01"
                value={
                  settings.shippingCharge ?? ""
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="admin-settings-panel">
          <div className="admin-settings-panel-header">
            <div className="admin-settings-panel-icon">
              <Globe
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="admin-panel-eyebrow">
                WEBSITE
              </p>

              <h2>
                Website Features
              </h2>

              <p>
                Enable or disable selected
                storefront features.
              </p>
            </div>
          </div>

          <div className="admin-settings-toggles">
            <label className="admin-settings-toggle">
              <div>
                <strong>
                  Contact Form
                </strong>

                <span>
                  Allow customers to submit
                  inquiries.
                </span>
              </div>

              <input
                type="checkbox"
                name="contactEnabled"
                checked={Boolean(
                  settings.contactEnabled
                )}
                onChange={handleChange}
                disabled={saving}
              />

              <span className="admin-toggle-slider" />
            </label>

            <label className="admin-settings-toggle">
              <div>
                <strong>
                  Newsletter
                </strong>

                <span>
                  Show newsletter subscription
                  forms.
                </span>
              </div>

              <input
                type="checkbox"
                name="newsletterEnabled"
                checked={Boolean(
                  settings.newsletterEnabled
                )}
                onChange={handleChange}
                disabled={saving}
              />

              <span className="admin-toggle-slider" />
            </label>

            <label className="admin-settings-toggle">
              <div>
                <strong>
                  Maintenance Mode
                </strong>

                <span>
                  Temporarily disable the
                  customer storefront.
                </span>
              </div>

              <input
                type="checkbox"
                name="maintenanceMode"
                checked={Boolean(
                  settings.maintenanceMode
                )}
                onChange={handleChange}
                disabled={saving}
              />

              <span className="admin-toggle-slider" />
            </label>
          </div>
        </div>
      </form>
    </section>
  );
}

export default AdminSettings;