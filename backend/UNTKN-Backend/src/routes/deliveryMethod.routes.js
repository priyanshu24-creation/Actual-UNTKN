import express from "express";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

import {
    getDeliveryMethods,
    getAllDeliveryMethods,
    updateDeliveryMethods
} from "../models/deliveryMethod.model.js";

const router = express.Router();

const sendServerError = (
    res,
    error,
    message
) => {
    console.error(message, error);

    return res.status(500).json({
        success: false,
        message,
        error:
            process.env.NODE_ENV === "development"
                ? error.message
                : undefined
    });
};

router.get(
    "/",
    async (req, res) => {
        try {
            const deliveryMethods =
                await getDeliveryMethods();

            return res.status(200).json({
                success: true,
                deliveryMethods
            });
        } catch (error) {
            return sendServerError(
                res,
                error,
                "Failed to load delivery methods"
            );
        }
    }
);

router.get(
    "/admin",
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            const deliveryMethods =
                await getAllDeliveryMethods();

            return res.status(200).json({
                success: true,
                deliveryMethods
            });
        } catch (error) {
            return sendServerError(
                res,
                error,
                "Failed to load admin delivery settings"
            );
        }
    }
);

router.put(
    "/admin",
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                deliveryMethods
            } = req.body;

            const updatedMethods =
                await updateDeliveryMethods(
                    deliveryMethods
                );

            return res.status(200).json({
                success: true,
                message:
                    "Delivery settings saved successfully",
                deliveryMethods:
                    updatedMethods
            });
        } catch (error) {
            console.error(
                "Update delivery settings error:",
                error
            );

            if (
                error.message ===
                "deliveryMethods must be an array"
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (
                error.message ===
                "At least one delivery method is required"
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (
                error.message?.startsWith(
                    "Every delivery method"
                ) ||
                error.message?.startsWith(
                    "Invalid delivery price"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return sendServerError(
                res,
                error,
                "Failed to save delivery settings"
            );
        }
    }
);

export default router;