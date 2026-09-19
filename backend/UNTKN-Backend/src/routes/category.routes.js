import express from "express";

import {
    getCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getCategories);

router.get("/:slug", getCategoryBySlug);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createCategory
);

router.put(
    "/:id",
    authenticate,
    requireAdmin,
    updateCategory
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteCategory
);

export default router;