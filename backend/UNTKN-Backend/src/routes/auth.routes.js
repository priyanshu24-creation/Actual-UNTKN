import express from "express";

import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    createAdmin,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";

import {
    authenticate
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/register",
    register
);

router.post(
    "/login",
    login
);

router.post(
    "/logout",
    logout
);

router.get(
    "/me",
    authenticate,
    getMe
);

router.patch(
    "/profile",
    authenticate,
    updateProfile
);

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/reset-password",
    resetPassword
);

router.post(
    "/create-admin",
    createAdmin
);

export default router;