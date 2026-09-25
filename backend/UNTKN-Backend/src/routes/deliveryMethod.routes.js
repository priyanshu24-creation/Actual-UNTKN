import express from "express";

import pool from "../config/database.js";

import {
    authenticate,
    requireAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

const noCache = (res) => {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
};

const normalizeId = (id) => {
    const value = String(id ?? "")
        .trim()
        .toLowerCase();

    if (value === "1") {
        return "standard";
    }

    if (value === "2") {
        return "express";
    }

    return value;
};

const toBoolean = (value) => {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
};

const normalizeRow = (row) => ({
    id: String(row.id),
    name: row.name,
    description: row.description || "",
    price: Number(row.price || 0),
    isActive: toBoolean(row.is_active)
});

/*
|--------------------------------------------------------------------------
| CUSTOMER
|--------------------------------------------------------------------------
| GET /api/delivery-methods
|
| Only active delivery methods are returned.
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
    try {
        noCache(res);

        const [rows] = await pool.execute(`
            SELECT
                id,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            WHERE is_active = 1
            ORDER BY
                CASE
                    WHEN id = 'standard' THEN 1
                    WHEN id = 'express' THEN 2
                    ELSE 3
                END,
                id ASC
        `);

        return res.status(200).json({
            success: true,
            deliveryMethods: rows.map(normalizeRow)
        });
    } catch (error) {
        console.error(
            "GET /api/delivery-methods error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load delivery methods"
        });
    }
});

/*
|--------------------------------------------------------------------------
| ADMIN - LOAD ALL METHODS
|--------------------------------------------------------------------------
| GET /api/delivery-methods/admin
|--------------------------------------------------------------------------
*/
router.get(
    "/admin",
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            noCache(res);

            const [rows] = await pool.execute(`
                SELECT
                    id,
                    name,
                    description,
                    price,
                    is_active
                FROM delivery_methods
                ORDER BY
                CASE
                    WHEN id = 'standard' THEN 1
                    WHEN id = 'express' THEN 2
                    ELSE 3
                END,
                id ASC
            `);

            return res.status(200).json({
                success: true,
                deliveryMethods: rows.map(
                    normalizeRow
                )
            });
        } catch (error) {
            console.error(
                "GET admin delivery methods error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load delivery settings"
            });
        }
    }
);

/*
|--------------------------------------------------------------------------
| ADMIN - TOGGLE ONE METHOD IMMEDIATELY
|--------------------------------------------------------------------------
| PATCH /api/delivery-methods/admin/:id
|
| This is the important connection between Admin and Checkout.
|--------------------------------------------------------------------------
*/
router.patch(
    "/admin/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            noCache(res);

            const id = normalizeId(
                req.params.id
            );

            if (
                id !== "standard" &&
                id !== "express"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid delivery method"
                });
            }

            if (
                !Object.prototype.hasOwnProperty.call(
                    req.body || {},
                    "isActive"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "isActive is required"
                });
            }

            const isActive =
                req.body.isActive === true ||
                req.body.isActive === 1 ||
                req.body.isActive === "1" ||
                req.body.isActive === "true";

            const [result] =
                await pool.execute(
                    `
                    UPDATE delivery_methods
                    SET
                        is_active = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    `,
                    [
                        isActive ? 1 : 0,
                        id
                    ]
                );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Delivery method not found"
                });
            }

            const [rows] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        name,
                        description,
                        price,
                        is_active
                    FROM delivery_methods
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [id]
                );

            return res.status(200).json({
                success: true,
                message:
                    "Delivery availability updated",
                deliveryMethod:
                    normalizeRow(rows[0])
            });
        } catch (error) {
            console.error(
                "PATCH delivery method error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update delivery availability"
            });
        }
    }
);

/*
|--------------------------------------------------------------------------
| ADMIN - SAVE ALL SETTINGS
|--------------------------------------------------------------------------
| PUT /api/delivery-methods/admin
|
| Used for delivery fees and also safely persists availability.
|--------------------------------------------------------------------------
*/
router.put(
    "/admin",
    authenticate,
    requireAdmin,
    async (req, res) => {
        const connection =
            await pool.getConnection();

        try {
            noCache(res);

            const methods =
                req.body?.deliveryMethods;

            if (!Array.isArray(methods)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "deliveryMethods must be an array"
                });
            }

            await connection.beginTransaction();

            for (const method of methods) {
                const id = normalizeId(
                    method?.id
                );

                if (
                    id !== "standard" &&
                    id !== "express"
                ) {
                    throw new Error(
                        `Invalid delivery method: ${method?.id}`
                    );
                }

                const price = Number(
                    method?.price ?? 0
                );

                if (
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    throw new Error(
                        `Invalid price for ${id}`
                    );
                }

                let isActive = false;

                if (
                    Object.prototype.hasOwnProperty.call(
                        method,
                        "isActive"
                    )
                ) {
                    isActive =
                        method.isActive === true ||
                        method.isActive === 1 ||
                        method.isActive === "1" ||
                        method.isActive === "true";
                } else if (
                    Object.prototype.hasOwnProperty.call(
                        method,
                        "enabled"
                    )
                ) {
                    isActive =
                        method.enabled === true ||
                        method.enabled === 1 ||
                        method.enabled === "1" ||
                        method.enabled === "true";
                }

                const [result] =
                    await connection.execute(
                        `
                        UPDATE delivery_methods
                        SET
                            price = ?,
                            is_active = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        `,
                        [
                            Number(
                                price.toFixed(2)
                            ),
                            isActive ? 1 : 0,
                            id
                        ]
                    );

                if (result.affectedRows === 0) {
                    throw new Error(
                        `Delivery method not found: ${id}`
                    );
                }
            }

            await connection.commit();

            const [rows] =
                await connection.execute(`
                    SELECT
                        id,
                        name,
                        description,
                        price,
                        is_active
                    FROM delivery_methods
                    ORDER BY
                CASE
                    WHEN id = 'standard' THEN 1
                    WHEN id = 'express' THEN 2
                    ELSE 3
                END,
                id ASC
                `);

            return res.status(200).json({
                success: true,
                message:
                    "Delivery settings saved successfully",
                deliveryMethods:
                    rows.map(normalizeRow)
            });
        } catch (error) {
            await connection.rollback();

            console.error(
                "PUT delivery methods error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to save delivery settings"
            });
        } finally {
            connection.release();
        }
    }
);

export default router;