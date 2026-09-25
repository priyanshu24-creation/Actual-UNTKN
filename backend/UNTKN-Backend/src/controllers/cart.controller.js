import pool from "../config/database.js";

const getOrCreateCart = async (userId, db = pool) => {
    const [existing] = await db.execute(
        `
        SELECT id
        FROM carts
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    const [result] = await db.execute(
        `
        INSERT INTO carts (user_id)
        VALUES (?)
        `,
        [userId]
    );

    return result.insertId;
};


export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartId = await getOrCreateCart(userId);

        const [items] = await pool.execute(
            `
            SELECT
                ci.id,
                ci.product_id,
                ci.variant_id,
                ci.quantity,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.sale_price,
                p.currency,
                p.category_id,
                p.collection_id,

                pi.image_url,

                pv.sku,
                pv.price AS variant_price,
                pv.stock_quantity AS variant_stock,
                pv.active AS variant_active,

                s.name AS size_name,

                c.name AS color_name,
                c.hex_code

            FROM cart_items ci

            INNER JOIN carts cart
                ON ci.cart_id = cart.id

            INNER JOIN products p
                ON ci.product_id = p.id

            LEFT JOIN product_variants pv
                ON ci.variant_id = pv.id

            LEFT JOIN sizes s
                ON pv.size_id = s.id

            LEFT JOIN colors c
                ON pv.color_id = c.id

            LEFT JOIN product_images pi
                ON pi.id = (
                    SELECT pi2.id
                    FROM product_images pi2
                    WHERE pi2.product_id = p.id
                      AND pi2.image_url IS NOT NULL
                      AND LOWER(pi2.image_url) NOT LIKE '%example.com%'
                    ORDER BY
                        pi2.is_primary DESC,
                        pi2.sort_order ASC,
                        pi2.id ASC
                    LIMIT 1
                )

            WHERE cart.user_id = ?

            ORDER BY ci.created_at DESC
            `,
            [userId]
        );

        let subtotal = 0;

        const formattedItems = items.map((item) => {

            const unitPrice =
                item.sale_price !== null &&
                item.sale_price !== undefined
                    ? Number(item.sale_price)
                    : Number(item.base_price);

            const quantity = Number(item.quantity || 0);

            const totalPrice =
                unitPrice * quantity;

            subtotal += totalPrice;

            return {
                id: item.id,

                product_id:
                    item.product_id,

                variant_id:
                    item.variant_id,

                product_name:
                    item.product_name,

                product_slug:
                    item.product_slug,

                category_id:
                    item.category_id,

                collection_id:
                    item.collection_id,

                image_url:
                    item.image_url || "",

                sku:
                    item.sku || "",

                size:
                    item.size_name || "",

                color:
                    item.color_name || "",

                hex_code:
                    item.hex_code || "",

                quantity,

                stock_quantity:
                    item.variant_stock !== null
                        ? Number(item.variant_stock)
                        : null,

                variant_active:
                    item.variant_id !== null
                        ? Boolean(item.variant_active)
                        : true,

                unit_price:
                    unitPrice,

                total_price:
                    totalPrice,

                currency:
                    item.currency || "INR"
            };
        });

        return res.status(200).json({
            success: true,

            cart: {
                id: cartId,

                items:
                    formattedItems,

                item_count:
                    formattedItems.reduce(
                        (total, item) =>
                            total +
                            Number(item.quantity || 0),
                        0
                    ),

                subtotal
            }
        });

    } catch (error) {

        console.error(
            "Get cart error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch cart"
        });
    }
};


export const addToCart = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const userId =
            req.user.id;

        const {
            product_id,
            variant_id,
            quantity
        } = req.body;

        const productId =
            Number(product_id);

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid product ID is required"
            });
        }

        const requestedQuantity =
            quantity === undefined
                ? 1
                : Number(quantity);

        if (
            !Number.isInteger(
                requestedQuantity
            ) ||
            requestedQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive integer"
            });
        }

        let variantId = null;

        if (
            variant_id !== undefined &&
            variant_id !== null &&
            variant_id !== ""
        ) {

            variantId =
                Number(variant_id);

            if (
                !Number.isInteger(
                    variantId
                ) ||
                variantId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product variant"
                });
            }
        }

        await connection.beginTransaction();


        /*
         * Product table does NOT contain
         * stock_quantity.
         *
         * Stock is handled by product_variants.
         */

        const [products] =
            await connection.execute(
                `
                SELECT
                    id,
                    name,
                    sale_price,
                    base_price,
                    published
                FROM products
                WHERE id = ?
                LIMIT 1
                `,
                [productId]
            );

        if (products.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Product not found"
            });
        }

        const product =
            products[0];

        if (!product.published) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Product is currently unavailable"
            });
        }


        let variant = null;

        if (variantId !== null) {

            const [variants] =
                await connection.execute(
                    `
                    SELECT
                        id,
                        product_id,
                        sku,
                        price,
                        stock_quantity,
                        active
                    FROM product_variants
                    WHERE id = ?
                    AND product_id = ?
                    LIMIT 1
                    `,
                    [
                        variantId,
                        productId
                    ]
                );

            if (variants.length === 0) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product variant"
                });
            }

            variant =
                variants[0];

            if (!variant.active) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "This product variant is unavailable"
                });
            }

            const stockQuantity =
                Number(
                    variant.stock_quantity || 0
                );

            if (
                stockQuantity <
                requestedQuantity
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient stock"
                });
            }
        }


        const cartId =
            await getOrCreateCart(
                userId,
                connection
            );


        const [existingItems] =
            await connection.execute(
                `
                SELECT
                    id,
                    quantity

                FROM cart_items

                WHERE cart_id = ?
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
                    cartId,
                    productId,
                    variantId,
                    variantId
                ]
            );


        if (
            existingItems.length > 0
        ) {

            const existingItem =
                existingItems[0];

            const existingQuantity =
                Number(
                    existingItem.quantity
                );

            const newQuantity =
                existingQuantity +
                requestedQuantity;


            if (variant) {

                const stockQuantity =
                    Number(
                        variant.stock_quantity || 0
                    );

                if (
                    newQuantity >
                    stockQuantity
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message:
                            `Only ${stockQuantity} item(s) available`
                    });
                }
            }


            await connection.execute(
                `
                UPDATE cart_items

                SET
                    quantity = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
                `,
                [
                    newQuantity,
                    existingItem.id
                ]
            );

            await connection.commit();

            return res.status(200).json({
                success: true,
                message:
                    "Cart quantity updated successfully",
                item_id:
                    existingItem.id,
                quantity:
                    newQuantity
            });
        }


        await connection.execute(
            `
            INSERT INTO cart_items
            (
                cart_id,
                product_id,
                variant_id,
                quantity
            )

            VALUES (?, ?, ?, ?)
            `,
            [
                cartId,
                productId,
                variantId,
                requestedQuantity
            ]
        );


        await connection.commit();

        return res.status(201).json({
            success: true,
            message:
                "Product added to cart",
            quantity:
                requestedQuantity
        });

    } catch (error) {

        try {
            await connection.rollback();
        } catch {}

        console.error(
            "Add to cart error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to add product to cart"
        });

    } finally {

        connection.release();
    }
};


