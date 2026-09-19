import pool from "../config/database.js";

/*
|--------------------------------------------------------------------------
| GET OR CREATE CART
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| GET CART
|--------------------------------------------------------------------------
*/

export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartId = await getOrCreateCart(userId);

        /*
         * Important:
         *
         * The old query selected only is_primary = TRUE.
         *
         * Your primary image is an example.com placeholder.
         *
         * We now ignore placeholder images and select
         * the best real image from product_images.
         */

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

                pi.image_url,

                pv.sku,
                pv.price AS variant_price,
                pv.stock_quantity,

                s.name AS size_name,
                c.name AS color_name,
                c.hex_code

            FROM cart_items ci

            INNER JOIN products p
                ON ci.product_id = p.id

            LEFT JOIN product_variants pv
                ON ci.variant_id = pv.id

            LEFT JOIN sizes s
                ON pv.size_id = s.id

            LEFT JOIN colors c
                ON pv.color_id = c.id

            /*
             * Select the best REAL image.
             *
             * Ignore example.com placeholder images.
             * Prefer primary image.
             * Then prefer lower sort_order.
             * Then lower id.
             */
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

            WHERE ci.cart_id = ?

            ORDER BY ci.created_at DESC
            `,
            [cartId]
        );


        /*
        |--------------------------------------------------------------------------
        | CALCULATE SUBTOTAL
        |--------------------------------------------------------------------------
        */

        let subtotal = 0;


        const formattedItems = items.map((item) => {

            /*
             * Variant price has highest priority.
             *
             * Otherwise:
             * sale price
             * otherwise:
             * base price
             */

            let unitPrice;

            if (item.variant_price !== null) {
                unitPrice = Number(
                    item.variant_price
                );
            } else if (item.sale_price !== null) {
                unitPrice = Number(
                    item.sale_price
                );
            } else {
                unitPrice = Number(
                    item.base_price
                );
            }


            const quantity = Number(
                item.quantity || 0
            );


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
                    item.stock_quantity !== null
                        ? Number(
                            item.stock_quantity
                        )
                        : null,

                unit_price:
                    unitPrice,

                total_price:
                    totalPrice,

                currency:
                    item.currency || "INR"
            };
        });


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

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
                            Number(
                                item.quantity || 0
                            ),
                        0
                    ),

                subtotal
            }
        });

    } catch (error) {

        console.error(
            "Get cart error:"
        );

        console.error(error);


        return res.status(500).json({
            success: false,
            message: "Failed to fetch cart"
        });
    }
};


/*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
*/

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


        /*
        |--------------------------------------------------------------------------
        | VALIDATE PRODUCT ID
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | VALIDATE QUANTITY
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | NORMALIZE VARIANT ID
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | START TRANSACTION
        |--------------------------------------------------------------------------
        */

        await connection.beginTransaction();


        /*
        |--------------------------------------------------------------------------
        | CHECK PRODUCT
        |--------------------------------------------------------------------------
        */

        const [products] =
            await connection.execute(
                `
                SELECT
                    id,
                    name,
                    sale_price,
                    base_price
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


        /*
        |--------------------------------------------------------------------------
        | CHECK VARIANT
        |--------------------------------------------------------------------------
        */

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


            /*
            |--------------------------------------------------------------------------
            | VARIANT ACTIVE CHECK
            |--------------------------------------------------------------------------
            */

            if (
                !variant.active
            ) {

                await connection.rollback();


                return res.status(400).json({
                    success: false,
                    message:
                        "This product variant is unavailable"
                });
            }


            /*
            |--------------------------------------------------------------------------
            | STOCK CHECK
            |--------------------------------------------------------------------------
            */

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


        /*
        |--------------------------------------------------------------------------
        | GET OR CREATE CART
        |--------------------------------------------------------------------------
        |
        | Use the SAME database connection so cart creation
        | participates in the current transaction.
        |
        */

        const cartId =
            await getOrCreateCart(
                userId,
                connection
            );


        /*
        |--------------------------------------------------------------------------
        | CHECK EXISTING CART ITEM
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | EXISTING ITEM
        |--------------------------------------------------------------------------
        */

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


            /*
            |--------------------------------------------------------------------------
            | CHECK TOTAL STOCK
            |--------------------------------------------------------------------------
            */

            if (variant) {

                const stockQuantity =
                    Number(
                        variant.stock_quantity ||
                        0
                    );


                if (
                    stockQuantity <
                    newQuantity
                ) {

                    await connection.rollback();


                    return res.status(400).json({
                        success: false,
                        message:
                            "Requested quantity exceeds available stock"
                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | UPDATE EXISTING ITEM
            |--------------------------------------------------------------------------
            */

            await connection.execute(
                `
                UPDATE cart_items
                SET quantity = ?
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


        /*
        |--------------------------------------------------------------------------
        | INSERT NEW CART ITEM
        |--------------------------------------------------------------------------
        */

        const [result] =
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

            item_id:
                result.insertId,

            quantity:
                requestedQuantity
        });


    } catch (error) {

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }


        console.error(
            "Add to cart error:"
        );

        console.error(error);


        return res.status(500).json({
            success: false,
            message:
                "Failed to add product to cart"
        });

    } finally {

        connection.release();
    }
};


/*
|--------------------------------------------------------------------------
| UPDATE CART ITEM
|--------------------------------------------------------------------------
*/

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


        /*
        |--------------------------------------------------------------------------
        | VALIDATE QUANTITY
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | FIND CART ITEM
        |--------------------------------------------------------------------------
        */

        const [items] =
            await pool.execute(
                `
                SELECT
                    ci.id,
                    ci.quantity,
                    ci.variant_id,
                    pv.stock_quantity

                FROM cart_items ci

                INNER JOIN carts c
                    ON ci.cart_id = c.id

                LEFT JOIN product_variants pv
                    ON ci.variant_id = pv.id

                WHERE ci.id = ?
                AND c.user_id = ?
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


        /*
        |--------------------------------------------------------------------------
        | CHECK VARIANT STOCK
        |--------------------------------------------------------------------------
        */

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
                        "Requested quantity exceeds available stock"
                });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE QUANTITY
        |--------------------------------------------------------------------------
        */

        await pool.execute(
            `
            UPDATE cart_items
            SET quantity = ?
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
            "Update cart item error:"
        );

        console.error(error);


        return res.status(500).json({
            success: false,
            message:
                "Failed to update cart item"
        });
    }
};


/*
|--------------------------------------------------------------------------
| REMOVE FROM CART
|--------------------------------------------------------------------------
*/

export const removeFromCart = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        const { itemId } =
            req.params;


        /*
        |--------------------------------------------------------------------------
        | CHECK OWNERSHIP
        |--------------------------------------------------------------------------
        */

        const [items] =
            await pool.execute(
                `
                SELECT
                    ci.id
                FROM cart_items ci

                INNER JOIN carts c
                    ON ci.cart_id = c.id

                WHERE ci.id = ?
                AND c.user_id = ?

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


        /*
        |--------------------------------------------------------------------------
        | DELETE ITEM
        |--------------------------------------------------------------------------
        */

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
            "Remove cart item error:"
        );

        console.error(error);


        return res.status(500).json({
            success: false,
            message:
                "Failed to remove cart item"
        });
    }
};


/*
|--------------------------------------------------------------------------
| CLEAR CART
|--------------------------------------------------------------------------
*/

export const clearCart = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        /*
        |--------------------------------------------------------------------------
        | FIND USER CART
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | DELETE ALL CART ITEMS
        |--------------------------------------------------------------------------
        */

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
            "Clear cart error:"
        );

        console.error(error);


        return res.status(500).json({
            success: false,
            message:
                "Failed to clear cart"
        });
    }
};