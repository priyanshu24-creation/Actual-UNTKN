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
            [lowStockRows]
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
                WHERE stock_quantity <= 5
                AND active = 1
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
            WHERE pv.stock_quantity <= 5
            AND pv.active = 1
            ORDER BY pv.stock_quantity ASC, pv.id ASC
            LIMIT 10
        `);

        return res.status(200).json({
            success: true,

            statistics: {
                total_users: Number(userRows[0].total),
                total_products: Number(productRows[0].total),
                total_orders: Number(orderRows[0].total),
                paid_orders: Number(paidOrderRows[0].total),
                pending_orders: Number(pendingOrderRows[0].total),
                low_stock_variants: Number(
                    lowStockRows[0].total
                ),
                total_revenue: Number(
                    revenueRows[0].total
                ),
                currency: "INR"
            },

            order_status: orderStatusRows.map((row) => ({
                order_status: row.order_status,
                count: Number(row.count)
            })),

            payment_status: paymentStatusRows.map((row) => ({
                payment_status: row.payment_status,
                count: Number(row.count)
            })),

            recent_orders: recentOrders.map((order) => ({
                ...order,
                total_amount: Number(order.total_amount)
            })),

            recent_users: recentUsers,

            low_stock_products: lowStockProducts.map(
                (product) => ({
                    ...product,
                    stock_quantity: Number(
                        product.stock_quantity
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
                u.created_at

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

                status: "Active"
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

        const [customerRows] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                phone,
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
                      latestOrder.shipping_name ||
                      customer.name ||
                      "",

                  phone:
                      latestOrder.shipping_phone ||
                      customer.phone ||
                      "",

                  address_line1:
                      latestOrder.shipping_address_line1 ||
                      "",

                  address_line2:
                      latestOrder.shipping_address_line2 ||
                      "",

                  city:
                      latestOrder.shipping_city ||
                      "",

                  state:
                      latestOrder.shipping_state ||
                      "",

                  postal_code:
                      latestOrder.shipping_postal_code ||
                      "",

                  country:
                      latestOrder.shipping_country ||
                      ""
              }
            : null;

        return res.status(200).json({
            success: true,

            customer: {
                id: customer.id,

                name:
                    customer.name,

                email:
                    customer.email,

                phone:
                    customer.phone,

                registered:
                    customer.created_at,

                status:
                    "Active",

                orders:
                    orderRows.length,

                totalSpent:
                    Number(totalSpent)
            },

            address,

            orders: orderRows.map((order) => ({
                id:
                    order.id,

                order_number:
                    order.order_number,

                total_amount:
                    Number(
                        order.total_amount || 0
                    ),

                currency:
                    order.currency,

                payment_status:
                    order.payment_status,

                order_status:
                    order.order_status,

                shipping_name:
                    order.shipping_name,

                shipping_phone:
                    order.shipping_phone,

                shipping_email:
                    order.shipping_email,

                shipping_address_line1:
                    order.shipping_address_line1,

                shipping_address_line2:
                    order.shipping_address_line2,

                shipping_city:
                    order.shipping_city,

                shipping_state:
                    order.shipping_state,

                shipping_postal_code:
                    order.shipping_postal_code,

                shipping_country:
                    order.shipping_country,

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