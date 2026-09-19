import pool from "../config/database.js";

// ======================================================
// GET OR CREATE CUSTOMER WISHLIST
// ======================================================

const getOrCreateWishlist = async (userId) => {
    const [existing] = await pool.execute(
        `
        SELECT id
        FROM wishlists
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    const [result] = await pool.execute(
        `
        INSERT INTO wishlists (user_id)
        VALUES (?)
        `,
        [userId]
    );

    return result.insertId;
};


// ======================================================
// CUSTOMER - GET OWN WISHLIST
// ======================================================

export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const wishlistId = await getOrCreateWishlist(userId);

        const [items] = await pool.execute(
            `
            SELECT
                wi.id,
                wi.product_id,
                wi.created_at,

                p.name,
                p.slug,
                p.short_description,
                p.base_price,
                p.sale_price,
                p.currency,
                p.published,
                p.featured,

                pi.image_url,
                pi.alt_text

            FROM wishlist_items wi

            INNER JOIN products p
                ON wi.product_id = p.id

            LEFT JOIN product_images pi
                ON pi.product_id = p.id
                AND pi.is_primary = TRUE

            WHERE wi.wishlist_id = ?

            ORDER BY wi.created_at DESC
            `,
            [wishlistId]
        );

        const formattedItems = items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            name: item.name,
            slug: item.slug,
            short_description: item.short_description,

            base_price: Number(item.base_price),

            sale_price:
                item.sale_price !== null
                    ? Number(item.sale_price)
                    : null,

            currency: item.currency,
            published: item.published,
            featured: item.featured,

            image_url: item.image_url,
            alt_text: item.alt_text,

            added_at: item.created_at
        }));

        return res.status(200).json({
            success: true,
            wishlist: {
                id: wishlistId,
                count: formattedItems.length,
                items: formattedItems
            }
        });

    } catch (error) {
        console.error("Get wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist"
        });
    }
};


// ======================================================
// CUSTOMER - ADD TO WISHLIST
// ======================================================

export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const [products] = await pool.execute(
            `
            SELECT
                id,
                name,
                published
            FROM products
            WHERE id = ?
            LIMIT 1
            `,
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product = products[0];

        if (!product.published) {
            return res.status(400).json({
                success: false,
                message: "This product is not available"
            });
        }

        const wishlistId = await getOrCreateWishlist(userId);

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM wishlist_items
            WHERE wishlist_id = ?
            AND product_id = ?
            LIMIT 1
            `,
            [
                wishlistId,
                product_id
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Product is already in wishlist",
                item_id: existing[0].id
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO wishlist_items
                (wishlist_id, product_id)
            VALUES (?, ?)
            `,
            [
                wishlistId,
                product_id
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Product added to wishlist",
            item_id: result.insertId,
            product_id: Number(product_id)
        });

    } catch (error) {
        console.error("Add wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add product to wishlist"
        });
    }
};


// ======================================================
// CUSTOMER - REMOVE FROM OWN WISHLIST
// ======================================================

export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const [items] = await pool.execute(
            `
            SELECT wi.id
            FROM wishlist_items wi

            INNER JOIN wishlists w
                ON wi.wishlist_id = w.id

            WHERE wi.id = ?
            AND w.user_id = ?

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
                message: "Wishlist item not found"
            });
        }

        await pool.execute(
            `
            DELETE FROM wishlist_items
            WHERE id = ?
            `,
            [itemId]
        );

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });

    } catch (error) {
        console.error("Remove wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove wishlist item"
        });
    }
};


// ======================================================
// CUSTOMER - CLEAR OWN WISHLIST
// ======================================================

export const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const [wishlists] = await pool.execute(
            `
            SELECT id
            FROM wishlists
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (wishlists.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Wishlist is already empty"
            });
        }

        await pool.execute(
            `
            DELETE FROM wishlist_items
            WHERE wishlist_id = ?
            `,
            [wishlists[0].id]
        );

        return res.status(200).json({
            success: true,
            message: "Wishlist cleared successfully"
        });

    } catch (error) {
        console.error("Clear wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to clear wishlist"
        });
    }
};


// ======================================================
// ADMIN - GET ALL WISHLIST ITEMS
// ======================================================

export const getAdminWishlist = async (req, res) => {
    try {
        const [items] = await pool.execute(
            `
            SELECT
                wi.id,
                wi.product_id,
                wi.created_at,

                u.id AS customer_id,
                u.name AS customer_name,
                u.email AS customer_email,

                p.name AS product_name,
                p.slug AS product_slug,
                p.base_price,
                p.sale_price,
                p.currency,

                c.id AS category_id,
                c.name AS category_name,
                c.slug AS category_slug

            FROM wishlist_items wi

            INNER JOIN wishlists w
                ON wi.wishlist_id = w.id

            INNER JOIN users u
                ON w.user_id = u.id

            INNER JOIN products p
                ON wi.product_id = p.id

            LEFT JOIN categories c
                ON p.category_id = c.id

            ORDER BY wi.created_at DESC
            `
        );

        const formattedItems = items.map((item) => ({
            id: Number(item.id),

            customerId: Number(item.customer_id),
            customer: item.customer_name,
            email: item.customer_email,

            productId: Number(item.product_id),
            product: item.product_name,
            slug: item.product_slug,

            categoryId:
                item.category_id !== null
                    ? Number(item.category_id)
                    : null,

            category:
                item.category_name || "Uncategorized",

            price:
                item.sale_price !== null
                    ? Number(item.sale_price)
                    : Number(item.base_price),

            basePrice:
                item.base_price !== null
                    ? Number(item.base_price)
                    : 0,

            salePrice:
                item.sale_price !== null
                    ? Number(item.sale_price)
                    : null,

            currency: item.currency || "INR",

            added: item.created_at
        }));

        return res.status(200).json({
            success: true,
            count: formattedItems.length,
            wishlist: formattedItems
        });

    } catch (error) {
        console.error("Get admin wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin wishlist"
        });
    }
};


// ======================================================
// ADMIN - REMOVE ANY WISHLIST ITEM
// ======================================================

export const adminRemoveFromWishlist = async (req, res) => {
    try {
        const { itemId } = req.params;

        if (!itemId || !/^\d+$/.test(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Valid wishlist item ID is required"
            });
        }

        const [items] = await pool.execute(
            `
            SELECT
                wi.id,
                p.name AS product_name,
                u.name AS customer_name

            FROM wishlist_items wi

            INNER JOIN wishlists w
                ON wi.wishlist_id = w.id

            INNER JOIN users u
                ON w.user_id = u.id

            INNER JOIN products p
                ON wi.product_id = p.id

            WHERE wi.id = ?

            LIMIT 1
            `,
            [itemId]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Wishlist item not found"
            });
        }

        await pool.execute(
            `
            DELETE FROM wishlist_items
            WHERE id = ?
            `,
            [itemId]
        );

        return res.status(200).json({
            success: true,
            message: "Wishlist item removed successfully"
        });

    } catch (error) {
        console.error(
            "Admin remove wishlist error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to remove wishlist item"
        });
    }
};