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
                id,
                order_id,
                product_id,
                product_name,
                size_name,
                color_name,
                quantity
            FROM order_items
            WHERE id = ?
            AND order_id = ?
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