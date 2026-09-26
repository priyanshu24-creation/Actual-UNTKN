import pool from "../config/database.js";
import { sendOrderConfirmationEmail } from "../services/order-confirmation.service.js";

export const confirmCodOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user?.id;
        const orderId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID"
            });
        }

        await connection.beginTransaction();

        const [orders] = await connection.execute(
            `
            SELECT
                id,
                user_id,
                order_number,
                payment_status,
                order_status,
                shipping_email
            FROM orders
            WHERE id = ?
            AND user_id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [
                orderId,
                userId
            ]
        );

        if (orders.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (order.order_status === "cancelled") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Cancelled order cannot be confirmed"
            });
        }

        if (order.payment_status === "paid") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This order has already been paid online"
            });
        }

        if (order.order_status === "confirmed") {
            await connection.commit();

            return res.status(200).json({
                success: true,
                message: "COD order is already confirmed",
                email_sent: false,
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    payment_status: order.payment_status,
                    order_status: order.order_status
                }
            });
        }

        if (order.order_status !== "pending") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: `Order cannot be confirmed from ${order.order_status} status`
            });
        }

        if (!order.shipping_email) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Customer email address is missing"
            });
        }

        await connection.execute(
            `
            UPDATE orders
            SET
                order_status = 'confirmed',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            AND user_id = ?
            `,
            [
                orderId,
                userId
            ]
        );

        await connection.commit();

        let emailSent = false;

        try {
            await sendOrderConfirmationEmail(orderId);
            emailSent = true;
        } catch (emailError) {
            console.error(
                "COD confirmation email error:",
                emailError
            );
        }

        return res.status(200).json({
            success: true,
            message: "COD order confirmed successfully",
            email_sent: emailSent,
            order: {
                id: orderId,
                order_number: order.order_number,
                payment_status: order.payment_status,
                order_status: "confirmed"
            }
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch {}

        console.error(
            "Confirm COD order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to confirm COD order"
        });
    } finally {
        connection.release();
    }
};