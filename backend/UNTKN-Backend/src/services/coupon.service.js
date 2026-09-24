import pool from "../config/database.js";

const roundMoney = (value) =>
    Number(Number(value || 0).toFixed(2));

export const ensureCouponSchema = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS coupons (
            id INT NOT NULL AUTO_INCREMENT,
            code VARCHAR(100) NOT NULL,
            discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
            discount_value DECIMAL(10,2) NOT NULL,
            min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            max_discount_amount DECIMAL(10,2) NULL,
            starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NULL,
            usage_limit INT NULL,
            usage_count INT NOT NULL DEFAULT 0,
            per_user_limit INT NOT NULL DEFAULT 1,
            first_order_only TINYINT(1) NOT NULL DEFAULT 0,
            scope_type ENUM('all', 'category', 'collection') NOT NULL DEFAULT 'all',
            scope_id INT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_by INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_coupons_code (code),
            KEY idx_coupons_active_dates (is_active, starts_at, expires_at),
            KEY idx_coupons_scope (scope_type, scope_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS coupon_usages (
            id INT NOT NULL AUTO_INCREMENT,
            coupon_id INT NOT NULL,
            user_id INT NOT NULL,
            order_id INT NULL,
            discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_coupon_user_order (coupon_id, user_id, order_id),
            KEY idx_coupon_usages_user (coupon_id, user_id),
            KEY idx_coupon_usages_order (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [columns] = await pool.execute(`
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'coupon_code'
    `);

    if (Number(columns[0]?.count || 0) === 0) {
        await pool.execute(`
            ALTER TABLE orders
            ADD COLUMN coupon_code VARCHAR(100) NULL
        `);
    }
};

const getNow = () => new Date();

const normalizeCode = (value) =>
    String(value || "")
        .trim()
        .toUpperCase();

const isValidDate = (value) =>
    value instanceof Date && !Number.isNaN(value.getTime());

const getEligibleSubtotal = (coupon, items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    if (coupon.scope_type === "all") {
        return roundMoney(
            items.reduce(
                (sum, item) =>
                    sum +
                    Number(item.unit_price || 0) *
                        Number(item.quantity || 0),
                0
            )
        );
    }

    return roundMoney(
        items.reduce((sum, item) => {
            const matches =
                coupon.scope_type === "category"
                    ? Number(item.category_id) === Number(coupon.scope_id)
                    : Number(item.collection_id) === Number(coupon.scope_id);

            if (!matches) {
                return sum;
            }

            return (
                sum +
                Number(item.unit_price || 0) *
                    Number(item.quantity || 0)
            );
        }, 0)
    );
};

const calculateDiscount = (coupon, eligibleSubtotal) => {
    if (eligibleSubtotal <= 0) {
        return 0;
    }

    let discount;

    if (coupon.discount_type === "percentage") {
        discount =
            eligibleSubtotal *
            (Number(coupon.discount_value) / 100);

        if (
            coupon.max_discount_amount !== null &&
            coupon.max_discount_amount !== undefined
        ) {
            discount = Math.min(
                discount,
                Number(coupon.max_discount_amount)
            );
        }
    } else {
        discount = Number(coupon.discount_value);
    }

    return roundMoney(
        Math.min(discount, eligibleSubtotal)
    );
};

export const validateCoupon = async ({
    connection = pool,
    code,
    userId = null,
    subtotal,
    items = [],
    forOrder = false
}) => {
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) {
        throw new Error("Coupon code is required");
    }

    const numericSubtotal = roundMoney(subtotal);

    const [rows] = await connection.execute(
        `
            SELECT
                id,
                code,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount_amount,
                starts_at,
                expires_at,
                usage_limit,
                usage_count,
                per_user_limit,
                first_order_only,
                scope_type,
                scope_id,
                is_active
            FROM coupons
            WHERE code = ?
            LIMIT 1
        `,
        [normalizedCode]
    );

    if (rows.length === 0) {
        throw new Error("Invalid coupon code");
    }

    const coupon = rows[0];
    const now = getNow();

    if (!Number(coupon.is_active)) {
        throw new Error("This coupon is currently unavailable");
    }

    const startsAt = new Date(coupon.starts_at);
    const expiresAt = coupon.expires_at
        ? new Date(coupon.expires_at)
        : null;

    if (
        isValidDate(startsAt) &&
        now < startsAt
    ) {
        throw new Error(
            `This coupon starts on ${startsAt.toLocaleString("en-IN")}`
        );
    }

    if (
        expiresAt &&
        isValidDate(expiresAt) &&
        now > expiresAt
    ) {
        throw new Error("This coupon has expired");
    }

    if (
        coupon.usage_limit !== null &&
        Number(coupon.usage_count) >=
            Number(coupon.usage_limit)
    ) {
        throw new Error("This coupon has reached its usage limit");
    }

    if (
        numericSubtotal <
        Number(coupon.min_order_amount || 0)
    ) {
        throw new Error(
            `Minimum order value for this coupon is ₹${Number(
                coupon.min_order_amount
            ).toLocaleString("en-IN")}`
        );
    }

    if (userId) {
        if (Number(coupon.per_user_limit) > 0) {
            const [usageRows] = await connection.execute(
                `
                    SELECT COUNT(*) AS count
                    FROM coupon_usages
                    WHERE coupon_id = ?
                    AND user_id = ?
                `,
                [coupon.id, userId]
            );

            if (
                Number(usageRows[0]?.count || 0) >=
                Number(coupon.per_user_limit)
            ) {
                throw new Error(
                    "You have already used this coupon the maximum allowed number of times"
                );
            }
        }

        if (Number(coupon.first_order_only)) {
            const [orderRows] = await connection.execute(
                `
                    SELECT COUNT(*) AS count
                    FROM orders
                    WHERE user_id = ?
                    AND order_status <> 'cancelled'
                `,
                [userId]
            );

            if (Number(orderRows[0]?.count || 0) > 0) {
                throw new Error(
                    "This coupon is available for your first order only"
                );
            }
        }
    }

    const eligibleSubtotal = getEligibleSubtotal(
        coupon,
        items
    );

    if (eligibleSubtotal <= 0) {
        throw new Error(
            "This coupon does not apply to the items in your bag"
        );
    }

    const discount = calculateDiscount(
        coupon,
        eligibleSubtotal
    );

    if (discount <= 0) {
        throw new Error("This coupon does not provide a discount for this order");
    }

    return {
        coupon,
        code: coupon.code,
        discount,
        eligibleSubtotal,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
        minOrderAmount: Number(coupon.min_order_amount || 0),
        maxDiscountAmount:
            coupon.max_discount_amount === null
                ? null
                : Number(coupon.max_discount_amount),
        startsAt: coupon.starts_at,
        expiresAt: coupon.expires_at,
        scopeType: coupon.scope_type,
        scopeId: coupon.scope_id,
        forOrder
    };
};

export const normalizeCouponCode = normalizeCode;
export const calculateCouponDiscount = calculateDiscount;
export const getCouponEligibleSubtotal = getEligibleSubtotal;
