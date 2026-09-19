import express from "express";

import {
    createPaymentOrder,
    verifyPayment,
    getPaymentByOrder
} from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-order", authenticate, createPaymentOrder);

router.post("/verify", authenticate, verifyPayment);

router.get("/order/:orderId", authenticate, getPaymentByOrder);

export default router;