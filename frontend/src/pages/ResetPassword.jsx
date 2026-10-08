import { useMemo, useState } from "react";
import {
    Link,
    useNavigate,
    useSearchParams
} from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = useMemo(
        () => searchParams.get("token") || "",
        [searchParams]
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-container">

                    <div className="auth-header">
                        <p className="eyebrow">
                            ACCOUNT RECOVERY
                        </p>

                        <h1>
                            INVALID LINK
                        </h1>

                        <p>
                            This password reset link
                            is missing or invalid.
                        </p>
                    </div>

                    <div className="auth-switch">
                        <Link to="/forgot-password">
                            REQUEST A NEW LINK →
                        </Link>
                    </div>

                </div>
            </div>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError("");

        if (password.length < 6) {
            setError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                "/auth/reset-password",
                {
                    token,
                    password
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to reset password."
                );
            }

            navigate("/login", {
                replace: true,
                state: {
                    message:
                        "Password reset successfully. Please log in with your new password."
                }
            });
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">

                <div className="auth-header">
                    <p className="eyebrow">
                        ACCOUNT RECOVERY
                    </p>

                    <h1>
                        NEW PASSWORD
                    </h1>

                    <p>
                        Create a new password for
                        your UNTKN account.
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
                        <div className="password-label">
                            <label htmlFor="password">
                                NEW PASSWORD
                            </label>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (current) =>
                                            !current
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
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="ENTER NEW PASSWORD"
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-field">
                        <div className="password-label">
                            <label htmlFor="confirmPassword">
                                CONFIRM PASSWORD
                            </label>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (current) =>
                                            !current
                                    )
                                }
                                disabled={loading}
                            >
                                {showConfirmPassword
                                    ? "HIDE"
                                    : "SHOW"}
                            </button>
                        </div>

                        <input
                            id="confirmPassword"
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            placeholder="CONFIRM NEW PASSWORD"
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "RESETTING..."
                            : "RESET PASSWORD →"}
                    </button>
                </form>

                <div className="auth-switch">
                    <Link to="/login">
                        BACK TO LOGIN →
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default ResetPassword;