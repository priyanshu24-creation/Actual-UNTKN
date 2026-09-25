import { useEffect, useState } from "react";
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

const cleanMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .slice(0, 3)
    .map((message) =>
      typeof message === "string"
        ? message.trim()
        : ""
    )
    .filter(Boolean);
};

function AdminRunningBanner() {
  const [messages, setMessages] = useState(
    DEFAULT_MESSAGES
  );

  const [enabled, setEnabled] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/settings/running-banner",
        {
          params: {
            _: Date.now(),
          },
          headers: {
            "Cache-Control":
              "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      const settings =
        response?.data?.settings;

      if (!settings) {
        setMessages(
          DEFAULT_MESSAGES
        );
        setEnabled(true);
        return;
      }

      const serverMessages =
        cleanMessages(
          settings.messages
        );

      setMessages(
        serverMessages.length > 0
          ? [
              ...serverMessages,
              ...DEFAULT_MESSAGES,
            ].slice(0, 3)
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
        "Unable to load current banner settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleMessageChange = (
    index,
    value
  ) => {
    setMessages(
      (currentMessages) =>
        currentMessages.map(
          (
            message,
            messageIndex
          ) =>
            messageIndex === index
              ? value
              : message
        )
    );

    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    const finalMessages =
      messages.map((message) =>
        String(message || "").trim()
      );

    if (
      enabled &&
      finalMessages.every(
        (message) => !message
      )
    ) {
      setError(
        "Enter at least one banner message."
      );
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response =
        await api.put(
          "/settings/running-banner",
          {
            enabled,
            messages:
              finalMessages.slice(
                0,
                3
              ),
          }
        );

      if (
        response?.data?.success ===
        false
      ) {
        throw new Error(
          response?.data?.message ||
            "Failed to save banner settings."
        );
      }

      const savedSettings =
        response?.data?.settings;

      if (
        savedSettings &&
        Array.isArray(
          savedSettings.messages
        )
      ) {
        const normalized =
          cleanMessages(
            savedSettings.messages
          );

        if (normalized.length > 0) {
          setMessages(
            [
              ...normalized,
              ...DEFAULT_MESSAGES,
            ].slice(0, 3)
          );
        }
      }

      if (
        savedSettings?.enabled !==
        undefined
      ) {
        setEnabled(
          Boolean(
            savedSettings.enabled
          )
        );
      }

      setSaved(true);

      window.dispatchEvent(
        new Event(
          "runningBannerUpdated"
        )
      );

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (requestError) {
      console.error(
        "Failed to save running banner:",
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Failed to save banner settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMessages(
      DEFAULT_MESSAGES
    );

    setEnabled(true);
    setSaved(false);
    setError("");
  };

  const previewMessages =
    messages.length > 0
      ? messages
      : DEFAULT_MESSAGES;

  const renderPreviewSet = (
    setIndex
  ) => (
    <div
      className="admin-running-banner-preview-set"
      key={`preview-set-${setIndex}`}
      aria-hidden={
        setIndex === 1
      }
    >
      {previewMessages.map(
        (message, index) => (
          <span
            className="admin-running-banner-preview-item"
            key={`preview-item-${setIndex}-${index}`}
          >
            <span>
              {message ||
                "YOUR MESSAGE"}
            </span>

            <span className="admin-running-banner-preview-separator">
              •
            </span>
          </span>
        )
      )}
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
          animation:
            admin-running-banner-scroll
            24s
            linear
            infinite;
          will-change: transform;
        }

        .admin-running-banner-preview-set {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          width: max-content;
        }

        .admin-running-banner-preview-item {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .admin-running-banner-preview-separator {
          display: inline-flex;
          margin: 0 52px;
          opacity: 0.7;
        }

        @keyframes admin-running-banner-scroll {
          from {
            transform:
              translate3d(
                0,
                0,
                0
              );
          }

          to {
            transform:
              translate3d(
                -50%,
                0,
                0
              );
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
          }

          .admin-running-banner-preview-separator {
            margin: 0 30px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-running-banner-preview-track {
            animation: none;
            transform:
              translate3d(
                0,
                0,
                0
              );
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
            Manage the announcement messages
            displayed in the running banner at
            the top of the website.
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
            disabled={
              saving || loading
            }
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
                <CheckCircle2
                  size={15}
                />
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
            borderColor:
              "rgba(160, 0, 0, 0.2)",
          }}
        >
          <div className="admin-running-banner-status-icon">
            <Megaphone size={18} />
          </div>

          <div>
            <strong>
              BANNER ERROR
            </strong>

            <p>
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="admin-running-banner-status">
        <div className="admin-running-banner-status-icon">
          <Megaphone size={18} />
        </div>

        <div>
          <strong>
            Running announcement bar
          </strong>

          <p>
            These messages appear in the
            scrolling announcement bar at the
            very top of the customer website.
          </p>
        </div>
      </div>

      <section className="admin-running-banner-card">
        <div className="admin-running-banner-card-header">
          <div>
            <span className="admin-running-banner-section-label">
              BANNER SETTINGS
            </span>

            <h2>
              Announcement Messages
            </h2>

            <p>
              Customers will see these messages
              continuously scrolling in this
              exact order.
            </p>
          </div>

          <label className="admin-running-banner-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                setEnabled(
                  event.target.checked
                );

                setSaved(false);
                setError("");
              }}
            />

            <span className="admin-running-banner-toggle-slider" />

            <span className="admin-running-banner-toggle-text">
              {enabled
                ? "ENABLED"
                : "DISABLED"}
            </span>
          </label>
        </div>

        <div className="admin-running-banner-messages">
          {[0, 1, 2].map(
            (index) => {
              const message =
                messages[index] ??
                "";

              return (
                <div
                  className="admin-running-banner-message"
                  key={index}
                >
                  <div className="admin-running-banner-message-top">
                    <label
                      htmlFor={`banner-message-${index}`}
                    >
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
                    onChange={(
                      event
                    ) =>
                      handleMessageChange(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`Enter banner message ${
                      index + 1
                    }`}
                  />
                </div>
              );
            }
          )}
        </div>
      </section>

      <section className="admin-running-banner-preview">
        <div className="admin-running-banner-preview-header">
          <div>
            <span className="admin-running-banner-section-label">
              PREVIEW
            </span>

            <h2>
              Customer View
            </h2>

            <p>
              This is exactly how the running
              banner sequence will appear on the
              website.
            </p>
          </div>

          <Eye
            size={18}
            strokeWidth={1.5}
          />
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
              {renderPreviewSet(0)}
              {renderPreviewSet(1)}
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
