import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api.js";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.redirectTo || "/account";
  const buyNow = location.state?.buyNow === true;

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

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      setError("Please enter your first and last name.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: `${firstName} ${lastName}`.trim(),
        email,
        password: formData.password,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Registration failed."
        );
      }

      try {
        await api.get("/auth/me");

        navigate(redirectTo, {
          replace: true,
        });
      } catch (authError) {
        if (authError.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              redirectTo,
              buyNow,
            },
          });
          return;
        }

        throw authError;
      }
    } catch (requestError) {
      console.error("Registration error:", requestError);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-header">
          <p className="eyebrow">JOIN THE LABEL</p>

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

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName">FIRST NAME</label>

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
              <label htmlFor="lastName">LAST NAME</label>

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

          <div className="form-field">
            <label htmlFor="register-email">EMAIL ADDRESS</label>

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

          <div className="form-field">
            <div className="password-label">
              <label htmlFor="register-password">PASSWORD</label>

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="CREATE PASSWORD"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>

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

        <div className="auth-switch">
          <p>ALREADY HAVE AN ACCOUNT?</p>

          <Link
            to="/login"
            state={{
              redirectTo,
              buyNow,
            }}
          >
            LOGIN →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
