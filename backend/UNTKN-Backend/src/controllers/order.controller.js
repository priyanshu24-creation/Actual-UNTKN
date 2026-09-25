import pool from "../config/database.js";
import { sendOrderEmails } from "../services/order-confirmation.js";
import { validateCoupon } from "../services/coupon.service.js";

const roundMoney = (value) =>
    Number(Number(value || 0).toFixed(2));

const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `UNTKN-${timestamp.slice(-8)}-${random}`;
};

const normalizeAddressObject = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "object") {
        return value;
    }

    const text = String(value).trim();

    if (!text) {
        return null;
    }

    try {
        const parsed = JSON.parse(text);
        return parsed && typeof parsed === "object"
            ? parsed
            : null;
    } catch {
        return null;
    }
};

export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const body = req.body || {};

        const oldShippingAddress = normalizeAddressObject(
            body.shipping_address ?? body.shippingAddress
        );

        const shippingName = String(
            body.shipping_name ??
            oldShippingAddress?.name ??
            ""
        ).trim();

        const shippingPhone = String(
            body.shipping_phone ??
            oldShippingAddress?.phone ??
            ""
        ).trim();

        const shippingEmailValue = String(
            body.shipping_email ??
            oldShippingAddress?.email ??
            ""
        ).trim();

        const shippingAddressLine1 = String(
            body.shipping_address_line1 ??
            oldShippingAddress?.address ??
            oldShippingAddress?.address_line1 ??
            ""
        ).trim();

        const shippingAddressLine2 = String(
            body.shipping_address_line2 ??
            oldShippingAddress?.apartment ??
            oldShippingAddress?.address_line2 ??
            ""
        ).trim();

        const shippingCity = String(
            body.shipping_city ??
            oldShippingAddress?.city ??
            ""
        ).trim();

        const shippingState = String(
            body.shipping_state ??
            oldShippingAddress?.state ??
            ""
        ).trim();

        const shippingPostalCode = String(
            body.shipping_postal_code ??
            oldShippingAddress?.pincode ??
            oldShippingAddress?.postal_code ??
            ""
        ).trim();

        const shippingCountry = String(
            body.shipping_country ??
            oldShippingAddress?.country ??
            "India"
        ).trim() || "India";

        const notes = String(
            body.notes ??
            ""
        ).trim();

        const paymentMethod = String(
            body.payment_method ??
            body.paymentMethod ??
            "cod"
        ).trim() || "cod";

        const couponCode = String(
            body.coupon_code ??
            body.couponCode ??
            ""
        ).trim();

        if (
            !shippingName ||
            !shippingPhone ||
            !shippingAddressLine1 ||
            !shippingCity ||
            !shippingState ||
            !shippingPostalCode
        ) {
            return res.status(400).json({
                success: false,
                message: "Required shipping information is missing"
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        const [carts] = await connection.execute(
            `
            SELECT id
            FROM carts
            WHERE user_id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [userId]
        );

        if (carts.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const cartId = carts[0].id;

        const [items] = await connection.execute(
            `
            SELECT
                ci.id AS cart_item_id,
                ci.product_id,
                ci.variant_id,
                ci.quantity,

                p.name AS product_name,
                p.published,
                p.base_price,
                p.sale_price,
                p.category_id,
                p.collection_id,

                pv.sku,
                pv.price AS variant_price,
                pv.stock_quantity,
                pv.active AS variant_active,

                s.name AS size_name,
                c.name AS color_name

            FROM cart_items ci

            INNER JOIN products p
                ON ci.product_id = p.id

            LEFT JOIN product_variants pv
                ON ci.variant_id = pv.id

            LEFT JOIN sizes s
                ON pv.size_id = s.id

            LEFT JOIN colors c
                ON pv.color_id = c.id

            WHERE ci.cart_id = ?
            FOR UPDATE
            `,
            [cartId]
        );

        if (items.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            if (!Number(item.published)) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: `Product "${item.product_name}" is no longer available`
                });
            }

            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for "${item.product_name}"`
                });
            }

            if (item.variant_id) {
                if (!Number(item.variant_active)) {
                    await connection.rollback();
                    transactionStarted = false;

                    return res.status(400).json({
                        success: false,
                        message: `Selected variant for "${item.product_name}" is unavailable`
                    });
                }

                const stock = Number(item.stock_quantity || 0);

                if (quantity > stock) {
                    await connection.rollback();
                    transactionStarted = false;

                    return res.status(400).json({
                        success: false,
                        message: `Only ${Math.max(0, Math.floor(stock))} item(s) available for "${item.product_name}"`
                    });
                }
            }

            const unitPrice =
                item.sale_price !== null &&
                item.sale_price !== undefined
                    ? Number(item.sale_price)
                    : Number(item.base_price);

            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: `Invalid price for "${item.product_name}"`
                });
            }

            const totalPrice = roundMoney(
                unitPrice * quantity
            );

            subtotal += totalPrice;

            orderItems.push({
                product_id: item.product_id,
                variant_id: item.variant_id,
                product_name: item.product_name,
                sku: item.sku || null,
                size_name: item.size_name || null,
                color_name: item.color_name || null,
                category_id: item.category_id,
                collection_id: item.collection_id,
                quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }

        subtotal = roundMoney(subtotal);

        let discount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            try {
                appliedCoupon = await validateCoupon({
                    connection,
                    code: couponCode,
                    userId,
                    subtotal,
                    items: orderItems,
                    forOrder: true
                });

                discount = roundMoney(
                    appliedCoupon.discount
                );
            } catch (couponError) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        couponError?.message ||
                        "Invalid coupon code"
                });
            }
        }

        const shippingFee = 0;

        const totalAmount = roundMoney(
            Math.max(
                0,
                subtotal +
                    shippingFee -
                    discount
            )
        );

        const orderNumber =
            generateOrderNumber();

        const [orderResult] =
            await connection.execute(
                `
                INSERT INTO orders (
                    user_id,
                    order_number,
                    subtotal,
                    shipping_fee,
                    discount,
                    total_amount,
                    currency,
                    payment_status,
                    order_status,
                    shipping_name,
                    shipping_phone,
                    shipping_email,
                    shipping_address_line1,
                    shipping_address_line2,
                    shipping_city,
                    shipping_state,
                    shipping_postal_code,
                    shipping_country,
                    notes,
                    coupon_code
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    'pending',
                    'pending',
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                `,
                [
                    userId,
                    orderNumber,
                    subtotal,
                    shippingFee,
                    discount,
                    totalAmount,
                    "INR",
                    shippingName,
                    shippingPhone,
                    shippingEmailValue || null,
                    shippingAddressLine1,
                    shippingAddressLine2 || null,
                    shippingCity,
                    shippingState,
                    shippingPostalCode,
                    shippingCountry,
                    notes || null,
                    appliedCoupon?.code || null
                ]
            );

        const orderId =
            orderResult.insertId;

        for (const item of orderItems) {
            await connection.execute(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    variant_id,
                    product_name,
                    sku,
                    size_name,
                    color_name,
                    quantity,
                    unit_price,
                    total_price
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    orderId,
                    item.product_id,
                    item.variant_id,
                    item.product_name,
                    item.sku,
                    item.size_name,
                    item.color_name,
                    item.quantity,
                    item.unit_price,
                    item.total_price
                ]
            );

            if (item.variant_id) {
                const [stockUpdate] =
                    await connection.execute(
                        `
                        UPDATE product_variants
                        SET stock_quantity =
                            stock_quantity - ?
                        WHERE id = ?
                        AND stock_quantity >= ?
                        `,
                        [
                            item.quantity,
                            item.variant_id,
                            item.quantity
                        ]
                    );

                if (
                    stockUpdate.affectedRows !== 1
                ) {
                    throw new Error(
                        `Insufficient stock for "${item.product_name}"`
                    );
                }
            }
        }

        if (appliedCoupon?.coupon?.id) {
            const [usageUpdate] =
                await connection.execute(
                    `
                    UPDATE coupons
                    SET usage_count =
                        usage_count + 1
                    WHERE id = ?
                    AND (
                        usage_limit IS NULL
                        OR usage_count < usage_limit
                    )
                    `,
                    [
                        appliedCoupon.coupon.id
                    ]
                );

            if (
                usageUpdate.affectedRows !== 1
            ) {
                throw new Error(
                    "This coupon is no longer available. Please try another coupon."
                );
            }

            await connection.execute(
                `
                INSERT INTO coupon_usages (
                    coupon_id,
                    user_id,
                    order_id,
                    discount_amount
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    appliedCoupon.coupon.id,
                    userId,
                    orderId,
                    discount
                ]
            );
        }

        await connection.execute(
            `
            DELETE FROM cart_items
            WHERE cart_id = ?
            `,
            [cartId]
        );

        await connection.commit();
        transactionStarted = false;

        sendOrderEmails(orderId).catch(
            (error) => {
                console.error(
                    "Order email processing failed:",
                    error
                );
            }
        );

        return res.status(201).json({
            success: true,
            message:
                "Order created successfully",

            order: {
                id: orderId,
                order_id: orderId,
                order_number: orderNumber,

                subtotal,

                shipping_fee:
                    shippingFee,

                discount,

                total_amount:
                    totalAmount,

                currency:
                    "INR",

                payment_method:
                    paymentMethod,

                payment_status:
                    "pending",

                order_status:
                    "pending",

                coupon_code:
                    appliedCoupon?.code ||
                    null,

                items:
                    orderItems
            }
        });

    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Order rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "Create order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create order",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined
        });

    } finally {
        connection.release();
    }
};

export const getOrders = async (
    req,
    res
) => {
    try {
        const userId =
            req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

        const [orders] =
            await pool.execute(
                `
                SELECT *
                FROM orders
                WHERE user_id = ?
                ORDER BY created_at DESC
                `,
                [userId]
            );

        return res.status(200).json({
            success: true,
            count:
                orders.length,

            orders:
                orders.map(
                    (order) => ({
                        ...order,

                        subtotal:
                            Number(
                                order.subtotal
                            ),

                        shipping_fee:
                            Number(
                                order.shipping_fee
                            ),

                        discount:
                            Number(
                                order.discount
                            ),

                        total_amount:
                            Number(
                                order.total_amount
                            )
                    })
                )
        });

    } catch (error) {
        console.error(
            "Get orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch orders"
        });
    }
};

export const getOrderById = async (
    req,
    res
) => {
    try {
        const userId =
            req.user?.id;

        const orderId =
            Number(
                req.params.id ??
                req.params.orderId
            );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

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

        const [orders] =
            await pool.execute(
                `
                SELECT *
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

        if (
            orders.length ===
            0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        const [items] =
            await pool.execute(
                `
                SELECT
                    id,
                    product_id,
                    variant_id,
                    product_name,
                    sku,
                    size_name,
                    color_name,
                    quantity,
                    unit_price,
                    total_price,
                    created_at
                FROM order_items
                WHERE order_id = ?
                ORDER BY id ASC
                `,
                [orderId]
            );

        const order =
            orders[0];

        return res.status(200).json({
            success: true,

            order: {
                ...order,

                subtotal:
                    Number(
                        order.subtotal
                    ),

                shipping_fee:
                    Number(
                        order.shipping_fee
                    ),

                discount:
                    Number(
                        order.discount
                    ),

                total_amount:
                    Number(
                        order.total_amount
                    ),

                items
            }
        });

    } catch (error) {
        console.error(
            "Get order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch order"
        });
    }
};

