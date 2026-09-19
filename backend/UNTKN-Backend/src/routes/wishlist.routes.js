import express from "express";

import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    getAdminWishlist,
    adminRemoveFromWishlist
} from "../controllers/wishlist.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();


// ======================================================
// CUSTOMER WISHLIST
// ======================================================

router.get(
    "/",
    authenticate,
    getWishlist
);

router.post(
    "/items",
    authenticate,
    addToWishlist
);

router.delete(
    "/items/:itemId",
    authenticate,
    removeFromWishlist
);

router.delete(
    "/",
    authenticate,
    clearWishlist
);


// ======================================================
// ADMIN WISHLIST
// ======================================================

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getAdminWishlist
);

router.delete(
    "/admin/items/:itemId",
    authenticate,
    requireAdmin,
    adminRemoveFromWishlist
);


export default router;