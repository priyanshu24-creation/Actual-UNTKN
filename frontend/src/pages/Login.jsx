import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    typeof location.state?.redirectTo === "string" &&
    location.state.redirectTo.startsWith("/") &&
    !location.state.redirectTo.startsWith("/admin")
      ? location.state.redirectTo
      : "/account";

  const buyNow =
    location.state?.buyNow === true;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

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

    const email =
      formData.email.trim().toLowerCase();

    if (!email || !formData.password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password: formData.password,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Login failed."
        );
      }

      const authResponse =
        await api.get("/auth/me", {
          validateStatus: (status) =>
            status >= 200 && status < 500,
        });

      const authenticated =
        authResponse.status >= 200 &&
        authResponse.status < 300 &&
        authResponse.data?.success === true &&
        !!authResponse.data?.user;

      if (!authenticated) {
        throw new Error(
          "Login succeeded, but your session could not be verified. Please try again."
        );
      }

      const authenticatedUser =
        authResponse.data.user;

      const userRole = String(
        authenticatedUser?.role || ""
      )
        .trim()
        .toLowerCase();

      if (userRole === "admin") {
        navigate("/admin", {
          replace: true,
        });
        return;
      }

      navigate(redirectTo, {
        replace: true,
      });
    } catch (requestError) {
      console.error(
        "Login error:",
        requestError
      );

      if (
        requestError.response?.status === 401
      ) {
        setError(
          requestError.response?.data?.message ||
            "Invalid email or password."
        );
      } else {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <p className="eyebrow">
            {buyNow
              ? "ACCOUNT REQUIRED"
              : "WELCOME BACK"}
          </p>

          <h1>LOGIN</h1>

          <p>
            {buyNow
              ? "Please sign in to continue with your purchase."
              : "Sign in to access your account, orders and wishlist."}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              className="auth-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">
              EMAIL ADDRESS
            </label>

            <input
              id="email"
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
              <label htmlFor="password">
                PASSWORD
              </label>

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
              >
                {showPassword
                  ? "HIDE"
                  : "SHOW"}
              </button>
            </div>

            <input
              id="password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={formData.password}
              onChange={handleChange}
              placeholder="ENTER YOUR PASSWORD"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">
              FORGOT PASSWORD?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "LOGGING IN..."
              : "LOGIN →"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            DON'T HAVE AN ACCOUNT?
          </p>

          <Link
            to="/register"
            state={{
              redirectTo,
              buyNow,
            }}
          >
            CREATE ACCOUNT →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;