import { useState } from "react";
import {
  Megaphone,
  Save,
  RefreshCw,
  CheckCircle2,
  Eye,
} from "lucide-react";

function AdminRunningBanner() {
  const defaultMessages = [
    "FREE SHIPPING ON ORDERS ABOVE ₹999",
    "NEW DROP LIVE NOW",
    "EASY RETURNS",
  ];

  const [messages, setMessages] = useState(defaultMessages);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleMessageChange = (index, value) => {
    setMessages((currentMessages) =>
      currentMessages.map((message, messageIndex) =>
        messageIndex === index ? value : message
      )
    );

    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    /*
      BACKEND INTEGRATION

      Your friend can connect the backend API here later.

      Example:

      await api.put("/settings/running-banner", {
        enabled,
        messages,
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
    setMessages(defaultMessages);
    setEnabled(true);
    setSaved(false);
  };

  return (
    <div className="admin-running-banner">

      {/* ================= HEADER ================= */}

      <div className="admin-running-banner-header">

        <div>
          <span className="admin-running-banner-eyebrow">
            HOMEPAGE CONFIGURATION
          </span>

          <h1>Running Banner</h1>

          <p>
            Manage the announcement messages displayed in the
            running banner at the top of the website.
          </p>
        </div>

        <div className="admin-running-banner-actions">

          <button
            type="button"
            className="admin-running-banner-reset"
            onClick={handleReset}
          >
            <RefreshCw size={15} />
            RESET
          </button>

          <button
            type="button"
            className="admin-running-banner-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw
                  size={15}
                  className="admin-running-banner-spin"
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

      {/* ================= STATUS ================= */}

      <div className="admin-running-banner-status">

        <div className="admin-running-banner-status-icon">
          <Megaphone size={18} />
        </div>

        <div>
          <strong>Running announcement bar</strong>

          <p>
            These messages appear in the scrolling announcement
            bar at the very top of the customer website.
          </p>
        </div>

      </div>

      {/* ================= SETTINGS ================= */}

      <section className="admin-running-banner-card">

        <div className="admin-running-banner-card-header">

          <div>
            <span className="admin-running-banner-section-label">
              BANNER SETTINGS
            </span>

            <h2>Announcement Messages</h2>

            <p>
              Customers will see these messages continuously
              scrolling across the top of the website.
            </p>
          </div>

          <label className="admin-running-banner-toggle">

            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                setEnabled(event.target.checked);
                setSaved(false);
              }}
            />

            <span className="admin-running-banner-toggle-slider" />

            <span className="admin-running-banner-toggle-text">
              {enabled ? "ENABLED" : "DISABLED"}
            </span>

          </label>

        </div>

        {/* ================= MESSAGE INPUTS ================= */}

        <div className="admin-running-banner-messages">

          {messages.map((message, index) => (
            <div
              className="admin-running-banner-message"
              key={index}
            >

              <div className="admin-running-banner-message-top">

                <label htmlFor={`banner-message-${index}`}>
                  MESSAGE {index + 1}
                </label>

                <span>
                  {message.length}/80
                </span>

              </div>

              <input
                id={`banner-message-${index}`}
                type="text"
                value={message}
                maxLength={80}
                onChange={(event) =>
                  handleMessageChange(
                    index,
                    event.target.value
                  )
                }
                placeholder={`Enter banner message ${index + 1}`}
              />

            </div>
          ))}

        </div>

      </section>

      {/* ================= LIVE PREVIEW ================= */}

      <section className="admin-running-banner-preview">

        <div className="admin-running-banner-preview-header">

          <div>
            <span className="admin-running-banner-section-label">
              PREVIEW
            </span>

            <h2>Customer View</h2>

            <p>
              This is how the running banner will appear on
              the website.
            </p>
          </div>

          <Eye size={18} strokeWidth={1.5} />

        </div>

        <div
          className={
            enabled
              ? "admin-running-banner-preview-bar"
              : "admin-running-banner-preview-bar disabled"
          }
        >

          {enabled ? (
            <div className="admin-running-banner-preview-track">

              <span>
                {messages[0] || "YOUR MESSAGE"}
              </span>

              <span>•</span>

              <span>
                {messages[1] || "YOUR MESSAGE"}
              </span>

              <span>•</span>

              <span>
                {messages[2] || "YOUR MESSAGE"}
              </span>

              <span>•</span>

              <span>
                {messages[0] || "YOUR MESSAGE"}
              </span>

              <span>•</span>

              <span>
                {messages[1] || "YOUR MESSAGE"}
              </span>

              <span>•</span>

              <span>
                {messages[2] || "YOUR MESSAGE"}
              </span>

            </div>
          ) : (
            <span className="admin-running-banner-disabled-text">
              RUNNING BANNER DISABLED
            </span>
          )}

        </div>

      </section>

    </div>
  );
}

export default AdminRunningBanner;