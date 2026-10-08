import pool from "../config/database.js";

import {
    sendExchangeRequestEmails
} from "../services/exchange.service.js";

const allowedReasons = [
    "Wrong Size",
    "Wrong Product",
    "Damaged Product",
    "Defective Product",
    "Different from Description",
    "Other"
];

export const requestExchange = async (
    req,
    res
) => {
    try {
        const userId =
            req.user?.id;

        const orderId =
            Number(req.params.id);

        const {
            order_item_id,
            reason,
            details,
            requested_size
        } = req.body || {};

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid Order ID"
            });
        }

        const orderItemId =
            Number(order_item_id);

        if (
            !Number.isInteger(orderItemId) ||
            orderItemId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a product"
            });
        }

        if (
            !allowedReasons.includes(reason)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid exchange reason"
            });
        }

        const cleanDetails =
            String(details || "").trim();

        if (cleanDetails.length > 2000) {
            return res.status(400).json({
                success: false,
                message:
                    "Exchange details are too long"
            });
        }

        const cleanRequestedSize =
            String(
                requested_size || ""
            ).trim();

        if (cleanRequestedSize.length > 50) {
            return res.status(400).json({
                success: false,
                message:
                    "Requested size is too long"
            });
        }

        const [
            orders
        ] = await pool.execute(
            `
            SELECT
                id,
                order_number,
                user_id,
                order_status,
                shipping_email
            FROM orders
            WHERE id = ?
            AND user_id = ?
            LIMIT 1
            `,
            [
                orderId,
                userId
            ]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        const order =
            orders[0];

        if (
            String(
                order.order_status || ""
            ).toLowerCase() !==
            "delivered"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Exchange is available only after the order is delivered"
            });
        }

       const [
    items
] = await pool.execute(
    `
        SELECT
            oi.id,
            oi.order_id,
            oi.product_id,
            oi.product_name,
            oi.size_name,
            oi.color_name,
            oi.quantity,
            COALESCE(p.no_return_policy, 0) AS no_return_policy
        FROM order_items oi
        LEFT JOIN products p
            ON oi.product_id = p.id
        WHERE oi.id = ?
        AND oi.order_id = ?
        LIMIT 1
    `,
    [
        orderItemId,
        orderId
    ]
);

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Selected product was not found in this order"
            });
        }

        const selectedItem = items[0];

if (
    Number(selectedItem.no_return_policy || 0) === 1
) {
    return res.status(400).json({
        success: false,
        message:
            "This product is not eligible for return or exchange."
    });
}


        const [
            existingRequests
        ] = await pool.execute(
            `
            SELECT
                id,
                status
            FROM exchange_requests
            WHERE order_item_id = ?
            AND status IN (
                'requested',
                'approved',
                'processing',
                'pickup_scheduled',
                'received',
                'replacement_shipped'
            )
            LIMIT 1
            `,
            [orderItemId]
        );

        if (existingRequests.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "An exchange request already exists for this product"
            });
        }

        const [
            result
        ] = await pool.execute(
            `
            INSERT INTO exchange_requests (
                order_id,
                order_item_id,
                user_id,
                reason,
                details,
                requested_size,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'requested')
            `,
            [
                orderId,
                orderItemId,
                userId,
                reason,
                cleanDetails || null,
                cleanRequestedSize || null
            ]
        );

        let customerEmailSent =
            false;

        let adminEmailSent =
            false;

        try {
            const emailResult =
                await sendExchangeRequestEmails(
                    result.insertId
                );

            customerEmailSent =
                Boolean(
                    emailResult?.customer
                );

            adminEmailSent =
                Boolean(
                    emailResult?.admin
                );
        } catch (emailError) {
            console.error(
                `Exchange email error for request ${result.insertId}:`
            );

            console.error(emailError);
        }

        return res.status(201).json({
            success: true,

            message:
                "Exchange request submitted successfully",

            exchange_request: {
                id:
                    result.insertId,

                order_id:
                    orderId,

                order_item_id:
                    orderItemId,

                status:
                    "requested"
            },

            email_sent:
                customerEmailSent,

            admin_email_sent:
                adminEmailSent
        });

    } catch (error) {
        console.error(
            "Request exchange error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to submit exchange request"
        });
    }
};

