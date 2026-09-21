import express from "express";
import {
    getProductReviews,
    createProductReview
} from "../controllers/review.controller.js";

const router = express.Router();

router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", createProductReview);

export default router;
