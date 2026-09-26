import crypto from "crypto";
import pool from "../config/database.js";
import razorpay from "../config/razorpay.js";
import { sendOrderEmails } from "../services/order-confirmation.service.js";

export const createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id } = req.body;

        const numericOrderId = Number(order_id);

        if (
            !Number.isInteger(numericOrderId) ||
            numericOrderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid Order ID is required"
            });
        }

        const [orders] = await pool.execute(
            `
            SELECT
                id,
                order_number,
                subtotal,
                shipping_fee,
                discount,
                total_amount,
                currency,
                payment_status,
                order_status
            FROM orders
            WHERE id = ?
            AND user_id = ?
            LIMIT 1
            `,
            [
                numericOrderId,
                userId
            ]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (order.payment_status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid"
            });
        }

        if (order.order_status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled order cannot be paid"
            });
        }

        const totalAmount = Number(order.total_amount);

        if (
            !Number.isFinite(totalAmount) ||
            totalAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }

        const amountInPaise = Math.round(
            totalAmount * 100
        );

        const currency = order.currency || "INR";

        const [existingPayments] = await pool.execute(
            `
            SELECT
                id,
                order_id,
                razorpay_order_id,
                amount,
                currency,
                status,
                created_at
            FROM payments
            WHERE order_id = ?
            AND status = 'created'
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [order.id]
        );

        if (existingPayments.length > 0) {
            const existingPayment =
                existingPayments[0];

            return res.status(200).json({
                success: true,
                message: "Existing payment order returned",
                payment: {
                    razorpay_order_id:
                        existingPayment.razorpay_order_id,
                    order_id:
                        order.id,
                    order_number:
                        order.order_number,
                    amount:
                        Math.round(
                            Number(
                                existingPayment.amount
                            ) * 100
                        ),
                    amount_in_rupees:
                        Number(
                            existingPayment.amount
                        ),
                    currency:
                        existingPayment.currency,
                    razorpay_key_id:
                        process.env.RAZORPAY_KEY_ID
                }
            });
        }

        const razorpayOrder =
            await razorpay.orders.create({
                amount: amountInPaise,
                currency,
                receipt: String(
                    order.order_number
                ),
                notes: {
                    order_id: String(
                        order.id
                    ),
                    order_number: String(
                        order.order_number
                    )
                }
            });

        if (!razorpayOrder?.id) {
            return res.status(500).json({
                success: false,
                message:
                    "Razorpay did not return an order ID"
            });
        }

        await pool.execute(
            `
            INSERT INTO payments (
                order_id,
                razorpay_order_id,
                amount,
                currency,
                status
            )
            VALUES (?, ?, ?, ?, 'created')
            `,
            [
                order.id,
                razorpayOrder.id,
                totalAmount,
                currency
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Payment order created successfully",
            payment: {
                razorpay_order_id:
                    razorpayOrder.id,
                order_id:
                    order.id,
                order_number:
                    order.order_number,
                amount:
                    amountInPaise,
                amount_in_rupees:
                    totalAmount,
                currency,
                razorpay_key_id:
                    process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error(
            "Create payment order error:"
        );

        console.error(error);

        if (
            error?.error ||
            error?.statusCode
        ) {
            console.error(
                "Razorpay error details:",
                error.error ||
                    error.message
            );
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create payment order"
        });
    }
};

export const verifyPayment = async (
    req,
    res
) => {
    const connection =
        await pool.getConnection();

    let transactionStarted = false;

    try {
        const userId = req.user.id;

        const {
            order_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const numericOrderId =
            Number(order_id);

        if (
            !Number.isInteger(
                numericOrderId
            ) ||
            numericOrderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid Order ID is required"
            });
        }

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment verification data is incomplete"
            });
        }

        const [orders] =
            await connection.execute(
                `
                SELECT
                    id,
                    total_amount,
                    currency,
                    payment_status,
                    order_status
                FROM orders
                WHERE id = ?
                AND user_id = ?
                LIMIT 1
                `,
                [
                    numericOrderId,
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

        const order = orders[0];

        if (
            order.payment_status ===
            "paid"
        ) {
            return res.status(200).json({
                success: true,
                message:
                    "Payment already verified",
                order: {
                    id:
                        numericOrderId,
                    payment_status:
                        "paid",
                    order_status:
                        order.order_status
                }
            });
        }

        const [payments] =
            await connection.execute(
                `
                SELECT
                    id,
                    order_id,
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    amount,
                    currency,
                    status
                FROM payments
                WHERE razorpay_order_id = ?
                AND order_id = ?
                LIMIT 1
                `,
                [
                    razorpay_order_id,
                    numericOrderId
                ]
            );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment record not found"
            });
        }

        const payment =
            payments[0];

        const orderAmount =
            Math.round(
                Number(
                    order.total_amount
                ) * 100
            );

        const paymentAmount =
            Math.round(
                Number(
                    payment.amount
                ) * 100
            );

        if (
            orderAmount !==
            paymentAmount
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount does not match order amount"
            });
        }

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env
                        .RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");

        const generatedBuffer =
            Buffer.from(
                generatedSignature,
                "utf8"
            );

        const receivedBuffer =
            Buffer.from(
                razorpay_signature,
                "utf8"
            );

        if (
            generatedBuffer.length !==
                receivedBuffer.length ||
            !crypto.timingSafeEqual(
                generatedBuffer,
                receivedBuffer
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment signature"
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        const [lockedPayments] =
            await connection.execute(
                `
                SELECT
                    id,
                    status
                FROM payments
                WHERE id = ?
                FOR UPDATE
                `,
                [payment.id]
            );

        if (
            lockedPayments.length === 0
        ) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message:
                    "Payment record not found"
            });
        }

        const lockedPayment =
            lockedPayments[0];

        if (
            lockedPayment.status ===
            "paid"
        ) {
            await connection.commit();
            transactionStarted = false;

            return res.status(200).json({
                success: true,
                message:
                    "Payment already verified",
                order: {
                    id:
                        numericOrderId,
                    payment_status:
                        "paid",
                    order_status:
                        "confirmed"
                },
                payment: {
                    razorpay_order_id,
                    razorpay_payment_id
                }
            });
        }

        const [items] =
            await connection.execute(
                `
                SELECT
                    id,
                    variant_id,
                    quantity
                FROM order_items
                WHERE order_id = ?
                `,
                [numericOrderId]
            );

        for (
            const item of items
        ) {
            if (!item.variant_id) {
                continue;
            }

            const [variants] =
                await connection.execute(
                    `
                    SELECT
                        id,
                        stock_quantity
                    FROM product_variants
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [item.variant_id]
                );

            if (
                variants.length === 0
            ) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        "Product variant no longer exists"
                });
            }

            const variant =
                variants[0];

            if (
                Number(
                    variant.stock_quantity
                ) <
                Number(
                    item.quantity
                )
            ) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient stock during payment confirmation"
                });
            }
        }

        for (
            const item of items
        ) {
            if (!item.variant_id) {
                continue;
            }

            await connection.execute(
                `
                UPDATE product_variants
                SET
                    stock_quantity =
                        stock_quantity - ?
                WHERE id = ?
                `,
                [
                    item.quantity,
                    item.variant_id
                ]
            );
        }

        await connection.execute(
            `
            UPDATE payments
            SET
                razorpay_payment_id = ?,
                razorpay_signature = ?,
                status = 'paid'
            WHERE id = ?
            `,
            [
                razorpay_payment_id,
                razorpay_signature,
                payment.id
            ]
        );

        await connection.execute(
            `
            UPDATE orders
            SET
                payment_status = 'paid',
                order_status = 'confirmed'
            WHERE id = ?
            `,
            [numericOrderId]
        );

        await connection.commit();
        transactionStarted = false;

        let emailSent = false;
