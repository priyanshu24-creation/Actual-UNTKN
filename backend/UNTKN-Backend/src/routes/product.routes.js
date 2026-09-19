import express from "express";

import {
    getProducts,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/product.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getProducts);

router.get("/:slug", getProductBySlug);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createProduct
);

router.put(
    "/:id",
    authenticate,
    requireAdmin,
    updateProduct
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteProduct
);

export default router;