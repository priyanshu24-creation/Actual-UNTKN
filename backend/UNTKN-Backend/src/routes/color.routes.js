import express from "express";

import {
    getColors,
    createColor,
    updateColor,
    deleteColor
} from "../controllers/color.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getColors);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createColor
);

router.put(
    "/:id",
    authenticate,
    requireAdmin,
    updateColor
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteColor
);

export default router;