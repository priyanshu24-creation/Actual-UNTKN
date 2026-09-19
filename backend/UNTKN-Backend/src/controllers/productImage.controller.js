import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";


// ==========================================
// GET PRODUCT IMAGES
// ==========================================

export const getProductImages = async (req, res) => {
    try {
        const { productId } = req.params;

        // ==========================================
        // VALIDATE PRODUCT ID
        // ==========================================

        const numericProductId = Number(productId);

        if (
            !Number.isInteger(numericProductId) ||
            numericProductId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // ==========================================
        // CHECK PRODUCT
        // ==========================================

        const [products] = await pool.execute(
            `
            SELECT id
            FROM products
            WHERE id = ?
            `,
            [numericProductId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ==========================================
        // GET PRODUCT IMAGES
        // ==========================================

        const [images] = await pool.execute(
            `
            SELECT
                id,
                product_id,
                image_url,
                is_primary,
                sort_order
            FROM product_images
            WHERE product_id = ?
            ORDER BY is_primary DESC, sort_order ASC, id ASC
            `,
            [numericProductId]
        );

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,
            count: images.length,
            images: images.map((image) => ({
                id: image.id,
                product_id: image.product_id,
                image_url: image.image_url,
                is_primary: Boolean(image.is_primary),
                sort_order: image.sort_order
            }))
        });

    } catch (error) {
        console.error("GET PRODUCT IMAGES ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product images"
        });
    }
};


// ==========================================
// UPLOAD PRODUCT IMAGE
// ==========================================

export const uploadProductImage = async (req, res) => {
    try {
        const { productId } = req.params;

        // ==========================================
        // VALIDATE PRODUCT ID
        // ==========================================

        const numericProductId = Number(productId);

        if (
            !Number.isInteger(numericProductId) ||
            numericProductId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // ==========================================
        // CHECK IMAGE
        // ==========================================

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

        // ==========================================
        // CHECK PRODUCT
        // ==========================================

        const [products] = await pool.execute(
            `
            SELECT id, name
            FROM products
            WHERE id = ?
            `,
            [numericProductId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ==========================================
        // UPLOAD TO CLOUDINARY
        // ==========================================

        const uploadToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "untkn/products",
                            resource_type: "image"
                        },
                        (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );

                Readable
                    .from(req.file.buffer)
                    .pipe(stream);
            });
        };

        const cloudinaryResult =
            await uploadToCloudinary();

        // ==========================================
        // CHECK EXISTING IMAGES
        // ==========================================

        const [existingImages] =
            await pool.execute(
                `
                SELECT id
                FROM product_images
                WHERE product_id = ?
                `,
                [numericProductId]
            );

        // ==========================================
        // FIRST IMAGE = PRIMARY IMAGE
        // ==========================================

        const isPrimary =
            existingImages.length === 0 ? 1 : 0;

        // ==========================================
        // SAVE IMAGE URL
        // ==========================================

        const [result] =
            await pool.execute(
                `
                INSERT INTO product_images
                (
                    product_id,
                    image_url,
                    is_primary,
                    sort_order
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    numericProductId,
                    cloudinaryResult.secure_url,
                    isPrimary,
                    existingImages.length
                ]
            );

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({
            success: true,
            message:
                "Product image uploaded successfully",

            image: {
                id: result.insertId,
                product_id: numericProductId,
                image_url:
                    cloudinaryResult.secure_url,
                is_primary:
                    Boolean(isPrimary),
                sort_order:
                    existingImages.length
            }
        });

    } catch (error) {
        console.error(
            "UPLOAD PRODUCT IMAGE ERROR"
        );
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message:
                "Failed to upload product image",
            error: error.message
        });
    }
};