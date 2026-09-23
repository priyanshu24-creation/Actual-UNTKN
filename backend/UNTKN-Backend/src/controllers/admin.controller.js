import pool from "../config/database.js";

export const getAdminDashboard = async (req, res) => {
    try {
        const [
            [userRows],
            [productRows],
            [orderRows],
            [paidOrderRows],
            [revenueRows],
            [pendingOrderRows],
            [lowStockRows],
            [salesOverviewRows]
        ] = await Promise.all([
            pool.execute(`
                SELECT COUNT(*) AS total
                FROM users
                WHERE role = 'customer'
            `),

            pool.execute(`
                SELECT COUNT(*) AS total
                FROM products
            `),

            pool.execute(`
                SELECT COUNT(*) AS total
                FROM orders
            `),

            pool.execute(`
                SELECT COUNT(*) AS total
                FROM orders
                WHERE payment_status = 'paid'
            `),

            pool.execute(`
                SELECT COALESCE(SUM(total_amount), 0) AS total
                FROM orders
                WHERE payment_status = 'paid'
            `),

            pool.execute(`
                SELECT COUNT(*) AS total
                FROM orders
                WHERE order_status = 'pending'
            `),

            pool.execute(`
                SELECT COUNT(*) AS total
                FROM product_variants
                WHERE stock_quantity < 2
                AND active = 1
            `),

            // Sales overview for the last 30 days, grouped by day
            pool.execute(`
                SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS total
                FROM orders
                WHERE payment_status = 'paid'
                  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `)
        ]);

        const [orderStatusRows] = await pool.execute(`
            SELECT
                order_status,
                COUNT(*) AS count
            FROM orders
            GROUP BY order_status
            ORDER BY order_status
        `);

        const [paymentStatusRows] = await pool.execute(`
            SELECT
                payment_status,
                COUNT(*) AS count
            FROM orders
            GROUP BY payment_status
            ORDER BY payment_status
        `);

        const [recentOrders] = await pool.execute(`
            SELECT
                id,
                order_number,
                user_id,
                shipping_name AS customer_name,
                shipping_email AS customer_email,
                shipping_phone AS customer_phone,
                total_amount,
                currency,
                payment_status,
                order_status,
                created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 10
        `);

        const [recentUsers] = await pool.execute(`
            SELECT
                id,
                name,
                email,
                phone,
                role,
                is_active,
                created_at
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
            LIMIT 10
        `);

        const [lowStockProducts] = await pool.execute(`
            SELECT
                pv.id AS variant_id,
                pv.product_id,
                pv.sku,
                pv.stock_quantity,
                p.name AS product_name,
                p.slug AS product_slug,
                s.name AS size_name,
                c.name AS color_name
            FROM product_variants pv
            INNER JOIN products p
                ON pv.product_id = p.id
            LEFT JOIN sizes s
                ON pv.size_id = s.id
            LEFT JOIN colors c
                ON pv.color_id = c.id
            WHERE pv.stock_quantity < 2
            AND pv.active = 1
            ORDER BY pv.stock_quantity ASC, pv.id ASC
            LIMIT 10
        `);

        return res.status(200).json({
            success: true,

            statistics: {
                total_users: Number(userRows[0]?.total || 0),
                total_products: Number(productRows[0]?.total || 0),
                total_orders: Number(orderRows[0]?.total || 0),
                paid_orders: Number(paidOrderRows[0]?.total || 0),
                pending_orders: Number(pendingOrderRows[0]?.total || 0),
                low_stock_variants: Number(
                    lowStockRows[0]?.total || 0
                ),
                total_revenue: Number(
                    revenueRows[0]?.total || 0
                ),
                currency: "INR"
            },

            order_status: orderStatusRows.map((row) => ({
                order_status: row.order_status,
                count: Number(row.count || 0)
            })),

            payment_status: paymentStatusRows.map((row) => ({
                payment_status: row.payment_status,
                count: Number(row.count || 0)
            })),

            recent_orders: recentOrders.map((order) => ({
                ...order,
                total_amount: Number(
                    order.total_amount || 0
                )
            })),

            recent_users: recentUsers.map((user) => ({
                ...user,
                is_active: Boolean(user.is_active),
                status:
                    Number(user.is_active) === 1
                        ? "Active"
                        : "Blocked"
            })),

            sales_overview: salesOverviewRows.map(row => ({
                date: row.date,
                total: Number(row.total || 0)
            })),
            low_stock_products: lowStockProducts.map(
                (product) => ({
                    ...product,
                    stock_quantity: Number(
                        product.stock_quantity || 0
                    )
                })
            )
        });
    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin dashboard"
        });
    }
};

