import express from "express";

import {
    createInquiry,
    getAdminInquiries,
    getAdminInquiryById,
    updateAdminInquiry,
    deleteAdminInquiry,
} from "../controllers/inquiry.controller.js";

import {
    authenticate,
    requireAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/*
 * Customer
 */
router.post("/", createInquiry);

/*
 * Admin
 */
router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getAdminInquiries
);

router.get(
    "/admin/:id",
    authenticate,
    requireAdmin,
    getAdminInquiryById
);

router.patch(
    "/admin/:id",
    authenticate,
    requireAdmin,
    updateAdminInquiry
);

router.delete(
    "/admin/:id",
    authenticate,
    requireAdmin,
    deleteAdminInquiry
);

export default router;