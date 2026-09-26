import pool from "../config/database.js";
import { sendOrderConfirmationEmail } from "../services/order-confirmation.service.js";

export const confirmCodOrder = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const userId = req.user?.id;
        const orderId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID"
            });
        }

        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

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
            [orderId, userId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (order.order_status === "cancelled") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Cancelled order cannot be confirmed"
            });
        }

        if (order.payment_status === "paid") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This order has already been paid online"
            });
        }

        if (!order.shipping_email) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Customer email address is missing"
            });
        }

        if (
            order.order_status !== "pending" &&
            order.order_status !== "confirmed"
        ) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    `Order cannot be confirmed from ${order.order_status} status`
            });
        }

        if (order.order_status === "pending") {
            await connection.execute(
                `
                UPDATE orders
                SET
                    order_status = 'confirmed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND user_id = ?
                `,
                [orderId, userId]
            );
        }

        await connection.commit();
        transactionStarted = false;

        let emailSent = false;

        try {
            await sendOrderConfirmationEmail(orderId);
            emailSent = true;

            console.log(
                `COD confirmation email sent successfully for order ${orderId} to ${order.shipping_email}`
            );
        } catch (emailError) {
            console.error(
                `COD confirmation email failed for order ${orderId}:`
            );
            console.error(emailError);
        }

        return res.status(200).json({
            success: true,
            message:
                order.order_status === "confirmed"
                    ? "COD order confirmed successfully"
                    : "COD order confirmed successfully",
            email_sent: emailSent,
            order: {
                id: order.id,
                order_number: order.order_number,
                payment_status:
                    order.payment_status || "pending",
                order_status: "confirmed"
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "COD transaction rollback error:",
                    rollbackError
                );
            }
        }

        console.error("Confirm COD order error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to confirm COD order"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};