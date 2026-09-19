import express from "express";

import {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
    getAdminOrders,
    getAdminOrderById,
    updateAdminOrderStatus
} from "../controllers/order.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();


// ======================================================
// CUSTOMER ORDER ROUTES
// ======================================================

router.post(
    "/",
    authenticate,
    createOrder
);

router.get(
    "/",
    authenticate,
    getOrders
);


// ======================================================
// ADMIN ORDER ROUTES
// IMPORTANT: These must come BEFORE /:id
// ======================================================

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getAdminOrders
);

router.get(
    "/admin/:id",
    authenticate,
    requireAdmin,
    getAdminOrderById
);

router.patch(
    "/admin/:id/status",
    authenticate,
    requireAdmin,
    updateAdminOrderStatus
);


// ======================================================
// CUSTOMER SINGLE ORDER / CANCEL
// ======================================================

router.get(
    "/:id",
    authenticate,
    getOrderById
);

router.patch(
    "/:id/cancel",
    authenticate,
    cancelOrder
);


export default router;