// ==========================================
// GET ADMIN EXCHANGE REQUEST FOR AN ORDER
// ==========================================

export const getAdminExchangeRequest = async (
    req,
    res
) => {
    try {
        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID"
            });
        }

        const [rows] = await pool.execute(
            `
            SELECT
                er.id,
                er.order_id,
                er.order_item_id,
                er.user_id,
                er.reason,
                er.details,
                er.requested_size,
                er.status,
                er.admin_notes,
                er.created_at,
                er.updated_at,

                o.order_number,
                o.order_status,
                o.shipping_name,
                o.shipping_email,
                o.shipping_phone,

                oi.product_id,
                oi.product_name,
                oi.sku,
                oi.size_name,
                oi.color_name,
                oi.quantity,
                oi.unit_price,
                oi.total_price,

                pi.image_url
            FROM exchange_requests er
            INNER JOIN orders o
                ON er.order_id = o.id
            INNER JOIN order_items oi
                ON er.order_item_id = oi.id
            LEFT JOIN (
                SELECT product_id, MAX(image_url) AS image_url
                FROM product_images
                WHERE is_primary = 1
                GROUP BY product_id
            ) pi
                ON oi.product_id = pi.product_id
            WHERE er.order_id = ?
            ORDER BY er.id DESC
            LIMIT 1
            `,
            [orderId]
        );

        return res.status(200).json({
            success: true,
            exchange_request: rows[0] || null
        });
    } catch (error) {
        console.error(
            "Get admin exchange request error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load exchange request"
        });
    }
};


// ==========================================
// UPDATE ADMIN EXCHANGE REQUEST STATUS
// ==========================================

export const updateExchangeStatus = async (
    req,
    res
) => {
    try {
        const orderId = Number(req.params.id);
        const exchangeId = Number(req.params.exchangeId);

        const requestedStatus = String(
            req.body?.status || ""
        )
            .trim()
            .toLowerCase();

        const adminNotes = String(
            req.body?.admin_notes || ""
        ).trim();

        const allowedStatuses = [
            "requested",
            "approved",
            "processing",
            "pickup_scheduled",
            "received",
            "replacement_shipped",
            "completed",
            "rejected"
        ];

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID"
            });
        }

        if (!Number.isInteger(exchangeId) || exchangeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Exchange Request ID"
            });
        }

        if (!allowedStatuses.includes(requestedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid exchange status"
            });
        }

        if (adminNotes.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Admin notes are too long"
            });
        }

        const [requests] = await pool.execute(
            `
            SELECT
                id,
                order_id,
                status
            FROM exchange_requests
            WHERE id = ?
            AND order_id = ?
            LIMIT 1
            `,
            [exchangeId, orderId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Exchange request not found"
            });
        }

        await pool.execute(
            `
            UPDATE exchange_requests
            SET
                status = ?,
                admin_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            AND order_id = ?
            `,
            [
                requestedStatus,
                adminNotes || null,
                exchangeId,
                orderId
            ]
        );

        const [updatedRows] = await pool.execute(
            `
            SELECT
                er.id,
                er.order_id,
                er.order_item_id,
                er.user_id,
                er.reason,
                er.details,
                er.requested_size,
                er.status,
                er.admin_notes,
                er.created_at,
                er.updated_at,
                o.order_number,
                o.order_status,
                o.shipping_name,
                o.shipping_email,
                oi.product_id,
                oi.product_name,
                oi.sku,
                oi.size_name,
                oi.color_name,
                oi.quantity,
                oi.unit_price,
                oi.total_price,
                pi.image_url
            FROM exchange_requests er
            INNER JOIN orders o
                ON er.order_id = o.id
            INNER JOIN order_items oi
                ON er.order_item_id = oi.id
            LEFT JOIN (
                SELECT product_id, MAX(image_url) AS image_url
                FROM product_images
                WHERE is_primary = 1
                GROUP BY product_id
            ) pi
                ON oi.product_id = pi.product_id
            WHERE er.id = ?
            LIMIT 1
            `,
            [exchangeId]
        );

        return res.status(200).json({
            success: true,
            message: "Exchange status updated successfully",
            exchange_request:
                updatedRows[0] || null
        });
    } catch (error) {
        console.error(
            "Update exchange status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update exchange status"
        });
    }
};