let adminEmailSent = false;

try {
    const emailResults =
        await sendOrderEmails(numericOrderId);

    emailSent = Boolean(
        emailResults?.customer
    );

    adminEmailSent = Boolean(
        emailResults?.admin
    );

    console.log(
        `Order email processing completed for order ${numericOrderId}:`,
        {
            customer: emailSent,
            admin: adminEmailSent
        }
    );
} catch (emailError) {
    console.error(
        "Order email processing error:",
        emailError
    );
}

        return res.status(200).json({
            success: true,
            message:
                "Payment verified successfully",
            order: {
                id:
                    numericOrderId,
                payment_status:
                    "paid",
                order_status:
                    "confirmed"
            },
            payment: {
                razorpay_order_id,
                razorpay_payment_id
            },
            email_sent:
                emailSent
        });
    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch {}
        }

        console.error(
            "Verify payment error:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Payment verification failed"
        });
    } finally {
        connection.release();
    }
};

export const getPaymentByOrder =
    async (req, res) => {
        try {
            const userId =
                req.user.id;

            const orderId =
                Number(
                    req.params.orderId
                );

            if (
                !Number.isInteger(
                    orderId
                ) ||
                orderId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Order ID"
                });
            }

            const [payments] =
                await pool.execute(
                    `
                    SELECT
                        p.id,
                        p.order_id,
                        p.razorpay_order_id,
                        p.razorpay_payment_id,
                        p.amount,
                        p.currency,
                        p.status,
                        p.created_at,
                        p.updated_at
                    FROM payments p
                    INNER JOIN orders o
                        ON p.order_id = o.id
                    WHERE p.order_id = ?
                    AND o.user_id = ?
                    ORDER BY p.created_at DESC
                    `,
                    [
                        orderId,
                        userId
                    ]
                );

            if (
                payments.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Payment not found"
                });
            }

            return res.status(200).json({
                success: true,
                count:
                    payments.length,
                payments:
                    payments.map(
                        (payment) => ({
                            ...payment,
                            amount:
                                Number(
                                    payment.amount
                                )
                        })
                    )
            });
        } catch (error) {
            console.error(
                "Get payment error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch payment"
            });
        }
    };