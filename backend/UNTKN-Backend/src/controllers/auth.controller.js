import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import generateToken from "../utils/generateToken.js";

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