export const updateCartItem = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;

        const { itemId } =
            req.params;

        const {
            quantity
        } = req.body;

        const newQuantity =
            Number(quantity);

        if (
            !Number.isInteger(
                newQuantity
            ) ||
            newQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive integer"
            });
        }


        const [items] =
            await pool.execute(
                `
                SELECT
                    ci.id,
                    ci.quantity,
                    ci.variant_id,
                    pv.stock_quantity

                FROM cart_items ci

                INNER JOIN carts cart
                    ON ci.cart_id = cart.id

                LEFT JOIN product_variants pv
                    ON ci.variant_id = pv.id

                WHERE ci.id = ?
                AND cart.user_id = ?

                LIMIT 1
                `,
                [
                    itemId,
                    userId
                ]
            );


        if (items.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Cart item not found"
            });
        }


        const item =
            items[0];


        if (
            item.variant_id !== null
        ) {

            const stockQuantity =
                Number(
                    item.stock_quantity || 0
                );

            if (
                newQuantity >
                stockQuantity
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${stockQuantity} item(s) available`
                });
            }
        }


        await pool.execute(
            `
            UPDATE cart_items

            SET
                quantity = ?,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                newQuantity,
                itemId
            ]
        );


        return res.status(200).json({
            success: true,
            message:
                "Cart item updated successfully",
            item_id:
                Number(itemId),
            quantity:
                newQuantity
        });

    } catch (error) {

        console.error(
            "Update cart item error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update cart item"
        });
    }
};


export const removeFromCart = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;

        const { itemId } =
            req.params;


        const [items] =
            await pool.execute(
                `
                SELECT
                    ci.id

                FROM cart_items ci

                INNER JOIN carts cart
                    ON ci.cart_id = cart.id

                WHERE ci.id = ?
                AND cart.user_id = ?

                LIMIT 1
                `,
                [
                    itemId,
                    userId
                ]
            );


        if (items.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Cart item not found"
            });
        }


        await pool.execute(
            `
            DELETE FROM cart_items
            WHERE id = ?
            `,
            [itemId]
        );


        return res.status(200).json({
            success: true,
            message:
                "Item removed from cart"
        });

    } catch (error) {

        console.error(
            "Remove cart item error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to remove cart item"
        });
    }
};


export const clearCart = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        const [carts] =
            await pool.execute(
                `
                SELECT id
                FROM carts
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (carts.length === 0) {

            return res.status(200).json({
                success: true,
                message:
                    "Cart is already empty"
            });
        }


        await pool.execute(
            `
            DELETE FROM cart_items
            WHERE cart_id = ?
            `,
            [carts[0].id]
        );


        return res.status(200).json({
            success: true,
            message:
                "Cart cleared successfully"
        });

    } catch (error) {

        console.error(
            "Clear cart error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to clear cart"
        });
    }
};