import express from "express";

import {
    getCollections,
    getCollectionBySlug,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection
} from "../controllers/collection.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.get(
    "/",
    getCollections
);

router.get(
    "/slug/:slug",
    getCollectionBySlug
);

router.get(
    "/:id",
    getCollection
);

router.post(
    "/",
    authenticate,
    requireAdmin,
    upload.single("image"),
    createCollection
);

router.put(
    "/:id",
    authenticate,
    requireAdmin,
    upload.single("image"),
    updateCollection
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteCollection
);

export default router;