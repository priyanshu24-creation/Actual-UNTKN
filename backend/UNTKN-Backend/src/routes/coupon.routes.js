import express from "express";

import {
    getAdminCoupons,
    getActiveCoupons,
    getPublicCoupons,
    createCoupon,
    updateCoupon,
    toggleCoupon,
    deleteCoupon,
    validateCustomerCoupon
} from "../controllers/coupon.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/active",
    getActiveCoupons
);

router.get(
    "/public",
    getPublicCoupons
);

router.post(
    "/validate",
    authenticate,
    validateCustomerCoupon
);

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getAdminCoupons
);

router.post(
    "/admin",
    authenticate,
    requireAdmin,
    createCoupon
);

router.put(
    "/admin/:id",
    authenticate,
    requireAdmin,
    updateCoupon
);

router.patch(
    "/admin/:id/toggle",
    authenticate,
    requireAdmin,
    toggleCoupon
);

router.delete(
    "/admin/:id",
    authenticate,
    requireAdmin,
    deleteCoupon
);

export default router;
