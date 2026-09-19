import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        navigate("/account");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-container">

        {/* HEADER */}

        <div className="auth-header">

          <p className="eyebrow">
            WELCOME BACK
          </p>

          <h1>
            LOGIN
          </h1>

          <p>
            Sign in to access your account,
            orders and wishlist.
          </p>

        </div>


        {/* FORM */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="auth-error">
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
                  setShowPassword(!showPassword)
                }
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
            {loading ? "LOGGING IN..." : "LOGIN →"}
          </button>

        </form>


        {/* REGISTER */}

        <div className="auth-switch">

          <p>
            DON'T HAVE AN ACCOUNT?
          </p>

          <Link to="/register">
            CREATE ACCOUNT →
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;