import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api.js";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const fullName =
      `${formData.firstName} ${formData.lastName}`.trim();

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: fullName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log("Registration successful:", response.data);

      navigate("/account", { replace: true });
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">

        {/* HEADER */}

        <div className="auth-header">

          <p className="eyebrow">
            JOIN THE LABEL
          </p>

          <h1>
            CREATE
            <br />
            ACCOUNT
          </h1>

          <p>
            Create your account to manage orders,
            wishlist and personal details.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 14px",
              border: "1px solid #e0b4b4",
              background: "#fff7f7",
              color: "#a33a3a",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* FORM */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* NAME */}

          <div className="form-row">

            <div className="form-field">

              <label htmlFor="firstName">
                FIRST NAME
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="FIRST NAME"
                autoComplete="given-name"
                required
                disabled={loading}
              />

            </div>

            <div className="form-field">

              <label htmlFor="lastName">
                LAST NAME
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="LAST NAME"
                autoComplete="family-name"
                required
                disabled={loading}
              />

            </div>

          </div>

          {/* EMAIL */}

          <div className="form-field">

            <label htmlFor="register-email">
              EMAIL ADDRESS
            </label>

            <input
              id="register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ENTER YOUR EMAIL"
              autoComplete="email"
              required
              disabled={loading}
            />

          </div>

          {/* PASSWORD */}

          <div className="form-field">

            <div className="password-label">

              <label htmlFor="register-password">
                PASSWORD
              </label>

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                disabled={loading}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>

            </div>

            <input
              id="register-password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={formData.password}
              onChange={handleChange}
              placeholder="CREATE PASSWORD"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={loading}
            />

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="form-field">

            <label htmlFor="confirmPassword">
              CONFIRM PASSWORD
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="CONFIRM PASSWORD"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={loading}
            />

          </div>

          {/* TERMS */}

          <label className="terms-checkbox">

            <input
              type="checkbox"
              required
              disabled={loading}
            />

            <span>
              I AGREE TO THE TERMS AND PRIVACY POLICY.
            </span>

          </label>

          {/* SUBMIT */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "CREATING ACCOUNT..."
              : "CREATE ACCOUNT →"}
          </button>

        </form>

        {/* LOGIN */}

        <div className="auth-switch">

          <p>
            ALREADY HAVE AN ACCOUNT?
          </p>

          <Link to="/login">
            LOGIN →
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Register;