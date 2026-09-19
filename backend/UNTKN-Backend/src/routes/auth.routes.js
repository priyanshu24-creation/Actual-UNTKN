import express from "express";

import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    createAdmin
} from "../controllers/auth.controller.js";

import {
    authenticate
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Register
router.post(
    "/register",
    register
);

// Login
router.post(
    "/login",
    login
);

// Logout
router.post(
    "/logout",
    logout
);

// Get current logged-in user
router.get(
    "/me",
    authenticate,
    getMe
);

// Update current user's profile
router.patch(
    "/profile",
    authenticate,
    updateProfile
);

// Create admin account
router.post(
    "/create-admin",
    createAdmin
);

export default router;