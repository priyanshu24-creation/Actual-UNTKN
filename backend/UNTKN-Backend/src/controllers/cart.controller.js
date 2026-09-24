import pool from "../config/database.js";

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const [items] = await pool.query(
            `
            SELECT
                ci.id,
                ci.user_id,
                ci.product_id,
                ci.variant_id,
                ci.quantity,
                ci.created_at,
                ci.updated_at,

                p.name,
                p.slug,
                p.base_price,
                p.sale_price,
                p.image_url,
                p.stock_quantity AS product_stock,
                p.active AS product_active,

                pv.id AS variant_db_id,
                pv.sku,
                pv.stock_quantity,
                pv.active AS variant_active,
                pv.size,
                pv.color,
                pv.color_name,
                pv.image_url AS variant_image_url

            FROM cart_items ci

            INNER JOIN products p
                ON p.id = ci.product_id

            LEFT JOIN product_variants pv
                ON pv.id = ci.variant_id

            WHERE ci.user_id = ?

            ORDER BY ci.created_at DESC
            `,
            [userId]
        );

        const formattedItems = items.map((item) => {
            const unitPrice =
                item.sale_price !== null &&
                item.sale_price !== undefined
                    ? Number(item.sale_price)
                    : Number(item.base_price);

            const quantity = Number(item.quantity || 0);

            const itemTotal = unitPrice * quantity;

            return {
                id: item.id,
                cart_item_id: item.id,

                user_id: item.user_id,

                product_id: item.product_id,

                variant_id: item.variant_id,

                quantity,

                name: item.name,

                slug: item.slug,

                price: unitPrice,

                unit_price: unitPrice,

                base_price:
                    item.base_price !== null &&
                    item.base_price !== undefined
                        ? Number(item.base_price)
                        : null,

                sale_price:
                    item.sale_price !== null &&
                    item.sale_price !== undefined
                        ? Number(item.sale_price)
                        : null,

                image_url:
                    item.variant_image_url ||
                    item.image_url ||
                    null,

                sku: item.sku || null,

                size: item.size || null,

                color: item.color || null,

                color_name:
                    item.color_name || null,

                stock_quantity:
                    item.stock_quantity !== null &&
                    item.stock_quantity !== undefined
                        ? Number(item.stock_quantity)
                        : Number(item.product_stock || 0),

                product_stock:
                    Number(item.product_stock || 0),

                product_active:
                    Boolean(item.product_active),

                variant_active:
                    item.variant_id
                        ? Boolean(item.variant_active)
                        : true,

                item_total: itemTotal,

                subtotal: itemTotal,

                created_at: item.created_at,

                updated_at: item.updated_at,
            };
        });

        const subtotal = formattedItems.reduce(
            (sum, item) =>
                sum + Number(item.item_total || 0),
            0
        );

        const totalQuantity = formattedItems.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );

        return res.status(200).json({
            success: true,

            cart: formattedItems,

            items: formattedItems,

            subtotal,

            total: subtotal,

            total_quantity: totalQuantity,

            item_count: formattedItems.length,
        });
    } catch (error) {
        console.error(
            "Get cart error:",
            error
        );

        return res.status(500).json({
            success: false,

            message: "Failed to load cart",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

const addToCart = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;

        const {
            product_id,
            productId,
            variant_id,
            variantId,
            quantity = 1,
        } = req.body;

        const productIdValue =
            product_id || productId;

        const variantIdValue =
            variant_id ||
            variantId ||
            null;

        const quantityValue =
            Number(quantity);

        if (!productIdValue) {
            return res.status(400).json({
                success: false,
                message:
                    "Product ID is required",
            });
        }

        if (
            !Number.isInteger(quantityValue) ||
            quantityValue <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive integer",
            });
        }

        await connection.beginTransaction();

        const [products] =
            await connection.query(
                `
                SELECT
                    id,
                    name,
                    base_price,
                    sale_price,
                    stock_quantity,
                    active
                FROM products
                WHERE id = ?
                LIMIT 1
                `,
                [productIdValue]
            );

        if (!products.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Product not found",
            });
        }

        const product = products[0];

        if (!product.active) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Product is currently unavailable",
            });
        }

        let availableStock =
            Number(
                product.stock_quantity || 0
            );

        if (variantIdValue) {
            const [variants] =
                await connection.query(
                    `
                    SELECT
                        id,
                        product_id,
                        stock_quantity,
                        active
                    FROM product_variants
                    WHERE id = ?
                        AND product_id = ?
                    LIMIT 1
                    `,
                    [
                        variantIdValue,
                        productIdValue,
                    ]
                );

            if (!variants.length) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message:
                        "Product variant not found",
                });
            }

            const variant = variants[0];

            if (!variant.active) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Selected variant is unavailable",
                });
            }

            availableStock =
                Number(
                    variant.stock_quantity || 0
                );
        }

        const [existingItems] =
            await connection.query(
                `
                SELECT
                    id,
                    quantity
                FROM cart_items
                WHERE user_id = ?
                    AND product_id = ?
                    AND (
                        variant_id = ?
                        OR (
                            variant_id IS NULL
                            AND ? IS NULL
                        )
                    )
                LIMIT 1
                `,
                [
                    userId,
                    productIdValue,
                    variantIdValue,
                    variantIdValue,
                ]
            );

        const existingQuantity =
            existingItems.length
                ? Number(
                      existingItems[0]
                          .quantity || 0
                  )
                : 0;

        const newQuantity =
            existingQuantity +
            quantityValue;

        if (
            availableStock > 0 &&
            newQuantity > availableStock
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `Only ${availableStock} item(s) available`,
            });
        }

        if (existingItems.length) {
            await connection.query(
                `
                UPDATE cart_items
                SET
                    quantity = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [
                    newQuantity,
                    existingItems[0].id,
                ]
            );
        } else {
            await connection.query(
                `
                INSERT INTO cart_items (
                    user_id,
                    product_id,
                    variant_id,
                    quantity,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
                `,
                [
                    userId,
                    productIdValue,
                    variantIdValue,
                    quantityValue,
                ]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,

            message:
                "Product added to cart",
        });
    } catch (error) {
        await connection.rollback();

        console.error(
            "Add to cart error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to add product to cart",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    } finally {
        connection.release();
    }
};

const updateCartItem = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;

        const itemId =
            req.params.id ||
            req.params.itemId;

        const {
            quantity,
        } = req.body;

        const quantityValue =
            Number(quantity);

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message:
                    "Cart item ID is required",
            });
        }

        if (
            !Number.isInteger(quantityValue) ||
            quantityValue <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive integer",
            });
        }

        await connection.beginTransaction();

        const [items] =
            await connection.query(
                `
                SELECT
                    ci.id,
                    ci.product_id,
                    ci.variant_id,
                    p.stock_quantity AS product_stock,
                    pv.stock_quantity AS variant_stock

                FROM cart_items ci

                INNER JOIN products p
                    ON p.id = ci.product_id

                LEFT JOIN product_variants pv
                    ON pv.id = ci.variant_id

                WHERE ci.id = ?
                    AND ci.user_id = ?

                LIMIT 1
                `,
                [
                    itemId,
                    userId,
                ]
            );

        if (!items.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Cart item not found",
            });
        }

        const item = items[0];

        const availableStock =
            item.variant_id
                ? Number(
                      item.variant_stock || 0
                  )
                : Number(
                      item.product_stock || 0
                  );

        if (
            availableStock > 0 &&
            quantityValue > availableStock
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `Only ${availableStock} item(s) available`,
            });
        }

        await connection.query(
            `
            UPDATE cart_items
            SET
                quantity = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
                AND user_id = ?
            `,
            [
                quantityValue,
                itemId,
                userId,
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,

            message:
                "Cart updated successfully",
        });
    } catch (error) {
        await connection.rollback();

        console.error(
            "Update cart item error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to update cart item",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    } finally {
        connection.release();
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const itemId =
            req.params.id ||
            req.params.itemId;

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message:
                    "Cart item ID is required",
            });
        }

        const [result] =
            await pool.query(
                `
                DELETE FROM cart_items
                WHERE id = ?
                    AND user_id = ?
                `,
                [
                    itemId,
                    userId,
                ]
            );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Cart item not found",
            });
        }

        return res.status(200).json({
            success: true,

            message:
                "Item removed from cart",
        });
    } catch (error) {
        console.error(
            "Remove cart item error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to remove cart item",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `
            DELETE FROM cart_items
            WHERE user_id = ?
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,

            message:
                "Cart cleared successfully",
        });
    } catch (error) {
        console.error(
            "Clear cart error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to clear cart",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};