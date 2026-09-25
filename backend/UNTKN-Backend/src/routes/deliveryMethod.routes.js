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

const toBoolean = (value) => {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
};

const normalizeMethod = (row) => ({
    id: String(row.id),
    name: row.name,
    description: row.description || "",
    price: Number(row.price || 0),
    isActive: toBoolean(row.is_active)
});

/*
    GET CUSTOMER DELIVERY METHODS
*/
router.get("/", async (req, res) => {
    try {
        noCache(res);

        const [rows] = await pool.query(`
            SELECT
                id,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            WHERE is_active = 1
            ORDER BY sort_order ASC, id ASC
        `);

        return res.status(200).json({
            success: true,
            deliveryMethods: rows.map(normalizeMethod)
        });
    } catch (error) {
        console.error(
            "GET delivery methods error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load delivery methods",
            error: error.message
        });
    }
});

/*
    GET ADMIN DELIVERY METHODS
*/
router.get(
    "/admin",
    authenticate,
    requireAdmin,
    async (req, res) => {
        try {
            noCache(res);

            const [rows] = await pool.query(`
                SELECT
                    id,
                    name,
                    description,
                    price,
                    is_active
                FROM delivery_methods
                ORDER BY sort_order ASC, id ASC
            `);

            return res.status(200).json({
                success: true,
                deliveryMethods:
                    rows.map(normalizeMethod)
            });
        } catch (error) {
            console.error(
                "GET admin delivery methods error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load delivery settings",
                error: error.message
            });
        }
    }
);

/*
    SAVE ADMIN DELIVERY METHODS
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

            const deliveryMethods =
                req.body?.deliveryMethods;

            if (!Array.isArray(deliveryMethods)) {
                connection.release();

                return res.status(400).json({
                    success: false,
                    message:
                        "deliveryMethods must be an array"
                });
            }

            await connection.beginTransaction();

            for (const method of deliveryMethods) {
                const rawId =
                    String(method?.id ?? "")
                        .trim()
                        .toLowerCase();

                let id = rawId;

                if (
                    rawId === "1" ||
                    rawId === "standard"
                ) {
                    id = "standard";
                }

                if (
                    rawId === "2" ||
                    rawId === "express"
                ) {
                    id = "express";
                }

                if (
                    id !== "standard" &&
                    id !== "express"
                ) {
                    throw new Error(
                        `Invalid delivery method id: ${method?.id}`
                    );
                }

                const active =
                    method?.isActive === true ||
                    method?.isActive === 1 ||
                    method?.isActive === "1" ||
                    method?.isActive === "true" ||
                    method?.enabled === true ||
                    method?.enabled === 1 ||
                    method?.enabled === "1" ||
                    method?.enabled === "true";

                const price = Number(
                    method?.price ?? 0
                );

                if (
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    throw new Error(
                        `Invalid delivery price for ${id}`
                    );
                }

                /*
                    IMPORTANT:
                    Your real MySQL table uses:
                    id = "standard"
                    id = "express"

                    So update the existing rows directly.
                */
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
                            active ? 1 : 0,
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
                await connection.query(`
                    SELECT
                        id,
                        name,
                        description,
                        price,
                        is_active
                    FROM delivery_methods
                    ORDER BY sort_order ASC, id ASC
                `);

            return res.status(200).json({
                success: true,
                message:
                    "Delivery settings saved successfully",
                deliveryMethods:
                    rows.map(normalizeMethod)
            });

        } catch (error) {
            await connection.rollback();

            console.error(
                "SAVE delivery methods error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to save delivery settings",
                error: error.message
            });
        } finally {
            connection.release();
        }
    }
);

export default router;
