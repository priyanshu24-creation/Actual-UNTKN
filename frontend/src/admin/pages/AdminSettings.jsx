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

const DEFAULT_BANNER_MESSAGES = [
  "FREE SHIPPING ON ORDERS ABOVE ₹999",
  "NEW DROP LIVE NOW",
  "EASY RETURNS",
];

const defaultSettings = {
  storeName: "UNTKN",
  tagline: "More than just a T-shirt",

  runningBannerEnabled: true,
  runningBannerMessage1: DEFAULT_BANNER_MESSAGES[0],
  runningBannerMessage2: DEFAULT_BANNER_MESSAGES[1],
  runningBannerMessage3: DEFAULT_BANNER_MESSAGES[2],

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

const cleanNumber = (value, fallback) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const cleaned = String(value)
    .replace(/[₹$€£,\s]/g, "")
    .trim();

  if (!cleaned) {
    return fallback;
  }

  const number = Number(cleaned);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return fallback;
  }

  return number;
};

const numberToString = (value, fallback) => {
  return String(
    cleanNumber(value, fallback)
  );
};

const normalizeBannerMessages = (
  bannerSettings
) => {
  if (!bannerSettings) {
    return DEFAULT_BANNER_MESSAGES;
  }

  let messages = [];

  if (
    Array.isArray(
      bannerSettings.messages
    )
  ) {
    messages = bannerSettings.messages;
  } else {
    messages = [
      bannerSettings.message_1,
      bannerSettings.message_2,
      bannerSettings.message_3,
    ];
  }

  return DEFAULT_BANNER_MESSAGES.map(
    (defaultMessage, index) => {
      const message = messages[index];

      if (
        typeof message === "string" &&
        message.trim()
      ) {
        return message
          .trim()
          .slice(0, 80);
      }

      return defaultMessage;
    }
  );
};

const getErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

