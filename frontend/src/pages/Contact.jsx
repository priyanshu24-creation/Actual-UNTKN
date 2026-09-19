import { useState } from "react";

import {
  Mail,
  ArrowRight,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // FRONTEND ONLY
    // Contact API will be connected later.
    console.log("Contact form:", formData);

    alert(
      "Your message has been received. Contact API will be connected later."
    );

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="contact-page">

      {/* ================= CONTACT HEADER ================= */}

      <section className="contact-header">
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
      </section>

      {/* ================= CONTACT CONTENT ================= */}

      <section className="contact-content">

        {/* ================= CONTACT INFORMATION ================= */}

        <div className="contact-information">

          {/* CUSTOMER CARE */}

          <div className="contact-block">
            <p className="eyebrow">
              CUSTOMER CARE
            </p>

            <a href="mailto:hello@untkn.in">
              hello@untkn.in
            </a>

            <p>
              Monday — Friday
              <br />
              10:00 — 18:00 IST
            </p>
          </div>

          {/* SOCIAL */}

          <div className="contact-block">
            <p className="eyebrow">
              SOCIAL
            </p>

            <a
              href="https://www.instagram.com/untknofficialstore/"
              className="contact-social"
              aria-label="Instagram"
            >
              <FaInstagram size={17} />
              INSTAGRAM
            </a>
          </div>

          {/* GENERAL */}

          <div className="contact-block">
            <p className="eyebrow">
              GENERAL
            </p>

            <a
              href="mailto:hello@untkn.in"
              className="contact-social"
            >
              <Mail
                size={17}
                strokeWidth={1.5}
              />
              EMAIL US
            </a>
          </div>

        </div>

        {/* ================= CONTACT FORM ================= */}

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

            {/* NAME */}

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
                required
              />
            </div>

            {/* EMAIL */}

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
                required
              />
            </div>

            {/* SUBJECT */}

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

            {/* MESSAGE */}

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

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              className="contact-submit"
            >
              SEND MESSAGE

              <ArrowRight
                size={17}
                strokeWidth={1.5}
              />
            </button>

          </form>
        </div>

      </section>
    </div>
  );
}

export default Contact;