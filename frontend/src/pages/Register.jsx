import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      alert("Passwords do not match.");
      return;
    }

    /*
      FRONTEND ONLY

      Your friend will connect the registration
      API here later.
    */

    console.log("Register form:", formData);

    alert(
      "Registration API will be connected later."
    );

    navigate("/account");
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
              >
                {showPassword
                  ? "HIDE"
                  : "SHOW"}
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
            />

          </div>


          {/* TERMS */}

          <label className="terms-checkbox">

            <input
              type="checkbox"
              required
            />

            <span>
              I AGREE TO THE TERMS AND PRIVACY POLICY.
            </span>

          </label>


          {/* SUBMIT */}

          <button
            type="submit"
            className="auth-submit"
          >
            CREATE ACCOUNT →
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