function AdminSettings() {
  const [settings, setSettings] =
    useState(defaultSettings);

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
      setLoading(true);
      setError("");

      const [
        settingsResult,
        bannerResult,
      ] = await Promise.allSettled([
        api.get("/settings/admin"),

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

      let nextSettings = {
        ...defaultSettings,
      };

      const errors = [];

      /*
       * STORE SETTINGS
       */

      if (
        settingsResult.status ===
        "fulfilled"
      ) {
        const storeSettings =
          settingsResult.value?.data
            ?.settings || {};

        nextSettings = {
          ...nextSettings,

          ...storeSettings,

          freeShipping:
            numberToString(
              storeSettings.freeShipping,
              999
            ),

          shippingCharge:
            numberToString(
              storeSettings.shippingCharge,
              99
            ),

          contactEnabled:
            storeSettings.contactEnabled !==
            undefined
              ? Boolean(
                  storeSettings.contactEnabled
                )
              : defaultSettings.contactEnabled,

          newsletterEnabled:
            storeSettings.newsletterEnabled !==
            undefined
              ? Boolean(
                  storeSettings.newsletterEnabled
                )
              : defaultSettings.newsletterEnabled,

          maintenanceMode:
            storeSettings.maintenanceMode !==
            undefined
              ? Boolean(
                  storeSettings.maintenanceMode
                )
              : defaultSettings.maintenanceMode,
        };
      } else {
        console.error(
          "Failed to load store settings:",
          settingsResult.reason
        );

        errors.push(
          getErrorMessage(
            settingsResult.reason,
            "Failed to load store settings."
          )
        );
      }

      /*
       * RUNNING BANNER SETTINGS
       */

      if (
        bannerResult.status ===
        "fulfilled"
      ) {
        const bannerSettings =
          bannerResult.value?.data
            ?.settings || {};

        const messages =
          normalizeBannerMessages(
            bannerSettings
          );

        nextSettings = {
          ...nextSettings,

          runningBannerEnabled:
            bannerSettings.enabled !==
            undefined
              ? Boolean(
                  bannerSettings.enabled
                )
              : defaultSettings.runningBannerEnabled,

          runningBannerMessage1:
            messages[0],

          runningBannerMessage2:
            messages[1],

          runningBannerMessage3:
            messages[2],
        };
      } else {
        console.error(
          "Failed to load running banner settings:",
          bannerResult.reason
        );

        /*
         * Do not break the entire Settings
         * page if the banner endpoint fails.
         */
        errors.push(
          getErrorMessage(
            bannerResult.reason,
            "Failed to load running banner settings."
          )
        );
      }

      setSettings(nextSettings);

      if (errors.length > 0) {
        /*
         * Only show the error if the actual
         * store settings request failed.
         *
         * Banner failure should not prevent
         * the main Settings page from working.
         */
        if (
          settingsResult.status ===
          "rejected"
        ) {
          setError(errors[0]);
        }
      }

      setLoading(false);
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * INPUT CHANGE
   */

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
          ? checked
          : value,
    }));

    setSaved(false);
    setError("");
  };

  /*
   * SAVE SETTINGS
   */

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      /*
       * NORMALIZE NUMBERS
       *
       * This is important because the
       * database may return:
       *
       * 999
       * "999"
       * "₹999"
       * "1,999"
       *
       * and all of them should work.
       */

      const freeShipping =
        cleanNumber(
          settings.freeShipping,
          999
        );

      const shippingCharge =
        cleanNumber(
          settings.shippingCharge,
          99
        );

      /*
       * NORMALIZE BANNER MESSAGES
       */

      const bannerMessages = [
        String(
          settings.runningBannerMessage1 ||
            ""
        )
          .trim()
          .slice(0, 80),

        String(
          settings.runningBannerMessage2 ||
            ""
        )
          .trim()
          .slice(0, 80),

        String(
          settings.runningBannerMessage3 ||
            ""
        )
          .trim()
          .slice(0, 80),
      ];

      /*
       * Make sure banner messages are not
       * accidentally empty.
       */

      if (
        bannerMessages.some(
          (message) => !message
        )
      ) {
        setError(
          "All three running banner messages are required."
        );

        setSaving(false);
        return;
      }

      /*
       * STORE SETTINGS PAYLOAD
       */

      const storePayload = {
        storeName: String(
          settings.storeName || ""
        ).trim(),

        tagline: String(
          settings.tagline || ""
        ).trim(),

        email: String(
          settings.email || ""
        ).trim(),

        phone: String(
          settings.phone || ""
        ).trim(),

        whatsapp: String(
          settings.whatsapp || ""
        ).trim(),

        address: String(
          settings.address || ""
        ).trim(),

        instagram: String(
          settings.instagram || ""
        ).trim(),

        facebook: String(
          settings.facebook || ""
        ).trim(),

        youtube: String(
          settings.youtube || ""
        ).trim(),

        website: String(
          settings.website || ""
        ).trim(),

        currency: String(
          settings.currency || "INR"
        ).trim(),

        currencySymbol: String(
          settings.currencySymbol || "₹"
        ).trim(),

        freeShipping,

        shippingCharge,

        contactEnabled: Boolean(
          settings.contactEnabled
        ),

        newsletterEnabled: Boolean(
          settings.newsletterEnabled
        ),

        maintenanceMode: Boolean(
          settings.maintenanceMode
        ),
      };

      /*
       * RUNNING BANNER PAYLOAD
       *
       * Keep `messages` because that is
       * the format used by your existing
       * AdminSettings implementation.
       */

      const bannerPayload = {
        enabled: Boolean(
          settings.runningBannerEnabled
        ),

        messages: bannerMessages,
      };

      /*
       * SAVE BOTH SETTINGS
       *
       * Promise.allSettled prevents one
       * endpoint from hiding the result
       * of the other endpoint.
       */

      const [
        settingsResult,
        bannerResult,
      ] = await Promise.allSettled([
        api.put(
          "/settings/admin",
          storePayload
        ),

        api.put(
          "/settings/running-banner",
          bannerPayload
        ),
      ]);

      const saveErrors = [];

      /*
       * STORE SETTINGS RESULT
       */

      if (
        settingsResult.status ===
        "rejected"
      ) {
        console.error(
          "Failed to save store settings:",
          settingsResult.reason
        );

        saveErrors.push(
          getErrorMessage(
            settingsResult.reason,
            "Failed to save store settings."
          )
        );
      }

      /*
       * RUNNING BANNER RESULT
       */

      if (
        bannerResult.status ===
        "rejected"
      ) {
        console.error(
          "Failed to save running banner settings:",
          bannerResult.reason
        );

        saveErrors.push(
          getErrorMessage(
            bannerResult.reason,
            "Failed to save running banner settings."
          )
        );
      }

      /*
       * If either request failed,
       * show the actual error.
       */

      if (saveErrors.length > 0) {
        setError(
          saveErrors.join(" ")
        );

        setSaving(false);
        return;
      }

      /*
       * READ SAVED RESPONSE
       */

      const savedStoreSettings =
        settingsResult.value?.data
          ?.settings || {};

      const savedBannerSettings =
        bannerResult.value?.data
          ?.settings || {};

      const savedBannerMessages =
        normalizeBannerMessages(
          savedBannerSettings
        );

      /*
       * UPDATE LOCAL STATE WITH THE
       * ACTUAL SAVED VALUES
       */

      setSettings({
        ...defaultSettings,

        ...savedStoreSettings,

        freeShipping:
          numberToString(
            savedStoreSettings.freeShipping,
            freeShipping
          ),

        shippingCharge:
          numberToString(
            savedStoreSettings.shippingCharge,
            shippingCharge
          ),

        runningBannerEnabled:
          savedBannerSettings.enabled !==
          undefined
            ? Boolean(
                savedBannerSettings.enabled
              )
            : Boolean(
                settings.runningBannerEnabled
              ),

        runningBannerMessage1:
          savedBannerMessages[0],

        runningBannerMessage2:
          savedBannerMessages[1],

        runningBannerMessage3:
          savedBannerMessages[2],
      });

      /*
       * SUCCESS
       */

      setSaved(true);

      /*
       * Tell Navbar to reload the banner.
       */

      window.dispatchEvent(
        new Event(
          "runningBannerUpdated"
        )
      );

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (saveError) {
      console.error(
        "Failed to save settings:",
        saveError
      );

      setError(
        getErrorMessage(
          saveError,
          "Failed to save settings."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * LOADING
   */

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

  /*
   * PAGE
   */

  return (
    <section className="admin-settings-page">
      {/* PAGE HEADER */}

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

      {/* ERROR */}

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
        {/* STORE INFORMATION */}

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
                  settings.storeName
                }
                onChange={handleChange}
                disabled={saving}
                required
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
                  settings.tagline
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
                    settings.website
                  }
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://untkn.in"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT */}

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
                Contact details shown on the
                website.
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
                    settings.email
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
                    settings.phone
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
                    settings.whatsapp
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
                    settings.address
                  }
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SOCIAL */}

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
                  value={
                    settings.instagram
                  }
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://instagram.com/..."
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
                  value={
                    settings.facebook
                  }
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://facebook.com/..."
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
                  value={
                    settings.youtube
                  }
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* RUNNING BANNER */}

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
            {[1, 2, 3].map(
              (number) => {
                const field =
                  `runningBannerMessage${number}`;

                return (
                  <div
                    className="admin-settings-field full"
                    key={field}
                  >
                    <label
                      htmlFor={field}
                    >
                      Message {number}
                    </label>

                    <input
                      id={field}
                      name={field}
                      type="text"
                      maxLength={80}
                      value={
                        settings[field]
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                      placeholder={
                        DEFAULT_BANNER_MESSAGES[
                          number - 1
                        ]
                      }
                    />
                  </div>
                );
              }
            )}
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
                checked={
                  settings.runningBannerEnabled
                }
                onChange={
                  handleChange
                }
                disabled={saving}
              />

              <span className="admin-toggle-slider" />
            </label>
          </div>
        </div>

        {/* STORE CONFIGURATION */}

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
                  settings.currency
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
                  settings.currencySymbol
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
                step="1"
                value={
                  settings.freeShipping
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
                step="1"
                value={
                  settings.shippingCharge
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* WEBSITE FEATURES */}

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
                checked={
                  settings.contactEnabled
                }
                onChange={
                  handleChange
                }
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
                  Show newsletter
                  subscription forms.
                </span>
              </div>

              <input
                type="checkbox"
                name="newsletterEnabled"
                checked={
                  settings.newsletterEnabled
                }
                onChange={
                  handleChange
                }
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
                checked={
                  settings.maintenanceMode
                }
                onChange={
                  handleChange
                }
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