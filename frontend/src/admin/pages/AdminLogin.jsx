import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAdminAuth } from "../context/AdminAuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    loading: authLoading,
  } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    const result = await login(
      email,
      password
    );

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    const destination =
      location.state?.from || "/admin";

    navigate(destination, {
      replace: true,
    });

    setLoading(false);
  };

  const isLoading =
    loading || authLoading;

  return (
    <section className="admin-login-page">

      {/* LEFT SIDE */}

      <div className="admin-login-visual">

        <div className="admin-login-visual-content">

          <p className="admin-login-small-text">
            UNTKN ADMIN
          </p>

          <h1>
            Wear your story.
          </h1>

          <p className="admin-login-tagline">
            MORE THAN JUST A T-SHIRT
          </p>

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="admin-login-form-wrapper">

        <div className="admin-login-form-container">

          <p className="admin-login-eyebrow">
            ACCOUNT
          </p>

          <h2>
            Sign in
          </h2>

          <p className="admin-login-description">
            Sign in to manage your UNTKN store.
          </p>


          <form onSubmit={handleSubmit}>

            {/* EMAIL */}

            <div className="admin-login-field">

              <label htmlFor="admin-email">
                Email Address
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={isLoading}
              />

            </div>


            {/* PASSWORD */}

            <div className="admin-login-field">

              <label htmlFor="admin-password">
                Password
              </label>

              <div className="admin-password-wrapper">

                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* ERROR */}

            {error && (
              <div className="admin-login-error">
                {error}
              </div>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="admin-login-button"
              disabled={isLoading}
            >

              <span>
                {isLoading
                  ? "Signing in..."
                  : "Sign in"}
              </span>

              {!isLoading && (
                <ArrowRight
                  size={18}
                  strokeWidth={1.7}
                />
              )}

            </button>

          </form>


          {/* DEMO CREDENTIALS */}

          <div className="admin-demo-credentials">

            <p>
              ADMIN ACCESS
            </p>

            <span>
              Use your registered admin account
            </span>

          </div>


          <div className="admin-login-footer">

            <span>
              UNTKN
            </span>

            <span>
              ADMIN PANEL
            </span>

          </div>

        </div>

      </div>

    </section>
  );
}

export default AdminLogin;