export const cancelOrder = async (
    req,
    res
) => {
    const connection =
        await pool.getConnection();

    let transactionStarted =
        false;

    try {
        const userId =
            req.user?.id;

        const orderId =
            Number(
                req.params.id ??
                req.params.orderId
            );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

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

        await connection.beginTransaction();
        transactionStarted = true;

        const [orders] =
            await connection.execute(
                `
                SELECT
                    id,
                    order_status,
                    payment_status
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

        if (
            orders.length ===
            0
        ) {
            await connection.rollback();
            transactionStarted =
                false;

            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        const order =
            orders[0];

        if (
            order.order_status !==
                "pending" &&
            order.order_status !==
                "confirmed"
        ) {
            await connection.rollback();
            transactionStarted =
                false;

            return res.status(400).json({
                success: false,
                message:
                    "This order cannot be cancelled"
            });
        }

        if (
            order.payment_status ===
            "paid"
        ) {
            await connection.rollback();
            transactionStarted =
                false;

            return res.status(400).json({
                success: false,
                message:
                    "Paid orders require refund processing"
            });
        }

        const [items] =
            await connection.execute(
                `
                SELECT
                    variant_id,
                    quantity
                FROM order_items
                WHERE order_id = ?
                FOR UPDATE
                `,
                [orderId]
            );

        for (
            const item of items
        ) {
            if (
                item.variant_id
            ) {
                await connection.execute(
                    `
                    UPDATE product_variants
                    SET stock_quantity =
                        stock_quantity + ?
                    WHERE id = ?
                    `,
                    [
                        item.quantity,
                        item.variant_id
                    ]
                );
            }
        }

        await connection.execute(
            `
            UPDATE orders
            SET order_status =
                'cancelled'
            WHERE id = ?
            AND user_id = ?
            `,
            [
                orderId,
                userId
            ]
        );

        await connection.commit();
        transactionStarted =
            false;

        return res.status(200).json({
            success: true,
            message:
                "Order cancelled successfully"
        });

    } catch (error) {
        if (
            transactionStarted
        ) {
            try {
                await connection.rollback();
            } catch (
                rollbackError
            ) {
                console.error(
                    "Cancel rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "Cancel order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to cancel order"
        });

    } finally {
        connection.release();
    }
};

export const getAdminOrders =
    async (
        req,
        res
    ) => {
        try {
            const [orders] =
                await pool.execute(
                    `
                    SELECT
                        o.*,
                        u.name AS customer_name,
                        u.email AS customer_email,
                        u.phone AS customer_phone
                    FROM orders o
                    INNER JOIN users u
                        ON o.user_id =
                           u.id
                    ORDER BY
                        o.created_at DESC
                    `
                );

            return res.status(200).json({
                success: true,

                count:
                    orders.length,

                orders:
                    orders.map(
                        (
                            order
                        ) => ({
                            ...order,

                            subtotal:
                                Number(
                                    order.subtotal
                                ),

                            shipping_fee:
                                Number(
                                    order.shipping_fee
                                ),

                            discount:
                                Number(
                                    order.discount
                                ),

                            total_amount:
                                Number(
                                    order.total_amount
                                )
                        })
                    )
            });

        } catch (error) {
            console.error(
                "Admin get orders error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch admin orders"
            });
        }
    };

export const getAdminOrderById =
    async (
        req,
        res
    ) => {
        try {
            const orderId =
                Number(
                    req.params.id ??
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

            const [orders] =
                await pool.execute(
                    `
                    SELECT
                        o.*,
                        u.name AS customer_name,
                        u.email AS customer_email,
                        u.phone AS customer_phone
                    FROM orders o
                    INNER JOIN users u
                        ON o.user_id =
                           u.id
                    WHERE o.id = ?
                    LIMIT 1
                    `,
                    [orderId]
                );

            if (
                orders.length ===
                0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });
            }

            const [items] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        product_id,
                        variant_id,
                        product_name,
                        sku,
                        size_name,
                        color_name,
                        quantity,
                        unit_price,
                        total_price,
                        created_at
                    FROM order_items
                    WHERE order_id = ?
                    ORDER BY id ASC
                    `,
                    [orderId]
                );

            let payments = [];

            try {
                const [
                    paymentRows
                ] =
                    await pool.execute(
                        `
                        SELECT
                            id,
                            order_id,
                            razorpay_order_id,
                            razorpay_payment_id,
                            amount,
                            currency,
                            status,
                            created_at,
                            updated_at
                        FROM payments
                        WHERE order_id = ?
                        ORDER BY
                            created_at DESC
                        `,
                        [orderId]
                    );

                payments =
                    paymentRows;

            } catch (
                paymentError
            ) {
                console.error(
                    "Admin payment lookup error:",
                    paymentError
                );
            }

            const order =
                orders[0];

            return res.status(200).json({
                success: true,

                order: {
                    ...order,

                    subtotal:
                        Number(
                            order.subtotal
                        ),

                    shipping_fee:
                        Number(
                            order.shipping_fee
                        ),

                    discount:
                        Number(
                            order.discount
                        ),

                    total_amount:
                        Number(
                            order.total_amount
                        ),

                    items,

                    payments:
                        payments.map(
                            (
                                payment
                            ) => ({
                                ...payment,

                                amount:
                                    Number(
                                        payment.amount
                                    )
                            })
                        )
                }
            });

        } catch (error) {
            console.error(
                "Admin get order error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch admin order"
            });
        }
    };

export const updateAdminOrderStatus =
    async (
        req,
        res
    ) => {
        try {
            const orderId =
                Number(
                    req.params.id ??
                    req.params.orderId
                );

            const orderStatus =
                String(
                    req.body?.order_status ??
                    req.body?.status ??
                    ""
                )
                    .trim()
                    .toLowerCase();

            const allowedStatuses = [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled"
            ];

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

            if (
                !allowedStatuses.includes(
                    orderStatus
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid order status"
                });
            }

            const [result] =
                await pool.execute(
                    `
                    UPDATE orders
                    SET order_status = ?
                    WHERE id = ?
                    `,
                    [
                        orderStatus,
                        orderId
                    ]
                );

            if (
                result.affectedRows !==
                1
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });
            }

            const [orders] =
                await pool.execute(
                    `
                    SELECT *
                    FROM orders
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [orderId]
                );

            return res.status(200).json({
                success: true,
                message:
                    "Order status updated successfully",
                order:
                    orders[0] ||
                    null
            });

        } catch (error) {
            console.error(
                "Admin update order status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update order status"
            });
        }
    };