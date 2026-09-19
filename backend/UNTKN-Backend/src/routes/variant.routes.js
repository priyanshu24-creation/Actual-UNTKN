import express from "express";

import {
    getProductVariants,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
} from "../controllers/variant.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/products/:productId/variants",
    getProductVariants
);

router.post(
    "/products/:productId/variants",
    authenticate,
    requireAdmin,
    createProductVariant
);

router.put(
    "/products/:productId/variants/:variantId",
    authenticate,
    requireAdmin,
    updateProductVariant
);

router.delete(
    "/products/:productId/variants/:variantId",
    authenticate,
    requireAdmin,
    deleteProductVariant
);

export default router;