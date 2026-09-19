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


/*
|--------------------------------------------------------------------------
| ADMIN CUSTOMER DETAILS
|--------------------------------------------------------------------------
| GET /api/admin/customers/:id
*/

router.get(
    "/customers/:id",
    authenticate,
    requireAdmin,
    getAdminCustomerDetails
);


export default router;