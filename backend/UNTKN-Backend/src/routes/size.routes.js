import express from "express";

import {
    getSizes,
    createSize,
    updateSize,
    deleteSize
} from "../controllers/size.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getSizes);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createSize
);

router.put(
    "/:id",
    authenticate,
    requireAdmin,
    updateSize
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteSize
);

export default router;