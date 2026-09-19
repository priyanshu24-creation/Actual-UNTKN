import express from "express";

import {
    getCollections,
    getCollectionBySlug,
    createCollection,
    updateCollection,
    deleteCollection
} from "../controllers/collection.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getCollections);

router.get("/:slug", getCollectionBySlug);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createCollection
);

router.put(
    "/:id",
    authenticate,
    requireAdmin,
    updateCollection
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteCollection
);

export default router;