import pool from "../config/database.js";


/*
|--------------------------------------------------------------------------
| GENERATE ORDER NUMBER
|--------------------------------------------------------------------------
*/

const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(
        1000 + Math.random() * 9000
    );

    return `UNTKN-${timestamp.slice(-8)}-${random}`;
};


/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
*/

export const createOrder = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const userId =
            req.user.id;


        const {
            shipping_name,
            shipping_phone,
            shipping_email,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country,
            delivery_method,
            notes
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | VALIDATE SHIPPING INFORMATION
        |--------------------------------------------------------------------------
        */

        if (
            !shipping_name ||
            !shipping_phone ||
            !shipping_address_line1 ||
            !shipping_city ||
            !shipping_state ||
            !shipping_postal_code
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Required shipping information is missing"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDATE DELIVERY METHOD
        |--------------------------------------------------------------------------
        */

        const selectedDeliveryMethod =
            delivery_method || "standard";


        const allowedDeliveryMethods = [
            "standard",
            "express"
        ];


        if (
            !allowedDeliveryMethods.includes(
                selectedDeliveryMethod
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid delivery method"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | SHIPPING FEES
        |--------------------------------------------------------------------------
        |
        | Standard = ₹100
        | Express  = ₹150
        |
        */

        const shippingFee =
            selectedDeliveryMethod ===
            "express"
                ? 150
                : 100;


        const discount = 0;


        /*
        |--------------------------------------------------------------------------
        | START TRANSACTION
        |--------------------------------------------------------------------------
        */

        await connection.beginTransaction();


        /*
        |--------------------------------------------------------------------------
        | GET USER CART
        |--------------------------------------------------------------------------
        */

        const [carts] =
            await connection.execute(
                `
                SELECT id
                FROM carts
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (
            carts.length === 0
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Cart is empty"
            });
        }


        const cartId =
            carts[0].id;


        /*
        |--------------------------------------------------------------------------
        | GET CART ITEMS
        |--------------------------------------------------------------------------
        */

        const [items] =
            await connection.execute(
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
                `,
                [cartId]
            );


        /*
        |--------------------------------------------------------------------------
        | CHECK EMPTY CART
        |--------------------------------------------------------------------------
        */

        if (
            items.length === 0
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Cart is empty"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CALCULATE SUBTOTAL
        |--------------------------------------------------------------------------
        */

        let subtotal = 0;

        const orderItems = [];


        for (
            const item of items
        ) {

            /*
            |------------------------------------------------------------------
            | PRODUCT AVAILABILITY
            |------------------------------------------------------------------
            */

            if (
                !item.published
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        `Product "${item.product_name}" is no longer available`
                });
            }


            /*
            |------------------------------------------------------------------
            | VARIANT VALIDATION
            |------------------------------------------------------------------
            */

            if (
                item.variant_id
            ) {

                if (
                    !item.variant_active
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message:
                            `Selected variant for "${item.product_name}" is unavailable`
                    });
                }


                /*
                |--------------------------------------------------------------
                | STOCK CHECK
                |--------------------------------------------------------------
                */

                if (
                    Number(
                        item.stock_quantity
                    ) <
                    Number(
                        item.quantity
                    )
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message:
                            `Insufficient stock for "${item.product_name}"`
                    });
                }
            }


            /*
            |------------------------------------------------------------------
            | DETERMINE UNIT PRICE
            |------------------------------------------------------------------
            */

            let unitPrice;


            if (
                item.variant_price !== null &&
                item.variant_price !== undefined
            ) {

                unitPrice =
                    Number(
                        item.variant_price
                    );

            } else if (
                item.sale_price !== null &&
                item.sale_price !== undefined
            ) {

                unitPrice =
                    Number(
                        item.sale_price
                    );

            } else {

                unitPrice =
                    Number(
                        item.base_price
                    );
            }


            /*
            |------------------------------------------------------------------
            | VALIDATE PRICE
            |------------------------------------------------------------------
            */

            if (
                !Number.isFinite(
                    unitPrice
                ) ||
                unitPrice < 0
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid price for "${item.product_name}"`
                });
            }


            /*
            |------------------------------------------------------------------
            | ITEM TOTAL
            |------------------------------------------------------------------
            */

            const totalPrice =
                unitPrice *
                Number(
                    item.quantity
                );


            subtotal +=
                totalPrice;


            /*
            |------------------------------------------------------------------
            | ORDER ITEM SNAPSHOT
            |------------------------------------------------------------------
            */

            orderItems.push({

                product_id:
                    item.product_id,

                variant_id:
                    item.variant_id,

                product_name:
                    item.product_name,

                sku:
                    item.sku,

                size_name:
                    item.size_name,

                color_name:
                    item.color_name,

                quantity:
                    Number(
                        item.quantity
                    ),

                unit_price:
                    unitPrice,

                total_price:
                    totalPrice
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CALCULATE FINAL TOTAL
        |--------------------------------------------------------------------------
        */

        subtotal =
            Number(
                subtotal.toFixed(2)
            );


        const totalAmount =
            Number(
                (
                    subtotal +
                    shippingFee -
                    discount
                ).toFixed(2)
            );


        /*
        |--------------------------------------------------------------------------
        | GENERATE ORDER NUMBER
        |--------------------------------------------------------------------------
        */

        const orderNumber =
            generateOrderNumber();


        /*
        |--------------------------------------------------------------------------
        | CREATE ORDER
        |--------------------------------------------------------------------------
        */

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

                    notes
                )

                VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    'pending',
                    'pending',
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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

                    shipping_name.trim(),

                    shipping_phone.trim(),

                    shipping_email?.trim() ||
                        null,

                    shipping_address_line1.trim(),

                    shipping_address_line2?.trim() ||
                        null,

                    shipping_city.trim(),

                    shipping_state.trim(),

                    shipping_postal_code.trim(),

                    shipping_country?.trim() ||
                        "India",

                    notes?.trim() ||
                        `Delivery method: ${selectedDeliveryMethod}`
                ]
            );


        const orderId =
            orderResult.insertId;


        /*
        |--------------------------------------------------------------------------
        | CREATE ORDER ITEMS
        |--------------------------------------------------------------------------
        */

        for (
            const item of orderItems
        ) {

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

                VALUES (
                    ?, ?, ?,
                    ?, ?,
                    ?, ?,
                    ?, ?, ?
                )
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
        }


        /*
        |--------------------------------------------------------------------------
        | CLEAR CART
        |--------------------------------------------------------------------------
        */

        await connection.execute(
            `
            DELETE FROM cart_items
            WHERE cart_id = ?
            `,
            [cartId]
        );


        /*
        |--------------------------------------------------------------------------
        | COMMIT
        |--------------------------------------------------------------------------
        */

        await connection.commit();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return res.status(201).json({

            success: true,

            message:
                "Order created successfully",

            order: {

                id:
                    orderId,

                order_number:
                    orderNumber,

                subtotal:
                    subtotal,

                shipping_fee:
                    shippingFee,

                discount:
                    discount,

                total_amount:
                    totalAmount,

                currency:
                    "INR",

                payment_status:
                    "pending",

                order_status:
                    "pending",

                delivery_method:
                    selectedDeliveryMethod,

                items:
                    orderItems
            }
        });


    } catch (error) {

        try {
            await connection.rollback();
        } catch {
            // Transaction rollback failed or was not started.
        }


        console.error(
            "Create order error:"
        );

        console.error(error);


        return res.status(500).json({
            success: false,
            message:
                "Failed to create order"
        });

    } finally {

        connection.release();
    }
};


/*
|--------------------------------------------------------------------------
| GET USER ORDERS
|--------------------------------------------------------------------------
*/

export const getOrders = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        const [orders] =
            await pool.execute(
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
                    order_status,

                    shipping_name,
                    shipping_city,
                    shipping_state,
                    shipping_postal_code,

                    created_at,
                    updated_at

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


/*
|--------------------------------------------------------------------------
| GET SINGLE USER ORDER
|--------------------------------------------------------------------------
*/

export const getOrderById = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;

        const orderId =
            Number(
                req.params.id
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


/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
*/

export const cancelOrder = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;

        const orderId =
            Number(
                req.params.id
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
                    id,
                    order_status,
                    payment_status

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
        | CHECK STATUS
        |--------------------------------------------------------------------------
        */

        if (
            order.order_status !==
                "pending" &&
            order.order_status !==
                "confirmed"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "This order cannot be cancelled"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | PAID ORDERS REQUIRE REFUND
        |--------------------------------------------------------------------------
        */

        if (
            order.payment_status ===
            "paid"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Paid orders require refund processing"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CANCEL
        |--------------------------------------------------------------------------
        */

        await pool.execute(
            `
            UPDATE orders

            SET order_status = 'cancelled'

            WHERE id = ?
            AND user_id = ?
            `,
            [
                orderId,
                userId
            ]
        );


        return res.status(200).json({
            success: true,
            message:
                "Order cancelled successfully"
        });


    } catch (error) {

        console.error(
            "Cancel order error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to cancel order"
        });
    }
};


/*
|--------------------------------------------------------------------------
| ADMIN: GET ALL ORDERS
|--------------------------------------------------------------------------
*/

export const getAdminOrders =
    async (req, res) => {

        try {

            const [orders] =
                await pool.execute(
                    `
                    SELECT
                        o.id,
                        o.order_number,
                        o.user_id,

                        u.name AS customer_name,
                        u.email AS customer_email,
                        u.phone AS customer_phone,

                        o.subtotal,
                        o.shipping_fee,
                        o.discount,
                        o.total_amount,
                        o.currency,

                        o.payment_status,
                        o.order_status,

                        o.shipping_name,
                        o.shipping_phone,
                        o.shipping_email,

                        o.shipping_city,
                        o.shipping_state,
                        o.shipping_postal_code,
                        o.shipping_country,

                        o.created_at,
                        o.updated_at

                    FROM orders o

                    INNER JOIN users u
                        ON o.user_id = u.id

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


/*
|--------------------------------------------------------------------------
| ADMIN: GET SINGLE ORDER
|--------------------------------------------------------------------------
*/

export const getAdminOrderById =
    async (req, res) => {

        try {

            const orderId =
                Number(
                    req.params.id
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
                        "Order ID must be a valid positive integer"
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
                        ON o.user_id = u.id

                    WHERE o.id = ?

                    LIMIT 1
                    `,
                    [orderId]
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


            const [payments] =
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
                            (payment) => ({
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


/*
|--------------------------------------------------------------------------
| ADMIN: UPDATE ORDER STATUS
|--------------------------------------------------------------------------
*/

export const updateAdminOrderStatus =
    async (req, res) => {

        try {

            const orderId =
                Number(
                    req.params.id
                );

            const {
                order_status
            } = req.body;


            /*
            |--------------------------------------------------------------------------
            | VALIDATE ID
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
                        "Order ID must be a valid positive integer"
                });
            }


            /*
            |--------------------------------------------------------------------------
            | ALLOWED STATUSES
            |--------------------------------------------------------------------------
            */

            const allowedStatuses = [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled"
            ];


            if (
                typeof order_status !==
                    "string" ||
                !allowedStatuses.includes(
                    order_status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid order status",

                    allowed_statuses:
                        allowedStatuses
                });
            }


            /*
            |--------------------------------------------------------------------------
            | GET CURRENT ORDER
            |--------------------------------------------------------------------------
            */

            const [orders] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        payment_status,
                        order_status

                    FROM orders

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [orderId]
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
            | SAME STATUS
            |--------------------------------------------------------------------------
            */

            if (
                order.order_status ===
                order_status
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Order is already ${order_status}`
                });
            }


            /*
            |--------------------------------------------------------------------------
            | PAID ORDER CANNOT GO BACK TO PENDING
            |--------------------------------------------------------------------------
            */

            if (
                order.payment_status ===
                    "paid" &&
                order_status ===
                    "pending"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A paid order cannot be moved back to pending"
                });
            }


            /*
            |--------------------------------------------------------------------------
            | UNPAID ORDER CANNOT SHIP
            |--------------------------------------------------------------------------
            */

            if (
                order.payment_status !==
                    "paid" &&
                (
                    order_status ===
                        "shipped" ||
                    order_status ===
                        "delivered"
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order must be paid before it can be shipped or delivered"
                });
            }


            /*
            |--------------------------------------------------------------------------
            | UPDATE
            |--------------------------------------------------------------------------
            */

            await pool.execute(
                `
                UPDATE orders

                SET order_status = ?

                WHERE id = ?
                `,
                [
                    order_status,
                    orderId
                ]
            );


            /*
            |--------------------------------------------------------------------------
            | GET UPDATED ORDER
            |--------------------------------------------------------------------------
            */

            const [
                updatedOrders
            ] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        order_number,
                        user_id,

                        payment_status,
                        order_status,

                        total_amount,
                        currency,

                        updated_at

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
                    updatedOrders[0]
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