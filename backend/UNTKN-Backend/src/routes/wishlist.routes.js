import express from "express";

import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
} from "../controllers/wishlist.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

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

export default router;
