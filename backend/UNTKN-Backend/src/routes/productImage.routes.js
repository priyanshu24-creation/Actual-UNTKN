import express from "express";

import {
    getProductImages,
    uploadProductImage,
    deleteProductImage
} from "../controllers/productImage.controller.js";

import upload from "../middleware/upload.middleware.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();


// ==========================================
// GET PRODUCT IMAGES
// PUBLIC
// ==========================================

router.get(
    "/:productId/images",
    getProductImages
);


// ==========================================
// UPLOAD PRODUCT IMAGE
// ADMIN ONLY
// ==========================================

router.post(
    "/:productId/images",
    authenticate,
    requireAdmin,
    upload.single("image"),
    uploadProductImage
);


// ==========================================
// DELETE PRODUCT IMAGE
// ADMIN ONLY
// ==========================================

router.delete(
    "/:productId/images/:imageId",
    authenticate,
    requireAdmin,
    deleteProductImage
);


export default router;