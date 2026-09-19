import express from "express";

import {
    getAddresses,
    getDefaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from "../controllers/address.controller.js";

import {
    authenticate
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Get all addresses
router.get(
    "/",
    getAddresses
);

// Get default address
router.get(
    "/default",
    getDefaultAddress
);

// Create address
router.post(
    "/",
    createAddress
);

// Update address
router.put(
    "/:id",
    updateAddress
);

// Delete address
router.delete(
    "/:id",
    deleteAddress
);

// Set default address
router.patch(
    "/:id/default",
    setDefaultAddress
);

export default router;