import express from "express";

import {
    getAdminDashboard,
    getAdminCustomers
} from "../controllers/admin.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
| GET /api/admin/dashboard
*/

router.get(
    "/dashboard",
    authenticate,
    requireAdmin,
    getAdminDashboard
);


/*
|--------------------------------------------------------------------------
| ADMIN CUSTOMERS
|--------------------------------------------------------------------------
| GET /api/admin/customers
*/

router.get(
    "/customers",
    authenticate,
    requireAdmin,
    getAdminCustomers
);


export default router;