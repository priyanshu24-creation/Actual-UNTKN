import express from "express";

import {
    getDeliveryMethods,
    getAdminDeliveryMethods,
    updateDeliveryMethods
} from "../controllers/deliveryMethod.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    getDeliveryMethods
);

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getAdminDeliveryMethods
);

router.put(
    "/admin",
    authenticate,
    requireAdmin,
    updateDeliveryMethods
);

export default router;