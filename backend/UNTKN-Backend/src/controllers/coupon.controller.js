import pool from "../config/database.js";
import {
    calculateCouponDiscount,
    getCouponEligibleSubtotal,
    normalizeCouponCode,
    validateCoupon
} from "../services/coupon.service.js";

const normalizeDateForMySQL = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const pad = (number) =>
        String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
        date.getMonth() + 1
    )}-${pad(date.getDate())} ${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
    )}`;
};

const validateAdminPayload = (body) => {
    const {
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        starts_at,
        expires_at,
        usage_limit,
        per_user_limit,
        first_order_only,
        scope_type,
        scope_id,
        is_active
    } = body;

    const normalizedCode = normalizeCouponCode(code);

    if (!normalizedCode) {
        throw new Error("Coupon code is required");
    }

    if (!/^[A-Z0-9][A-Z0-9_-]{2,49}$/.test(normalizedCode)) {
        throw new Error(
            "Coupon code must be 3–50 characters and contain only letters, numbers, hyphens or underscores"
        );
    }

    if (
        !["percentage", "fixed"].includes(
            discount_type
        )
    ) {
        throw new Error(
            "Discount type must be percentage or fixed"
        );
    }

    const discountValue = Number(
        discount_value
    );

    if (
        !Number.isFinite(discountValue) ||
        discountValue <= 0
    ) {
        throw new Error(
            "Discount value must be greater than 0"
        );
    }

    if (
        discount_type === "percentage" &&
        discountValue > 100
    ) {
        throw new Error(
            "Percentage discount cannot exceed 100%"
        );
    }

    const minimumOrder =
        min_order_amount === undefined ||
        min_order_amount === ""
            ? 0
            : Number(min_order_amount);

    if (
        !Number.isFinite(minimumOrder) ||
        minimumOrder < 0
    ) {
        throw new Error(
            "Minimum order amount must be a valid non-negative number"
        );
    }

    const maxDiscount =
        max_discount_amount === undefined ||
        max_discount_amount === "" ||
        max_discount_amount === null
            ? null
            : Number(max_discount_amount);

    if (
        maxDiscount !== null &&
        (
            !Number.isFinite(maxDiscount) ||
            maxDiscount <= 0
        )
    ) {
        throw new Error(
            "Maximum discount must be greater than 0 when provided"
        );
    }

    if (
        discount_type === "fixed" &&
        maxDiscount !== null
    ) {
        throw new Error(
            "Maximum discount is only needed for percentage coupons"
        );
    }

    const startsAt =
        starts_at
            ? normalizeDateForMySQL(starts_at)
            : normalizeDateForMySQL(new Date());

    if (!startsAt) {
        throw new Error("Invalid coupon start date");
    }

    const expiresAt =
        expires_at
            ? normalizeDateForMySQL(expires_at)
            : null;

    if (
        expires_at &&
        !expiresAt
    ) {
        throw new Error("Invalid coupon expiry date");
    }

    if (
        expiresAt &&
        new Date(expiresAt).getTime() <=
            new Date(startsAt).getTime()
    ) {
        throw new Error(
            "Expiry date must be later than the start date"
        );
    }

    const usageLimit =
        usage_limit === undefined ||
        usage_limit === "" ||
        usage_limit === null
            ? null
            : Number(usage_limit);

    if (
        usageLimit !== null &&
        (
            !Number.isInteger(usageLimit) ||
            usageLimit <= 0
        )
    ) {
        throw new Error(
            "Usage limit must be a positive whole number"
        );
    }

    const perUserLimit =
        per_user_limit === undefined ||
        per_user_limit === "" ||
        per_user_limit === null
            ? 1
            : Number(per_user_limit);

    if (
        !Number.isInteger(perUserLimit) ||
        perUserLimit <= 0
    ) {
        throw new Error(
            "Per-user limit must be a positive whole number"
        );
    }

    const cleanScope =
        scope_type || "all";

    if (
        !["all", "category", "collection"].includes(
            cleanScope
        )
    ) {
        throw new Error(
            "Invalid coupon scope"
        );
    }

    let scopeId = null;

    if (cleanScope !== "all") {
        scopeId = Number(scope_id);

        if (
            !Number.isInteger(scopeId) ||
            scopeId <= 0
        ) {
            throw new Error(
                "A valid category or collection must be selected"
            );
        }
    }

    return {
        code: normalizedCode,
        discountType: discount_type,
        discountValue,
        minimumOrder,
        maxDiscount,
        startsAt,
        expiresAt,
        usageLimit,
        perUserLimit,
        firstOrderOnly:
            Boolean(first_order_only),
        scopeType: cleanScope,
        scopeId,
        isActive:
            is_active === undefined
                ? true
                : Boolean(is_active)
    };
};

const getStatus = (coupon) => {
    const now = Date.now();
    const startsAt = new Date(
        coupon.starts_at
    ).getTime();
    const expiresAt = coupon.expires_at
        ? new Date(
              coupon.expires_at
          ).getTime()
        : null;

    if (!Number(coupon.is_active)) {
        return "paused";
    }

    if (
        Number.isFinite(startsAt) &&
        now < startsAt
    ) {
        return "scheduled";
    }

    if (
        expiresAt &&
        Number.isFinite(expiresAt) &&
        now > expiresAt
    ) {
        return "expired";
    }

    if (
        coupon.usage_limit !== null &&
        Number(coupon.usage_count) >=
            Number(coupon.usage_limit)
    ) {
        return "exhausted";
    }

    return "active";
};

const formatCoupon = (coupon) => ({
    ...coupon,
    discount_value:
        Number(coupon.discount_value),
    min_order_amount:
        Number(coupon.min_order_amount || 0),
    max_discount_amount:
        coupon.max_discount_amount === null
            ? null
            : Number(coupon.max_discount_amount),
    usage_limit:
        coupon.usage_limit === null
            ? null
            : Number(coupon.usage_limit),
    usage_count:
        Number(coupon.usage_count || 0),
    per_user_limit:
        Number(coupon.per_user_limit || 1),
    first_order_only:
        Boolean(coupon.first_order_only),
    is_active:
        Boolean(coupon.is_active),
    status:
        getStatus(coupon)
});

export const getAdminCoupons = async (
    req,
    res
) => {
    try {
        const [rows] = await pool.execute(`
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
                is_active,
                created_at,
                updated_at
            FROM coupons
            ORDER BY
                CASE
                    WHEN is_active = 1
                    AND starts_at <= NOW()
                    AND (
                        expires_at IS NULL
                        OR expires_at >= NOW()
                    )
                    THEN 0
                    WHEN is_active = 1
                    AND starts_at > NOW()
                    THEN 1
                    ELSE 2
                END,
                created_at DESC
        `);

        return res.status(200).json({
            success: true,
            coupons: rows.map(formatCoupon)
        });
    } catch (error) {
        console.error(
            "Get admin coupons error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load coupons"
        });
    }
};

export const getActiveCoupons = async (
    req,
    res
) => {
    try {
        const [rows] = await pool.execute(`
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
                scope_id
            FROM coupons
            WHERE is_active = 1
            AND starts_at <= NOW()
            AND (
                expires_at IS NULL
                OR expires_at >= NOW()
            )
            AND (
                usage_limit IS NULL
                OR usage_count < usage_limit
            )
            ORDER BY created_at DESC
        `);

        return res.status(200).json({
            success: true,
            coupons: rows.map(formatCoupon)
        });
    } catch (error) {
        console.error(
            "Get active coupons error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load active coupons"
        });
    }
};

export const createCoupon = async (
    req,
    res
) => {
    try {
        const data =
            validateAdminPayload(req.body);

        if (
            data.scopeType === "category"
        ) {
            const [rows] =
                await pool.execute(
                    `
                    SELECT id
                    FROM categories
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [data.scopeId]
                );

            if (!rows.length) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected category does not exist"
                });
            }
        }

        if (
            data.scopeType === "collection"
        ) {
            const [rows] =
                await pool.execute(
                    `
                    SELECT id
                    FROM collections
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [data.scopeId]
                );

            if (!rows.length) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected collection does not exist"
                });
            }
        }

        const [existing] =
            await pool.execute(
                `
                SELECT id
                FROM coupons
                WHERE code = ?
                LIMIT 1
                `,
                [data.code]
            );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message:
                    "A coupon with this code already exists"
            });
        }

        const [result] =
            await pool.execute(
                `
                INSERT INTO coupons (
                    code,
                    discount_type,
                    discount_value,
                    min_order_amount,
                    max_discount_amount,
                    starts_at,
                    expires_at,
                    usage_limit,
                    per_user_limit,
                    first_order_only,
                    scope_type,
                    scope_id,
                    is_active,
                    created_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    data.code,
                    data.discountType,
                    data.discountValue,
                    data.minimumOrder,
                    data.maxDiscount,
                    data.startsAt,
                    data.expiresAt,
                    data.usageLimit,
                    data.perUserLimit,
                    data.firstOrderOnly ? 1 : 0,
                    data.scopeType,
                    data.scopeId,
                    data.isActive ? 1 : 0,
                    req.user?.id || null
                ]
            );

        const [rows] =
            await pool.execute(
                `
                SELECT *
                FROM coupons
                WHERE id = ?
                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message:
                "Coupon created successfully",
            coupon:
                formatCoupon(rows[0])
        });
    } catch (error) {
        console.error(
            "Create coupon error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to create coupon"
        });
    }
};

export const updateCoupon = async (
    req,
    res
) => {
    try {
        const couponId =
            Number(req.params.id);

        if (
            !Number.isInteger(couponId) ||
            couponId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid coupon ID"
            });
        }

        const [existing] =
            await pool.execute(
                `
                SELECT *
                FROM coupons
                WHERE id = ?
                LIMIT 1
                `,
                [couponId]
            );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Coupon not found"
            });
        }

        const data =
            validateAdminPayload(req.body);

        const [duplicate] =
            await pool.execute(
                `
                SELECT id
                FROM coupons
                WHERE code = ?
                AND id <> ?
                LIMIT 1
                `,
                [data.code, couponId]
            );

        if (duplicate.length) {
            return res.status(409).json({
                success: false,
                message:
                    "Another coupon already uses this code"
            });
        }

        if (
            data.scopeType === "category"
        ) {
            const [rows] =
                await pool.execute(
                    `
                    SELECT id
                    FROM categories
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [data.scopeId]
                );

            if (!rows.length) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected category does not exist"
                });
            }
        }

        if (
            data.scopeType === "collection"
        ) {
            const [rows] =
                await pool.execute(
                    `
                    SELECT id
                    FROM collections
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [data.scopeId]
                );

            if (!rows.length) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected collection does not exist"
                });
            }
        }

        await pool.execute(
            `
            UPDATE coupons
            SET
                code = ?,
                discount_type = ?,
                discount_value = ?,
                min_order_amount = ?,
                max_discount_amount = ?,
                starts_at = ?,
                expires_at = ?,
                usage_limit = ?,
                per_user_limit = ?,
                first_order_only = ?,
                scope_type = ?,
                scope_id = ?,
                is_active = ?
            WHERE id = ?
            `,
            [
                data.code,
                data.discountType,
                data.discountValue,
                data.minimumOrder,
                data.maxDiscount,
                data.startsAt,
                data.expiresAt,
                data.usageLimit,
                data.perUserLimit,
                data.firstOrderOnly ? 1 : 0,
                data.scopeType,
                data.scopeId,
                data.isActive ? 1 : 0,
                couponId
            ]
        );

        const [rows] =
            await pool.execute(
                `
                SELECT *
                FROM coupons
                WHERE id = ?
                LIMIT 1
                `,
                [couponId]
            );

        return res.status(200).json({
            success: true,
            message:
                "Coupon updated successfully",
            coupon:
                formatCoupon(rows[0])
        });
    } catch (error) {
        console.error(
            "Update coupon error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to update coupon"
        });
    }
};

export const toggleCoupon = async (
    req,
    res
) => {
    try {
        const couponId =
            Number(req.params.id);

        if (
            !Number.isInteger(couponId) ||
            couponId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid coupon ID"
            });
        }

        const [result] =
            await pool.execute(
                `
                UPDATE coupons
                SET is_active =
                    CASE
                        WHEN is_active = 1
                        THEN 0
                        ELSE 1
                    END
                WHERE id = ?
                `,
                [couponId]
            );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Coupon not found"
            });
        }

        const [rows] =
            await pool.execute(
                `
                SELECT *
                FROM coupons
                WHERE id = ?
                `,
                [couponId]
            );

        return res.status(200).json({
            success: true,
            message:
                "Coupon status updated",
            coupon:
                formatCoupon(rows[0])
        });
    } catch (error) {
        console.error(
            "Toggle coupon error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update coupon status"
        });
    }
};

export const deleteCoupon = async (
    req,
    res
) => {
    try {
        const couponId =
            Number(req.params.id);

        if (
            !Number.isInteger(couponId) ||
            couponId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid coupon ID"
            });
        }

        const [usageRows] =
            await pool.execute(
                `
                SELECT COUNT(*) AS count
                FROM coupon_usages
                WHERE coupon_id = ?
                `,
                [couponId]
            );

        if (Number(usageRows[0]?.count || 0) > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This coupon has already been used and cannot be deleted. Pause it instead."
            });
        }

        const [result] =
            await pool.execute(
                `
                DELETE FROM coupons
                WHERE id = ?
                `,
                [couponId]
            );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Coupon not found"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Coupon deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete coupon error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete coupon"
        });
    }
};

export const validateCustomerCoupon = async (
    req,
    res
) => {
    try {
        const {
            code,
            subtotal,
            items = []
        } = req.body;

        const result =
            await validateCoupon({
                connection: pool,
                code,
                userId: req.user.id,
                subtotal,
                items
            });

        return res.status(200).json({
            success: true,
            message:
                "Coupon applied successfully",
            coupon: {
                code: result.code,
                discount: result.discount,
                eligibleSubtotal:
                    result.eligibleSubtotal,
                discountType:
                    result.discountType,
                discountValue:
                    result.discountValue,
                expiresAt:
                    result.expiresAt
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Invalid coupon"
        });
    }
};

export const getPublicCoupons = async (
    req,
    res
) => {
    try {
        const [rows] =
            await pool.execute(
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
                    scope_type,
                    scope_id
                FROM coupons
                WHERE is_active = 1
                AND starts_at <= NOW()
                AND (
                    expires_at IS NULL
                    OR expires_at >= NOW()
                )
                AND (
                    usage_limit IS NULL
                    OR usage_count < usage_limit
                )
                ORDER BY created_at DESC
                `
            );

        return res.status(200).json({
            success: true,
            coupons: rows.map(formatCoupon)
        });
    } catch (error) {
        console.error(
            "Get public coupons error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load coupons"
        });
    }
};
