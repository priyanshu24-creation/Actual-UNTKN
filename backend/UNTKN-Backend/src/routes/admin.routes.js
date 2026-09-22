import express from "express";

import {
    getAdminDashboard,
    getAdminCustomers,
    getAdminCustomerDetails
} from "../controllers/admin.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/dashboard",
    authenticate,
    requireAdmin,
    getAdminDashboard
);

router.get(
    "/customers",
    authenticate,
    requireAdmin,
    getAdminCustomers
);

router.get(
    "/customers/:id",
    authenticate,
    requireAdmin,
    getAdminCustomerDetails
);

export default router;