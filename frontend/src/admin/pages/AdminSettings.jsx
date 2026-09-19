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

const defaultSettings = {
  storeName: "UNTKN",
  tagline: "More than just a T-shirt",

  runningBannerEnabled: true,

  runningBannerMessage1:
    "FREE SHIPPING ON ORDERS ABOVE ₹999",

  runningBannerMessage2:
    "NEW DROP LIVE NOW",

  runningBannerMessage3:
    "EASY RETURNS",

  email: "support@untkn.in",

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

function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /*
   * LOAD SETTINGS
   */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/settings/admin");

        if (response.data?.settings) {
          setSettings({
            ...defaultSettings,
            ...response.data.settings,

            freeShipping:
              response.data.settings.freeShipping !==
              undefined
                ? String(
                    response.data.settings.freeShipping
                  )
                : "999",

            shippingCharge:
              response.data.settings.shippingCharge !==
              undefined
                ? String(
                    response.data.settings.shippingCharge
                  )
                : "99",
          });
        }
      } catch (err) {
        console.error(
          "Failed to load store settings:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load store settings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /*
   * HANDLE INPUT CHANGES
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
  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const response = await api.put(
        "/settings/admin",
        {
          ...settings,

          freeShipping: Number(
            settings.freeShipping
          ),

          shippingCharge: Number(
            settings.shippingCharge
          ),
        }
      );

      if (response.data?.settings) {
        setSettings({
          ...defaultSettings,
          ...response.data.settings,

          freeShipping:
            response.data.settings.freeShipping !==
            undefined
              ? String(
                  response.data.settings.freeShipping
                )
              : "999",

          shippingCharge:
            response.data.settings.shippingCharge !==
            undefined
              ? String(
                  response.data.settings.shippingCharge
                )
              : "99",
        });
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Failed to save store settings:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save store settings."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * LOADING STATE
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
            Manage your store information and
            storefront settings.
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

      {/* ERROR MESSAGE */}

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

              <h2>Store Information</h2>

              <p>
                Basic information displayed across
                the storefront.
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
                value={settings.storeName}
                onChange={handleChange}
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
                value={settings.tagline}
                onChange={handleChange}
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
                  value={settings.website}
                  onChange={handleChange}
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

              <h2>Contact Information</h2>

              <p>
                Contact details shown on the website.
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
                  value={settings.email}
                  onChange={handleChange}
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
                  value={settings.phone}
                  onChange={handleChange}
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
                  value={settings.whatsapp}
                  onChange={handleChange}
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
                  value={settings.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SOCIAL LINKS */}

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

              <h2>Social Links</h2>

              <p>
                Manage your social media profile
                links.
              </p>
            </div>
          </div>

          <div className="admin-settings-fields">
            {/* INSTAGRAM */}

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
                  value={settings.instagram}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* FACEBOOK */}

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
                  value={settings.facebook}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* YOUTUBE */}

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
                  value={settings.youtube}
                  onChange={handleChange}
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

      <h2>Running Banner</h2>

      <p>
        Manage the scrolling announcement bar
        displayed at the top of the website.
      </p>
    </div>

  </div>

  <div className="admin-settings-fields">

    {/* MESSAGE 1 */}

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
          settings.runningBannerMessage1
        }
        onChange={handleChange}
        placeholder="FREE SHIPPING ON ORDERS ABOVE ₹999"
      />

    </div>

    {/* MESSAGE 2 */}

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
          settings.runningBannerMessage2
        }
        onChange={handleChange}
        placeholder="NEW DROP LIVE NOW"
      />

    </div>

    {/* MESSAGE 3 */}

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
          settings.runningBannerMessage3
        }
        onChange={handleChange}
        placeholder="EASY RETURNS"
      />

    </div>

  </div>

  {/* ENABLE / DISABLE */}

  <div className="admin-settings-toggles">

    <label className="admin-settings-toggle">

      <div>
        <strong>
          Running Banner
        </strong>

        <span>
          Show the scrolling announcement bar
          on the customer website.
        </span>
      </div>

      <input
        type="checkbox"
        name="runningBannerEnabled"
        checked={
          settings.runningBannerEnabled
        }
        onChange={handleChange}
      />

      <span className="admin-toggle-slider" />

    </label>

  </div>

</div>

        {/* STORE SETTINGS */}

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

              <h2>Store Settings</h2>

              <p>
                Configure currency and shipping
                options.
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
                value={settings.currency}
                onChange={handleChange}
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
                value={settings.currencySymbol}
                onChange={handleChange}
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
                value={settings.freeShipping}
                onChange={handleChange}
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
                value={settings.shippingCharge}
                onChange={handleChange}
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

              <h2>Website Features</h2>

              <p>
                Enable or disable selected storefront
                features.
              </p>
            </div>
          </div>

          <div className="admin-settings-toggles">
            {/* CONTACT FORM */}

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
                onChange={handleChange}
              />

              <span className="admin-toggle-slider" />
            </label>

            {/* NEWSLETTER */}

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
                checked={
                  settings.newsletterEnabled
                }
                onChange={handleChange}
              />

              <span className="admin-toggle-slider" />
            </label>

            {/* MAINTENANCE MODE */}

            <label className="admin-settings-toggle">
              <div>
                <strong>
                  Maintenance Mode
                </strong>

                <span>
                  Temporarily disable the customer
                  storefront.
                </span>
              </div>

              <input
                type="checkbox"
                name="maintenanceMode"
                checked={
                  settings.maintenanceMode
                }
                onChange={handleChange}
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