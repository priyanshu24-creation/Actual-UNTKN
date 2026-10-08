import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await api.post(
                "/auth/forgot-password",
                {
                    email: email.trim().toLowerCase()
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to process request."
                );
            }

            setMessage(
                "If an account exists with this email, a password reset link has been sent. Please check your inbox."
            );

            setEmail("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Unable to send password reset email."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page recovery-page">
            <div className="auth-container recovery-container">

                <div className="auth-header recovery-header">
                    <p className="eyebrow">
                        ACCOUNT RECOVERY
                    </p>

                    <h1 className="recovery-title">
                        FORGOT PASSWORD?
                    </h1>

                    <p className="recovery-description">
                        Enter the email address associated with
                        your UNTKN account and we'll send you
                        a secure password reset link.
                    </p>
                </div>

                <form
                    className="auth-form recovery-form"
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

                    {message && (
                        <div
                            className="auth-success"
                            role="status"
                        >
                            {message}
                        </div>
                    )}

                    <div className="form-field">
                        <label htmlFor="email">
                            EMAIL ADDRESS
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="ENTER YOUR EMAIL"
                            autoComplete="email"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-submit recovery-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "SENDING..."
                            : "SEND RESET LINK →"}
                    </button>
                </form>

                <div className="auth-switch recovery-switch">
                    <p>
                        REMEMBERED YOUR PASSWORD?
                    </p>

                    <Link to="/login">
                        BACK TO LOGIN →
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default ForgotPassword;