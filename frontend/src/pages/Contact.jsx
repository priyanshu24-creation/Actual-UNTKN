import { useEffect, useState } from "react";

import {
  Mail,
  ArrowRight,
  MapPin,
  MessageCircle,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
} from "react-icons/fa";

import api from "../services/api";

function Contact() {
  const [settings, setSettings] = useState({
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    instagram: "",
    facebook: "",
    youtube: "",
    contactEnabled: true,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/settings/public");

        if (response.data?.success) {
          setSettings((current) => ({
            ...current,
            ...response.data.settings,
          }));
        }
      } catch (error) {
        console.error("Failed to load contact settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (status.message) {
      setStatus({
        type: "",
        message: "",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setStatus({
        type: "error",
        message: "Please enter your name.",
      });
      return;
    }

    if (!formData.email.trim()) {
      setStatus({
        type: "error",
        message: "Please enter your email.",
      });
      return;
    }

    if (!formData.subject) {
      setStatus({
        type: "error",
        message: "Please select a subject.",
      });
      return;
    }

    if (!formData.message.trim()) {
      setStatus({
        type: "error",
        message: "Please enter your message.",
      });
      return;
    }

    try {
      setSubmitting(true);

      setStatus({
        type: "",
        message: "",
      });

      const response = await api.post("/inquiries", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to send your message."
        );
      }

      setStatus({
        type: "success",
        message:
          response.data.message ||
          "Your message has been sent successfully.",
      });

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);

      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to send your message. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPhoneLink = () => {
    if (!settings.phone) {
      return "#";
    }

    return `tel:${settings.phone.replace(/\s/g, "")}`;
  };

  const getWhatsAppLink = () => {
    if (!settings.whatsapp) {
      return "#";
    }

    const number = settings.whatsapp.replace(/\D/g, "");

    return `https://wa.me/${number}`;
  };

  const getMapsLink = () => {
    if (!settings.address) {
      return "#";
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      settings.address
    )}`;
  };

  if (!loading && settings.contactEnabled === false) {
    return (
      <>
        <style>{styles}</style>

        <div className="contact-page">
          <section className="contact-disabled">
            <p className="eyebrow">CONTACT</p>

            <h1>
              WE'RE
              <br />
              UNAVAILABLE.
            </h1>

            <p>
              Our customer care service is temporarily
              unavailable. Please check back again soon.
            </p>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="contact-page">
        <section className="contact-header">
          <div className="contact-header-content">
            <div>
              <p className="eyebrow">
                01 / GET IN TOUCH
              </p>

              <h1>
                CONTACT
                <br />
                US.
              </h1>
            </div>

            <p className="contact-intro">
              Questions about an order, the collection
              or anything else? Send us a message.
            </p>
          </div>
        </section>

        <section className="contact-content">
          <div className="contact-information">
            <div className="contact-block">
              <p className="eyebrow">
                CUSTOMER CARE
              </p>

              {loading ? (
                <div className="contact-loading">
                  LOADING...
                </div>
              ) : (
                <>
                  {settings.email && (
                    <a
                      href={`mailto:${settings.email}`}
                      className="contact-primary-link"
                    >
                      {settings.email}
                    </a>
                  )}

                  {settings.phone && (
                    <a
                      href={getPhoneLink()}
                      className="contact-secondary-link"
                    >
                      {settings.phone}
                    </a>
                  )}
                </>
              )}

              <p className="contact-hours">
                Monday — Friday
                <br />
                10:00 — 18:00 IST
              </p>
            </div>

            {settings.whatsapp && (
              <div className="contact-block">
                <p className="eyebrow">
                  WHATSAPP
                </p>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social"
                >
                  <MessageCircle
                    size={17}
                    strokeWidth={1.5}
                  />
                  CHAT WITH US
                </a>
              </div>
            )}

            {settings.address && (
              <div className="contact-block">
                <p className="eyebrow">
                  ADDRESS
                </p>

                <a
                  href={getMapsLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-address"
                >
                  <MapPin
                    size={17}
                    strokeWidth={1.5}
                  />

                  <span>{settings.address}</span>
                </a>
              </div>
            )}

            <div className="contact-block">
              <p className="eyebrow">
                SOCIAL
              </p>

              <div className="contact-social-list">
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-social"
                  >
                    <FaInstagram size={17} />
                    INSTAGRAM
                  </a>
                )}

                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-social"
                  >
                    <FaFacebookF size={15} />
                    FACEBOOK
                  </a>
                )}

                {settings.youtube && (
                  <a
                    href={settings.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-social"
                  >
                    <FaYoutube size={17} />
                    YOUTUBE
                  </a>
                )}
              </div>
            </div>

            {settings.email && (
              <div className="contact-block">
                <p className="eyebrow">
                  GENERAL
                </p>

                <a
                  href={`mailto:${settings.email}`}
                  className="contact-social"
                >
                  <Mail
                    size={17}
                    strokeWidth={1.5}
                  />
                  EMAIL US
                </a>
              </div>
            )}
          </div>

          <div className="contact-form-wrapper">
            <div className="contact-form-heading">
              <p className="eyebrow">
                02 / SEND A MESSAGE
              </p>

              <h2>
                LET'S
                <br />
                TALK.
              </h2>
            </div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >
              <div className="contact-form-row">
                <div className="contact-field">
                  <label htmlFor="contact-name">
                    NAME
                  </label>

                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="YOUR NAME"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-email">
                    EMAIL
                  </label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="YOUR EMAIL"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">
                  SUBJECT
                </label>

                <select
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    SELECT SUBJECT
                  </option>

                  <option value="order">
                    ORDER SUPPORT
                  </option>

                  <option value="product">
                    PRODUCT QUESTION
                  </option>

                  <option value="collaboration">
                    COLLABORATION
                  </option>

                  <option value="general">
                    GENERAL ENQUIRY
                  </option>
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">
                  MESSAGE
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="WRITE YOUR MESSAGE"
                  rows="7"
                  required
                />
              </div>

              {status.message && (
                <div
                  className={`contact-status contact-status-${status.type}`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                className="contact-submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "SENDING..."
                    : "SEND MESSAGE"}
                </span>

                <ArrowRight
                  size={17}
                  strokeWidth={1.5}
                />
              </button>
            </form>
          </div>
        </section>

        <section className="contact-footer-section">
          <div>
            <p className="eyebrow">
              03 / WE'RE HERE TO HELP
            </p>

            <h3>
              HAVE A QUESTION?
              <br />
              WE'VE GOT YOU.
            </h3>
          </div>

          <div className="contact-footer-copy">
            <p>
              Whether you need help with an order, sizing,
              delivery or anything else, our customer care
              team is ready to help.
            </p>

            {settings.email && (
              <a href={`mailto:${settings.email}`}>
                {settings.email}

                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                />
              </a>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

const styles = `
.contact-page {
  width: 100%;
  min-height: 100vh;
  background: #fff;
  color: #080808;
}

.contact-header {
  width: 100%;
  border-bottom: 1px solid #dedede;
}

.contact-header-content {
  width: min(1380px, calc(100% - 80px));
  min-height: 470px;
  margin: 0 auto;
  padding: 110px 0 70px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 80px;
}

.contact-header h1 {
  margin: 0;
  font-size: clamp(76px, 10vw, 150px);
  line-height: 0.8;
  font-weight: 800;
  letter-spacing: -0.075em;
}

.contact-intro {
  width: min(330px, 100%);
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.7;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.eyebrow {
  margin: 0 0 18px;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.contact-content {
  width: min(1380px, calc(100% - 80px));
  margin: 0 auto;
  padding: 80px 0 110px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 110px;
}

.contact-information {
  display: flex;
  flex-direction: column;
}

.contact-block {
  padding-bottom: 30px;
  margin-bottom: 30px;
  border-bottom: 1px solid #dedede;
}

.contact-block:last-child {
  margin-bottom: 0;
}

.contact-primary-link,
.contact-secondary-link {
  display: block;
  color: #080808;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.contact-primary-link {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 500;
  word-break: break-word;
}

.contact-secondary-link {
  font-size: 12px;
}

.contact-primary-link:hover,
.contact-secondary-link:hover,
.contact-social:hover,
.contact-address:hover,
.contact-footer-copy a:hover {
  opacity: 0.5;
}

.contact-hours {
  margin: 25px 0 0;
  color: #777;
  font-size: 10px;
  line-height: 1.7;
}

.contact-loading {
  color: #999;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.contact-social-list {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.contact-social {
  display: flex;
  align-items: center;
  gap: 11px;
  width: fit-content;
  color: #080808;
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: opacity 0.2s ease;
}

.contact-address {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  color: #080808;
  text-decoration: none;
  font-size: 11px;
  line-height: 1.6;
  transition: opacity 0.2s ease;
}

.contact-form-wrapper {
  min-width: 0;
}

.contact-form-heading {
  margin-bottom: 55px;
}

.contact-form-heading h2 {
  margin: 0;
  font-size: clamp(65px, 8vw, 120px);
  line-height: 0.79;
  font-weight: 800;
  letter-spacing: -0.075em;
}

.contact-form {
  width: 100%;
}

.contact-form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}

.contact-field {
  margin-bottom: 30px;
}

.contact-field label {
  display: block;
  margin-bottom: 11px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
}

.contact-field input,
.contact-field select,
.contact-field textarea {
  width: 100%;
  border: 0;
  border-bottom: 1px solid #cfcfcf;
  border-radius: 0;
  outline: none;
  background: transparent;
  color: #080808;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  transition: border-color 0.2s ease;
}

.contact-field input,
.contact-field select {
  height: 48px;
}

.contact-field textarea {
  min-height: 145px;
  padding: 14px 0;
  resize: vertical;
  line-height: 1.7;
}

.contact-field input:focus,
.contact-field select:focus,
.contact-field textarea:focus {
  border-bottom-color: #080808;
}

.contact-field input::placeholder,
.contact-field textarea::placeholder {
  color: #999;
  opacity: 1;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.contact-field select {
  appearance: none;
  cursor: pointer;
  padding-right: 20px;
}

.contact-submit {
  width: 100%;
  min-height: 62px;
  margin-top: 10px;
  padding: 0 24px;
  border: 1px solid #080808;
  background: #080808;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  transition: background 0.2s ease, color 0.2s ease;
}

.contact-submit:hover:not(:disabled) {
  background: #fff;
  color: #080808;
}

.contact-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.contact-status {
  margin-bottom: 20px;
  padding: 14px 16px;
  font-size: 11px;
  line-height: 1.5;
}

.contact-status-success {
  background: #eef7ef;
  color: #275a30;
}

.contact-status-error {
  background: #faeeee;
  color: #8a2929;
}

.contact-footer-section {
  width: min(1380px, calc(100% - 80px));
  margin: 0 auto;
  padding: 75px 0 110px;
  border-top: 1px solid #dedede;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 100px;
}

.contact-footer-section h3 {
  margin: 0;
  font-size: clamp(42px, 5vw, 78px);
  line-height: 0.86;
  font-weight: 800;
  letter-spacing: -0.06em;
}

.contact-footer-copy {
  max-width: 420px;
  align-self: end;
}

.contact-footer-copy p {
  margin: 0 0 30px;
  color: #666;
  font-size: 12px;
  line-height: 1.8;
}

.contact-footer-copy a {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #080808;
  text-decoration: none;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  transition: opacity 0.2s ease;
}

.contact-disabled {
  width: min(900px, calc(100% - 40px));
  margin: 0 auto;
  padding: 180px 0;
}

.contact-disabled h1 {
  margin: 0;
  font-size: clamp(60px, 10vw, 140px);
  line-height: 0.82;
  letter-spacing: -0.07em;
}

.contact-disabled > p:last-child {
  max-width: 420px;
  margin-top: 35px;
  color: #666;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .contact-header-content,
  .contact-content,
  .contact-footer-section {
    width: min(100% - 48px, 900px);
  }

  .contact-content {
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 70px;
  }

  .contact-header-content {
    gap: 50px;
  }
}

@media (max-width: 800px) {
  .contact-header-content {
    min-height: auto;
    padding: 80px 0 55px;
    display: block;
  }

  .contact-header h1 {
    font-size: clamp(72px, 17vw, 125px);
  }

  .contact-intro {
    margin-top: 50px;
  }

  .contact-content {
    padding: 60px 0 80px;
    grid-template-columns: 1fr;
    gap: 65px;
  }

  .contact-information {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 30px;
  }

  .contact-block {
    margin: 0;
  }

  .contact-form-heading {
    margin-bottom: 45px;
  }

  .contact-form-heading h2 {
    font-size: clamp(65px, 16vw, 105px);
  }

  .contact-footer-section {
    padding: 65px 0 80px;
    grid-template-columns: 1fr;
    gap: 50px;
  }
}

@media (max-width: 560px) {
  .contact-header-content,
  .contact-content,
  .contact-footer-section {
    width: calc(100% - 32px);
  }

  .contact-header-content {
    padding: 60px 0 45px;
  }

  .contact-header h1 {
    font-size: clamp(66px, 20vw, 100px);
  }

  .contact-intro {
    max-width: 300px;
    margin-top: 42px;
    font-size: 9px;
  }

  .contact-content {
    padding: 50px 0 65px;
    gap: 55px;
  }

  .contact-information {
    display: block;
  }

  .contact-block {
    margin-bottom: 30px;
    padding-bottom: 30px;
  }

  .contact-form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .contact-form-heading {
    margin-bottom: 40px;
  }

  .contact-form-heading h2 {
    font-size: clamp(62px, 19vw, 95px);
  }

  .contact-field {
    margin-bottom: 27px;
  }

  .contact-field input,
  .contact-field select {
    height: 45px;
  }

  .contact-field textarea {
    min-height: 130px;
  }

  .contact-submit {
    min-height: 58px;
  }

  .contact-footer-section {
    padding: 55px 0 70px;
  }

  .contact-footer-section h3 {
    font-size: clamp(42px, 13vw, 65px);
  }
}
`;

export default Contact;