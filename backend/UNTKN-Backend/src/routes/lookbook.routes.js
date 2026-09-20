import express from "express";

import {
    getLookbookItems,
    getActiveLookbookItems,
    getLookbookItem,
    createLookbookItem,
    updateLookbookItem,
    toggleLookbookStatus,
    deleteLookbookItem
} from "../controllers/lookbook.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.get(
    "/active",
    getActiveLookbookItems
);

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getLookbookItems
);

router.get(
    "/admin/:id",
    authenticate,
    requireAdmin,
    getLookbookItem
);

router.post(
    "/admin",
    authenticate,
    requireAdmin,
    upload.single("image"),
    createLookbookItem
);

router.patch(
    "/admin/:id",
    authenticate,
    requireAdmin,
    upload.single("image"),
    updateLookbookItem
);

router.patch(
    "/admin/:id/toggle",
    authenticate,
    requireAdmin,
    toggleLookbookStatus
);

router.delete(
    "/admin/:id",
    authenticate,
    requireAdmin,
    deleteLookbookItem
);

export default router;