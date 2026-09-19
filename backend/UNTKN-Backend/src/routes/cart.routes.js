import express from "express";

import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from "../controllers/cart.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authenticate,
    getCart
);

router.post(
    "/items",
    authenticate,
    addToCart
);

router.put(
    "/items/:itemId",
    authenticate,
    updateCartItem
);

router.delete(
    "/items/:itemId",
    authenticate,
    removeFromCart
);

router.delete(
    "/",
    authenticate,
    clearCart
);

export default router;