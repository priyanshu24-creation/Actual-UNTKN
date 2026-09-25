import { useCallback, useEffect, useState } from "react";
import {
  Megaphone,
  Save,
  RefreshCw,
  CheckCircle2,
  Eye,
} from "lucide-react";
import api from "../../services/api.js";

const DEFAULT_MESSAGES = [
  "FREE SHIPPING ON ORDERS ABOVE ₹999",
  "NEW DROP LIVE NOW",
  "EASY RETURNS",
];

const normalizeThreeMessages = (messages) => {
  const values = Array.isArray(messages) ? messages : [];

  return [0, 1, 2].map((index) =>
    typeof values[index] === "string"
      ? values[index].trim().slice(0, 80)
      : ""
  );
};

const getSettingsMessages = (settings) => {
  if (!settings) return null;

  const fieldMessages = [
    settings.message_1,
    settings.message_2,
    settings.message_3,
  ];

  const hasFieldValues = fieldMessages.some(
    (message) =>
      typeof message === "string" && message.trim().length > 0
  );

  if (hasFieldValues) {
    return normalizeThreeMessages(fieldMessages);
  }

  if (Array.isArray(settings.messages)) {
    return normalizeThreeMessages(settings.messages);
  }

  return null;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

function AdminRunningBanner() {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/settings/running-banner", {
        params: { _: Date.now() },
      });

      const settings = response?.data?.settings;

      if (!settings) {
        setMessages(DEFAULT_MESSAGES);
        setEnabled(true);
        return;
      }

      const serverMessages = getSettingsMessages(settings);

      setMessages(
        serverMessages?.length === 3
          ? serverMessages.map(
              (message, index) =>
                message || DEFAULT_MESSAGES[index]
            )
          : DEFAULT_MESSAGES
      );

      setEnabled(
        settings.enabled !== undefined
          ? Boolean(settings.enabled)
          : true
      );
    } catch (requestError) {
      console.error(
        "Failed to load running banner settings:",
        requestError
      );

      setError(
        getErrorMessage(
          requestError,
          "Unable to load current banner settings."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleMessageChange = (index, value) => {
    setMessages((currentMessages) =>
      currentMessages.map((message, messageIndex) =>
        messageIndex === index
          ? value.slice(0, 80)
          : message
      )
    );

    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    const finalMessages = normalizeThreeMessages(messages);

    if (finalMessages.some((message) => !message)) {
      setError("All three banner messages are required.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await api.put(
        "/settings/running-banner",
        {
          enabled: Boolean(enabled),
          messages: finalMessages,
          message_1: finalMessages[0],
          message_2: finalMessages[1],
          message_3: finalMessages[2],
        }
      );

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.message ||
            "Failed to save banner settings."
        );
      }

      const savedSettings = response?.data?.settings;
      const returnedMessages =
        getSettingsMessages(savedSettings);

      setMessages(
        returnedMessages
          ? returnedMessages.map(
              (message, index) =>
                message || DEFAULT_MESSAGES[index]
            )
          : finalMessages
      );

      if (savedSettings?.enabled !== undefined) {
        setEnabled(Boolean(savedSettings.enabled));
      }

      setSaved(true);

      window.dispatchEvent(
        new Event("runningBannerUpdated")
      );

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (requestError) {
      console.error(
        "Failed to save running banner:",
        requestError
      );

      setError(
        getErrorMessage(
          requestError,
          "Failed to save banner settings."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMessages(DEFAULT_MESSAGES);
    setEnabled(true);
    setSaved(false);
    setError("");
  };

  const previewMessages =
    messages.length === 3
      ? messages
      : DEFAULT_MESSAGES;

  const renderPreviewSet = (setIndex) => (
    <div
      className="admin-running-banner-preview-set"
      key={`preview-set-${setIndex}`}
      aria-hidden={setIndex !== 0}
    >
      {previewMessages.filter(Boolean).map((message, index) => (
        <span
          className="admin-running-banner-preview-item"
          key={`preview-${setIndex}-${index}`}
        >
          <span>{message}</span>
          <span className="admin-running-banner-preview-separator">
            •
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="admin-running-banner">
      <style>{`
        .admin-running-banner-preview-bar {
          overflow: hidden;
          white-space: nowrap;
        }

        .admin-running-banner-preview-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: admin-running-banner-scroll 24s linear infinite;
          will-change: transform;
        }

        .admin-running-banner-preview-set {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .admin-running-banner-preview-item {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          white-space: nowrap;
          font-size: 9px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 0 26px;
        }

        .admin-running-banner-preview-separator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1em;
          opacity: 0.7;
        }

        @keyframes admin-running-banner-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .admin-running-banner-preview-bar:hover
          .admin-running-banner-preview-track {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .admin-running-banner-preview-track {
            animation-duration: 18s;
          }

          .admin-running-banner-preview-item {
            font-size: 8px;
            padding: 0 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-running-banner-preview-track {
            animation: none;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>

      <div className="admin-running-banner-header">
        <div>
          <span className="admin-running-banner-eyebrow">
            HOMEPAGE CONFIGURATION
          </span>

          <h1>Running Banner</h1>

          <p>
            Manage the announcement messages displayed in the running
            banner at the top of the website.
          </p>
        </div>

        <div className="admin-running-banner-actions">
          <button
            type="button"
            className="admin-running-banner-reset"
            onClick={handleReset}
            disabled={saving}
          >
            <RefreshCw size={15} />
            RESET
          </button>

          <button
            type="button"
            className="admin-running-banner-save"
            onClick={handleSave}
            disabled={saving || loading}
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

      {error && (
        <div
          className="admin-running-banner-status"
          style={{
            borderColor: "rgba(160, 0, 0, 0.2)",
          }}
        >
          <div className="admin-running-banner-status-icon">
            <Megaphone size={18} />
          </div>

          <div>
            <strong>BANNER ERROR</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="admin-running-banner-status">
        <div className="admin-running-banner-status-icon">
          <Megaphone size={18} />
        </div>

        <div>
          <strong>Running announcement bar</strong>
          <p>
            These messages appear in the scrolling announcement bar at
            the very top of the customer website.
          </p>
        </div>
      </div>

      <section className="admin-running-banner-card">
        <div className="admin-running-banner-card-header">
          <div>
            <span className="admin-running-banner-section-label">
              BANNER SETTINGS
            </span>

            <h2>Announcement Messages</h2>

            <p>
              Customers will see these messages continuously scrolling
              in this exact order.
            </p>
          </div>

          <label className="admin-running-banner-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                setEnabled(event.target.checked);
                setSaved(false);
                setError("");
              }}
              disabled={saving || loading}
            />

            <span className="admin-running-banner-toggle-slider" />

            <span className="admin-running-banner-toggle-text">
              {enabled ? "ENABLED" : "DISABLED"}
            </span>
          </label>
        </div>

        <div className="admin-running-banner-messages">
          {[0, 1, 2].map((index) => {
            const message = messages[index] ?? "";

            return (
              <div
                className="admin-running-banner-message"
                key={index}
              >
                <div className="admin-running-banner-message-top">
                  <label htmlFor={`banner-message-${index}`}>
                    MESSAGE {index + 1}
                  </label>

                  <span>{message.length}/80</span>
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
                  disabled={saving || loading}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-running-banner-preview">
        <div className="admin-running-banner-preview-header">
          <div>
            <span className="admin-running-banner-section-label">
              PREVIEW
            </span>

            <h2>Customer View</h2>

            <p>
              This is exactly how the running banner sequence will
              appear on the website.
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
              {[0, 1].map(renderPreviewSet)}
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
