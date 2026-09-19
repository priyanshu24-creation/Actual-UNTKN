import crypto from "crypto";
import pool from "../config/database.js";
import razorpay from "../config/razorpay.js";


/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY PAYMENT ORDER
|--------------------------------------------------------------------------
*/

export const createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id } = req.body;

        /*
        |--------------------------------------------------------------------------
        | VALIDATE ORDER ID
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | GET ORDER
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | ORDER NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }


        const order = orders[0];


        /*
        |--------------------------------------------------------------------------
        | ALREADY PAID
        |--------------------------------------------------------------------------
        */

        if (
            order.payment_status === "paid"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order is already paid"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CANCELLED ORDER
        |--------------------------------------------------------------------------
        */

        if (
            order.order_status === "cancelled"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cancelled order cannot be paid"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDATE TOTAL
        |--------------------------------------------------------------------------
        */

        const totalAmount =
            Number(order.total_amount);


        if (
            !Number.isFinite(totalAmount) ||
            totalAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order amount"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | RAZORPAY AMOUNT
        |--------------------------------------------------------------------------
        |
        | Razorpay requires amount in paise.
        |
        | Example:
        |
        | ₹1299 = 129900 paise
        |
        */

        const amountInPaise =
            Math.round(
                totalAmount * 100
            );


        /*
        |--------------------------------------------------------------------------
        | CURRENCY
        |--------------------------------------------------------------------------
        */

        const currency =
            order.currency || "INR";


        /*
        |--------------------------------------------------------------------------
        | CHECK FOR EXISTING CREATED PAYMENT
        |--------------------------------------------------------------------------
        |
        | This prevents unnecessary duplicate Razorpay
        | orders when the customer clicks PAY NOW again.
        |
        */

        const [existingPayments] =
            await pool.execute(
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
                [
                    order.id
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | REUSE EXISTING RAZORPAY ORDER
        |--------------------------------------------------------------------------
        */

        if (
            existingPayments.length > 0
        ) {
            const existingPayment =
                existingPayments[0];

            return res.status(200).json({
                success: true,
                message:
                    "Existing payment order returned",
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
                        process.env
                            .RAZORPAY_KEY_ID
                }
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE RAZORPAY ORDER
        |--------------------------------------------------------------------------
        */

        const razorpayOrder =
            await razorpay.orders.create({
                amount:
                    amountInPaise,

                currency,

                receipt:
                    String(
                        order.order_number
                    ),

                notes: {
                    order_id:
                        String(order.id),

                    order_number:
                        String(
                            order.order_number
                        )
                }
            });


        /*
        |--------------------------------------------------------------------------
        | VALIDATE RAZORPAY RESPONSE
        |--------------------------------------------------------------------------
        */

        if (
            !razorpayOrder?.id
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Razorpay did not return an order ID"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | SAVE PAYMENT RECORD
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | RETURN PAYMENT INFORMATION
        |--------------------------------------------------------------------------
        */

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
                    process.env
                        .RAZORPAY_KEY_ID
            }
        });

    } catch (error) {

        console.error(
            "Create payment order error:"
        );

        console.error(error);


        /*
        |--------------------------------------------------------------------------
        | RAZORPAY ERROR
        |--------------------------------------------------------------------------
        */

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


/*
|--------------------------------------------------------------------------
| VERIFY RAZORPAY PAYMENT
|--------------------------------------------------------------------------
*/

export const verifyPayment = async (
    req,
    res
) => {

    const connection =
        await pool.getConnection();


    try {

        const userId =
            req.user.id;


        const {
            order_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | VALIDATE INPUT
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | FIND ORDER
        |--------------------------------------------------------------------------
        */

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


        if (
            orders.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }


        const order =
            orders[0];


        /*
        |--------------------------------------------------------------------------
        | ALREADY PAID
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | FIND PAYMENT RECORD
        |--------------------------------------------------------------------------
        */

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


        if (
            payments.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment record not found"
            });
        }


        const payment =
            payments[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK PAYMENT AMOUNT
        |--------------------------------------------------------------------------
        |
        | Compare the payment record with the order.
        |
        */

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


        /*
        |--------------------------------------------------------------------------
        | VERIFY RAZORPAY SIGNATURE
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | TIMING-SAFE SIGNATURE COMPARISON
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | START DATABASE TRANSACTION
        |--------------------------------------------------------------------------
        */

        await connection.beginTransaction();


        /*
        |--------------------------------------------------------------------------
        | LOCK PAYMENT RECORD
        |--------------------------------------------------------------------------
        */

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
                [
                    payment.id
                ]
            );


        if (
            lockedPayments.length === 0
        ) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Payment record not found"
            });
        }


        const lockedPayment =
            lockedPayments[0];


        /*
        |--------------------------------------------------------------------------
        | PREVENT DUPLICATE VERIFICATION
        |--------------------------------------------------------------------------
        */

        if (
            lockedPayment.status ===
            "paid"
        ) {

            await connection.commit();

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


        /*
        |--------------------------------------------------------------------------
        | GET ORDER ITEMS
        |--------------------------------------------------------------------------
        */

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
                [
                    numericOrderId
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | CHECK AND LOCK STOCK
        |--------------------------------------------------------------------------
        */

        for (
            const item of items
        ) {

            /*
            |--------------------------------------------------------------
            | No variant
            |--------------------------------------------------------------
            */

            if (
                !item.variant_id
            ) {
                continue;
            }


            /*
            |--------------------------------------------------------------
            | Lock variant
            |--------------------------------------------------------------
            */

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
                    [
                        item.variant_id
                    ]
                );


            if (
                variants.length === 0
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Product variant no longer exists"
                });
            }


            const variant =
                variants[0];


            /*
            |--------------------------------------------------------------
            | Check stock
            |--------------------------------------------------------------
            */

            if (
                Number(
                    variant.stock_quantity
                ) <
                Number(
                    item.quantity
                )
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient stock during payment confirmation"
                });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | REDUCE STOCK
        |--------------------------------------------------------------------------
        */

        for (
            const item of items
        ) {

            if (
                !item.variant_id
            ) {
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


        /*
        |--------------------------------------------------------------------------
        | UPDATE PAYMENT
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | UPDATE ORDER
        |--------------------------------------------------------------------------
        */

        await connection.execute(
            `
            UPDATE orders
            SET
                payment_status = 'paid',
                order_status = 'confirmed'
            WHERE id = ?
            `,
            [
                numericOrderId
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | COMMIT
        |--------------------------------------------------------------------------
        */

        await connection.commit();


        /*
        |--------------------------------------------------------------------------
        | SUCCESS RESPONSE
        |--------------------------------------------------------------------------
        */

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
            }
        });

    } catch (error) {

        try {
            await connection.rollback();
        } catch {
            // Transaction may not have started.
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


/*
|--------------------------------------------------------------------------
| GET PAYMENT BY ORDER
|--------------------------------------------------------------------------
*/

export const getPaymentByOrder =
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            const orderId =
                Number(
                    req.params.orderId
                );


            /*
            |--------------------------------------------------------------------------
            | VALIDATE ORDER ID
            |--------------------------------------------------------------------------
            */

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


            /*
            |--------------------------------------------------------------------------
            | GET PAYMENT
            |--------------------------------------------------------------------------
            */

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


            /*
            |--------------------------------------------------------------------------
            | PAYMENT NOT FOUND
            |--------------------------------------------------------------------------
            */

            if (
                payments.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Payment not found"
                });
            }


            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

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