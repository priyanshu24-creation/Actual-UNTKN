import express from "express";

import {
    getRunningBanner,
    updateRunningBanner
} from "../controllers/runningBanner.controller.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    getRunningBanner
);

router.put(
    "/",
    authenticate,
    requireAdmin,
    updateRunningBanner
);

export default router;