import express from "express";

import {
    getProductImages,
    uploadProductImage
} from "../controllers/productImage.controller.js";

import upload from "../middleware/upload.middleware.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();


// ==========================================
// GET PRODUCT IMAGES
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


export default router;