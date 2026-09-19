import pool from "../config/database.js";


export const getProductVariants = async (req, res) => {
    try {
        const { productId } = req.params;

        const [variants] = await pool.execute(
            `
            SELECT
                pv.id,
                pv.product_id,
                pv.sku,
                pv.price,
                pv.stock_quantity,
                pv.active,
                pv.size_id,
                s.name AS size_name,
                pv.color_id,
                c.name AS color_name,
                c.hex_code
            FROM product_variants pv
            LEFT JOIN sizes s
                ON pv.size_id = s.id
            LEFT JOIN colors c
                ON pv.color_id = c.id
            WHERE pv.product_id = ?
            ORDER BY pv.id ASC
            `,
            [productId]
        );

        return res.status(200).json({
            success: true,
            count: variants.length,
            variants
        });
    } catch (error) {
        console.error("Get product variants error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product variants"
        });
    }
};


export const createProductVariant = async (req, res) => {
    try {
        const { productId } = req.params;

        const {
            sku,
            size_id,
            color_id,
            price,
            stock_quantity,
            active
        } = req.body;

        if (!sku) {
            return res.status(400).json({
                success: false,
                message: "SKU is required"
            });
        }

        const cleanSku = sku.trim().toUpperCase();

        const [products] = await pool.execute(
            `
            SELECT id
            FROM products
            WHERE id = ?
            LIMIT 1
            `,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const [existingSku] = await pool.execute(
            `
            SELECT id
            FROM product_variants
            WHERE sku = ?
            LIMIT 1
            `,
            [cleanSku]
        );

        if (existingSku.length > 0) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists"
            });
        }

        if (size_id !== undefined && size_id !== null) {
            const [sizes] = await pool.execute(
                `
                SELECT id
                FROM sizes
                WHERE id = ?
                AND is_active = TRUE
                LIMIT 1
                `,
                [size_id]
            );

            if (sizes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid size"
                });
            }
        }

        if (color_id !== undefined && color_id !== null) {
            const [colors] = await pool.execute(
                `
                SELECT id
                FROM colors
                WHERE id = ?
                AND is_active = TRUE
                LIMIT 1
                `,
                [color_id]
            );

            if (colors.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid color"
                });
            }
        }

        const variantPrice =
            price !== undefined &&
            price !== null &&
            price !== ""
                ? Number(price)
                : null;

        if (
            variantPrice !== null &&
            (!Number.isFinite(variantPrice) || variantPrice < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid variant price"
            });
        }

        const stock =
            stock_quantity !== undefined
                ? Number(stock_quantity)
                : 0;

        if (!Number.isInteger(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity must be a non-negative integer"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO product_variants
                (
                    product_id,
                    sku,
                    size_id,
                    color_id,
                    price,
                    stock_quantity,
                    active
                )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                productId,
                cleanSku,
                size_id || null,
                color_id || null,
                variantPrice,
                stock,
                active !== undefined ? active : true
            ]
        );

        const [variants] = await pool.execute(
            `
            SELECT
                pv.*,
                s.name AS size_name,
                c.name AS color_name,
                c.hex_code
            FROM product_variants pv
            LEFT JOIN sizes s
                ON pv.size_id = s.id
            LEFT JOIN colors c
                ON pv.color_id = c.id
            WHERE pv.id = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Product variant created successfully",
            variant: variants[0]
        });
    } catch (error) {
        console.error("Create product variant error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create product variant"
        });
    }
};


export const updateProductVariant = async (req, res) => {
    try {
        const {
            productId,
            variantId
        } = req.params;

        const {
            sku,
            size_id,
            color_id,
            price,
            stock_quantity,
            active
        } = req.body;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM product_variants
            WHERE id = ?
            AND product_id = ?
            LIMIT 1
            `,
            [variantId, productId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found"
            });
        }

        const fields = [];
        const values = [];

        if (sku !== undefined) {
            fields.push("sku = ?");
            values.push(sku.trim().toUpperCase());
        }

        if (size_id !== undefined) {
            fields.push("size_id = ?");
            values.push(size_id || null);
        }

        if (color_id !== undefined) {
            fields.push("color_id = ?");
            values.push(color_id || null);
        }

        if (price !== undefined) {
            const variantPrice =
                price === null || price === ""
                    ? null
                    : Number(price);

            if (
                variantPrice !== null &&
                (!Number.isFinite(variantPrice) || variantPrice < 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid variant price"
                });
            }

            fields.push("price = ?");
            values.push(variantPrice);
        }

        if (stock_quantity !== undefined) {
            const stock = Number(stock_quantity);

            if (!Number.isInteger(stock) || stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Stock quantity must be a non-negative integer"
                });
            }

            fields.push("stock_quantity = ?");
            values.push(stock);
        }

        if (active !== undefined) {
            fields.push("active = ?");
            values.push(active);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        values.push(variantId, productId);

        await pool.execute(
            `
            UPDATE product_variants
            SET ${fields.join(", ")}
            WHERE id = ?
            AND product_id = ?
            `,
            values
        );

        const [variants] = await pool.execute(
            `
            SELECT
                pv.*,
                s.name AS size_name,
                c.name AS color_name,
                c.hex_code
            FROM product_variants pv
            LEFT JOIN sizes s
                ON pv.size_id = s.id
            LEFT JOIN colors c
                ON pv.color_id = c.id
            WHERE pv.id = ?
            `,
            [variantId]
        );

        return res.status(200).json({
            success: true,
            message: "Product variant updated successfully",
            variant: variants[0]
        });
    } catch (error) {
        console.error("Update product variant error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product variant"
        });
    }
};


export const deleteProductVariant = async (req, res) => {
    try {
        const {
            productId,
            variantId
        } = req.params;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM product_variants
            WHERE id = ?
            AND product_id = ?
            LIMIT 1
            `,
            [variantId, productId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found"
            });
        }

        await pool.execute(
            `
            UPDATE product_variants
            SET active = FALSE
            WHERE id = ?
            AND product_id = ?
            `,
            [variantId, productId]
        );

        return res.status(200).json({
            success: true,
            message: "Product variant deleted successfully"
        });
    } catch (error) {
        console.error("Delete product variant error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product variant"
        });
    }
};