import express from "express";

import {
    getNewsletterSubscribers,
    subscribeToNewsletter,
    updateNewsletterSubscriber,
    deleteNewsletterSubscriber,
} from "../controllers/newsletter.controller.js";

import {
    authenticate,
    requireAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();


// ======================================================
// PUBLIC
// ======================================================

router.post(
    "/subscribe",
    subscribeToNewsletter
);


// ======================================================
// ADMIN
// ======================================================

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    getNewsletterSubscribers
);

router.patch(
    "/admin/:id",
    authenticate,
    requireAdmin,
    updateNewsletterSubscriber
);

router.delete(
    "/admin/:id",
    authenticate,
    requireAdmin,
    deleteNewsletterSubscriber
);


export default router;