export const getAdminCustomers = async (req, res) => {
    try {
        const [customers] = await pool.execute(`
            SELECT
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at,
                u.is_active,

                COUNT(DISTINCT o.id) AS orders,

                COALESCE(
                    SUM(
                        CASE
                            WHEN o.payment_status = 'paid'
                            THEN o.total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_spent

            FROM users u

            LEFT JOIN orders o
                ON o.user_id = u.id

            WHERE u.role = 'customer'

            GROUP BY
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at,
                u.is_active

            ORDER BY u.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: customers.length,

            customers: customers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,

                orders: Number(
                    customer.orders || 0
                ),

                totalSpent: Number(
                    customer.total_spent || 0
                ),

                registered: customer.created_at,

                is_active:
                    Number(customer.is_active) === 1,

                status:
                    Number(customer.is_active) === 1
                        ? "Active"
                        : "Blocked"
            }))
        });
    } catch (error) {
        console.error("ADMIN CUSTOMERS ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};

export const getAdminCustomerDetails = async (req, res) => {
    try {
        const customerId = Number(req.params.id);

        if (
            !Number.isInteger(customerId) ||
            customerId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const [customerRows] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                phone,
                is_active,
                created_at
            FROM users
            WHERE id = ?
            AND role = 'customer'
            LIMIT 1
            `,
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const customer = customerRows[0];

        const [orderRows] = await pool.execute(
            `
            SELECT
                id,
                order_number,
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
                created_at
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [customerId]
        );

        const totalSpent = orderRows.reduce(
            (total, order) => {
                if (
                    order.payment_status === "paid"
                ) {
                    return (
                        total +
                        Number(
                            order.total_amount || 0
                        )
                    );
                }

                return total;
            },
            0
        );

        const latestOrder =
            orderRows.length > 0
                ? orderRows[0]
                : null;

        const address = latestOrder
            ? {
                  full_name:
                      latestOrder.shipping_name,

                  phone:
                      latestOrder.shipping_phone,

                  email:
                      latestOrder.shipping_email,

                  address_line1:
                      latestOrder.shipping_address_line1,

                  address_line2:
                      latestOrder.shipping_address_line2,

                  city:
                      latestOrder.shipping_city,

                  state:
                      latestOrder.shipping_state,

                  postal_code:
                      latestOrder.shipping_postal_code,

                  country:
                      latestOrder.shipping_country
              }
            : null;

        return res.status(200).json({
            success: true,

            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,

                registered:
                    customer.created_at,

                is_active:
                    Number(customer.is_active) === 1,

                status:
                    Number(customer.is_active) === 1
                        ? "Active"
                        : "Blocked",

                orders: orderRows.length,

                totalSpent
            },

            address,

            orders: orderRows.map((order) => ({
                id: order.id,

                order_number:
                    order.order_number,

                total_amount: Number(
                    order.total_amount || 0
                ),

                currency:
                    order.currency,

                payment_status:
                    order.payment_status,

                order_status:
                    order.order_status,

                created_at:
                    order.created_at
            }))
        });
    } catch (error) {
        console.error(
            "ADMIN CUSTOMER DETAILS ERROR:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch customer details"
        });
    }
};

export const updateAdminCustomerStatus = async (
    req,
    res
) => {
    try {
        const customerId = Number(req.params.id);

        const requestedStatus = String(
            req.body?.status || ""
        )
            .trim()
            .toLowerCase();

        if (
            !Number.isInteger(customerId) ||
            customerId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        if (
            !["active", "blocked"].includes(
                requestedStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be Active or Blocked"
            });
        }

        const isActive =
            requestedStatus === "active"
                ? 1
                : 0;

        const [result] = await pool.execute(
            `
            UPDATE users
            SET is_active = ?
            WHERE id = ?
            AND role = 'customer'
            `,
            [
                isActive,
                customerId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const [rows] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                phone,
                is_active,
                created_at
            FROM users
            WHERE id = ?
            AND role = 'customer'
            LIMIT 1
            `,
            [customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const customer = rows[0];

        return res.status(200).json({
            success: true,

            message:
                isActive === 1
                    ? "Customer activated successfully"
                    : "Customer blocked successfully",

            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,

                registered:
                    customer.created_at,

                is_active:
                    Number(customer.is_active) === 1,

                status:
                    Number(customer.is_active) === 1
                        ? "Active"
                        : "Blocked"
            }
        });
    } catch (error) {
        console.error(
            "ADMIN CUSTOMER STATUS ERROR:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Failed to update customer status"
        });
    }
};

export const deleteAdminCustomer = async (
    req,
    res
) => {
    const connection =
        await pool.getConnection();

    try {
        const customerId = Number(
            req.params.id
        );

        if (
            !Number.isInteger(customerId) ||
            customerId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const [customerRows] =
            await connection.execute(
                `
                SELECT
                    id,
                    name,
                    email
                FROM users
                WHERE id = ?
                AND role = 'customer'
                LIMIT 1
                `,
                [customerId]
            );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        await connection.beginTransaction();

        await connection.execute(
            `
            DELETE wi
            FROM wishlist_items wi
            INNER JOIN wishlists w
                ON wi.wishlist_id = w.id
            WHERE w.user_id = ?
            `,
            [customerId]
        );

        await connection.execute(
            `
            DELETE FROM wishlists
            WHERE user_id = ?
            `,
            [customerId]
        );

        await connection.execute(
            `
            DELETE ci
            FROM cart_items ci
            INNER JOIN carts c
                ON ci.cart_id = c.id
            WHERE c.user_id = ?
            `,
            [customerId]
        );

        await connection.execute(
            `
            DELETE FROM carts
            WHERE user_id = ?
            `,
            [customerId]
        );

        await connection.execute(
            `
            DELETE FROM reviews
            WHERE user_id = ?
            `,
            [customerId]
        );

        await connection.execute(
            `
            DELETE FROM orders
            WHERE user_id = ?
            `,
            [customerId]
        );

        const [deleteResult] =
            await connection.execute(
                `
                DELETE FROM users
                WHERE id = ?
                AND role = 'customer'
                `,
                [customerId]
            );

        if (deleteResult.affectedRows === 0) {
            throw new Error(
                "Customer could not be deleted"
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message:
                "Customer account deleted successfully"
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "CUSTOMER DELETE ROLLBACK ERROR:",
                rollbackError
            );
        }

        console.error(
            "ADMIN CUSTOMER DELETE ERROR:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete customer account"
        });
    } finally {
        connection.release();
    }
};