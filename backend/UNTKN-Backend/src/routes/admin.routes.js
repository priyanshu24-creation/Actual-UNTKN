import express from "express";

import {
    getAdminDashboard,
    getAdminCustomers,
    getAdminCustomerDetails,
    updateAdminCustomerStatus,
    deleteAdminCustomer
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

router.patch(
    "/customers/:id/status",
    authenticate,
    requireAdmin,
    updateAdminCustomerStatus
);

router.delete(
    "/customers/:id",
    authenticate,
    requireAdmin,
    deleteAdminCustomer
);

export default router;