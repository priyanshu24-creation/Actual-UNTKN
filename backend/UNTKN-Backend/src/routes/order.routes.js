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