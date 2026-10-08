import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../config/database.js";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../services/email.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
};

const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
    if (!phone) return true;
    return /^[0-9]{10,15}$/.test(phone);
};

export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const cleanName = String(name).trim();

        const normalizedEmail =
            String(email).trim().toLowerCase();

        const cleanPhone = phone
            ? String(phone).trim()
            : null;

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters"
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must not exceed 100 characters"
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (normalizedEmail.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Email address is too long"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Password must not exceed 128 characters"
            });
        }

        if (!isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain 10 to 15 digits"
            });
        }

        const [existingUsers] = await pool.execute(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            12
        );

        const [result] = await pool.execute(
            `
            INSERT INTO users
                (name, email, password_hash, phone)
            VALUES (?, ?, ?, ?)
            `,
            [
                cleanName,
                normalizedEmail,
                passwordHash,
                cleanPhone
            ]
        );

        const user = {
            id: result.insertId,
            name: cleanName,
            email: normalizedEmail,
            phone: cleanPhone,
            role: "customer"
        };

        const token = generateToken(user);

        res.cookie(
            "token",
            token,
            cookieOptions
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user
        });

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

export const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        const [users] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                password_hash,
                phone,
                role,
                is_active
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        const token = generateToken(
            safeUser
        );

        res.cookie(
            "token",
            token,
            cookieOptions
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: safeUser
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie(
        "token",
        clearCookieOptions
    );

    return res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

export const getMe = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                phone,
                role,
                is_active,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = users[0];

        if (!user.is_active) {
            res.clearCookie(
                "token",
                clearCookieOptions
            );

            return res.status(403).json({
                success: false,
                message: "Account is inactive"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get me error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const {
            name,
            email,
            phone
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const cleanName =
            String(name).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanPhone = phone
            ? String(phone).trim()
            : null;

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters"
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must not exceed 100 characters"
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (normalizedEmail.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Email address is too long"
            });
        }

        if (!isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain 10 to 15 digits"
            });
        }

        const [existingUsers] = await pool.execute(
            `
            SELECT id
            FROM users
            WHERE email = ?
              AND id != ?
            LIMIT 1
            `,
            [
                normalizedEmail,
                req.user.id
            ]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered by another user"
            });
        }

        await pool.execute(
            `
            UPDATE users
            SET
                name = ?,
                email = ?,
                phone = ?
            WHERE id = ?
            `,
            [
                cleanName,
                normalizedEmail,
                cleanPhone,
                req.user.id
            ]
        );

        const [users] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                phone,
                role,
                is_active,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = users[0];

        const tokenUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        const token = generateToken(
            tokenUser
        );

        res.cookie(
            "token",
            token,
            cookieOptions
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        console.error(
            "Update profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};


export const forgotPassword = async (req, res) => {
    try {
        const normalizedEmail = String(
            req.body?.email || ""
        )
            .trim()
            .toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        const genericMessage =
            "If an account exists with this email, a password reset link has been sent.";

        const [users] = await pool.execute(
            `
                SELECT
                    id,
                    name,
                    email,
                    is_active
                FROM users
                WHERE email = ?
                LIMIT 1
            `,
            [normalizedEmail]
        );

        if (
            users.length === 0 ||
            !users[0].is_active
        ) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        const user = users[0];

        await pool.execute(
            `
                DELETE FROM password_reset_tokens
                WHERE user_id = ?
            `,
            [user.id]
        );

        const rawToken =
            crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + 30 * 60 * 1000
        );

        await pool.execute(
            `
                INSERT INTO password_reset_tokens
                    (
                        user_id,
                        token_hash,
                        expires_at
                    )
                VALUES (?, ?, ?)
            `,
            [
                user.id,
                tokenHash,
                expiresAt
            ]
        );

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "https://untkn.in";

        const resetUrl =
            `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

        const customerName =
            String(user.name || "Customer")
                .trim();

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your UNTKN Password</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
">

<div style="
    max-width:620px;
    margin:40px auto;
    background:#ffffff;
    padding:40px;
">

    <p style="
        margin:0 0 14px;
        font-size:10px;
        font-weight:700;
        letter-spacing:2px;
        color:#777;
    ">
        UNTKN ACCOUNT
    </p>

    <h1 style="
        margin:0;
        font-size:42px;
        line-height:1;
        letter-spacing:-2px;
        color:#111;
    ">
        RESET PASSWORD
    </h1>

    <p style="
        margin:28px 0 0;
        font-size:15px;
        line-height:1.7;
        color:#444;
    ">
        Hello ${customerName},
    </p>

    <p style="
        margin:12px 0 0;
        font-size:15px;
        line-height:1.7;
        color:#444;
    ">
        We received a request to reset your UNTKN
        account password.
    </p>

    <div style="
        margin:30px 0;
        text-align:center;
    ">
        <a
            href="${resetUrl}"
            style="
                display:inline-block;
                padding:16px 28px;
                background:#111111;
                color:#ffffff;
                text-decoration:none;
                font-size:11px;
                font-weight:700;
                letter-spacing:1px;
            "
        >
            RESET PASSWORD →
        </a>
    </div>

    <p style="
        margin:0;
        font-size:13px;
        line-height:1.7;
        color:#777;
    ">
        This password reset link will expire in
        30 minutes.
    </p>

    <p style="
        margin:18px 0 0;
        font-size:13px;
        line-height:1.7;
        color:#777;
    ">
        If you did not request a password reset,
        you can safely ignore this email.
    </p>

    <div style="
        margin-top:35px;
        padding-top:20px;
        border-top:1px solid #eeeeee;
    ">
        <p style="
            margin:0;
            font-size:11px;
            color:#999;
        ">
            UNTKN
        </p>
    </div>

</div>

</body>
</html>
        `.trim();

        const text = `
Hello ${customerName},

We received a request to reset your UNTKN account password.

Reset your password using this link:

${resetUrl}

This link will expire in 30 minutes.

If you did not request this password reset, you can safely ignore this email.

UNTKN
        `.trim();

        try {
            await sendEmail({
                to: user.email,
                subject: "Reset your UNTKN password",
                text,
                html
            });
        } catch (emailError) {
            console.error(
                "Password reset email error:",
                emailError
            );

            await pool.execute(
                `
                    DELETE FROM password_reset_tokens
                    WHERE token_hash = ?
                `,
                [tokenHash]
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send password reset email. Please try again later."
            });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage
        });

    } catch (error) {
        console.error(
            "Forgot password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process password reset request"
        });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const token = String(
            req.body?.token || ""
        ).trim();

        const newPassword = String(
            req.body?.password || ""
        );

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Password reset token is required"
            });
        }

        if (
            newPassword.length < 6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters"
            });
        }

        if (
            newPassword.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must not exceed 128 characters"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const [tokens] = await pool.execute(
            `
                SELECT
                    id,
                    user_id,
                    expires_at,
                    used_at
                FROM password_reset_tokens
                WHERE token_hash = ?
                LIMIT 1
            `,
            [tokenHash]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This password reset link is invalid or has expired."
            });
        }

        const resetRecord = tokens[0];

        if (resetRecord.used_at) {
            return res.status(400).json({
                success: false,
                message:
                    "This password reset link has already been used."
            });
        }

        if (
            new Date(resetRecord.expires_at)
                .getTime() <= Date.now()
        ) {
            await pool.execute(
                `
                    DELETE FROM password_reset_tokens
                    WHERE id = ?
                `,
                [resetRecord.id]
            );

            return res.status(400).json({
                success: false,
                message:
                    "This password reset link has expired."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                newPassword,
                12
            );

        await pool.execute(
            `
                UPDATE users
                SET password_hash = ?
                WHERE id = ?
            `,
            [
                passwordHash,
                resetRecord.user_id
            ]
        );

        await pool.execute(
            `
                UPDATE password_reset_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
            [resetRecord.id]
        );

        await pool.execute(
            `
                DELETE FROM password_reset_tokens
                WHERE user_id = ?
                  AND id != ?
            `,
            [
                resetRecord.user_id,
                resetRecord.id
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully. You can now log in."
        });

    } catch (error) {
        console.error(
            "Reset password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset password"
        });
    }
};


export const createAdmin = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            setupKey
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !setupKey
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and setup key are required"
            });
        }

        if (!process.env.ADMIN_SETUP_KEY) {
            console.error(
                "ADMIN_SETUP_KEY is not configured"
            );

            return res.status(500).json({
                success: false,
                message: "Admin setup is not configured"
            });
        }

        if (
            setupKey !==
            process.env.ADMIN_SETUP_KEY
        ) {
            return res.status(403).json({
                success: false,
                message: "Invalid admin setup key"
            });
        }

        const cleanName =
            String(name).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanPhone = phone
            ? String(phone).trim()
            : null;

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters"
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must not exceed 100 characters"
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Password must not exceed 128 characters"
            });
        }

        if (!isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain 10 to 15 digits"
            });
        }

        const [existingUsers] = await pool.execute(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        const [result] = await pool.execute(
            `
            INSERT INTO users
                (name, email, password_hash, phone, role)
            VALUES (?, ?, ?, ?, 'admin')
            `,
            [
                cleanName,
                normalizedEmail,
                passwordHash,
                cleanPhone
            ]
        );

        const admin = {
            id: result.insertId,
            name: cleanName,
            email: normalizedEmail,
            phone: cleanPhone,
            role: "admin"
        };

        const token =
            generateToken(admin);

        res.cookie(
            "token",
            token,
            cookieOptions
        );

        return res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            user: admin
        });

    } catch (error) {
        console.error(
            "Create admin error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create admin"
        });
    }
};