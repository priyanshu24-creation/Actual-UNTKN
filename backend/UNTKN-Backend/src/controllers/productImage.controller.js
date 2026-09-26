import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const deleteFromCloudinary = async (publicId) => {
    if (!publicId) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image"
        });

        console.log(
            `Cloudinary image deleted: ${publicId}`
        );
    } catch (error) {
        console.error(
            `Failed to delete Cloudinary image: ${publicId}`
        );
        console.error(error);
    }
};


// ==========================================
// GET PRODUCT IMAGES
// ==========================================

export const getProductImages = async (req, res) => {
    try {
        const { productId } = req.params;

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

        const [images] = await pool.execute(
            `
            SELECT
                id,
                product_id,
                image_url,
                public_id,
                is_primary,
                sort_order
            FROM product_images
            WHERE product_id = ?
            ORDER BY is_primary DESC, sort_order ASC, id ASC
            `,
            [numericProductId]
        );

        return res.status(200).json({
            success: true,
            count: images.length,
            images: images.map((image) => ({
                id: Number(image.id),
                product_id: Number(image.product_id),
                image_url: image.image_url,
                public_id: image.public_id || null,
                is_primary: Boolean(image.is_primary),
                sort_order: Number(
                    image.sort_order || 0
                )
            }))
        });
    } catch (error) {
        console.error(
            "GET PRODUCT IMAGES ERROR"
        );
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

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

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

        const [existingImages] =
            await pool.execute(
                `
                SELECT
                    id,
                    sort_order
                FROM product_images
                WHERE product_id = ?
                ORDER BY sort_order ASC, id ASC
                `,
                [numericProductId]
            );

        const nextSortOrder =
            existingImages.length > 0
                ? Math.max(
                      ...existingImages.map(
                          (image) =>
                              Number(
                                  image.sort_order || 0
                              )
                      )
                  ) + 1
                : 0;

        const isPrimary =
            existingImages.length === 0 ? 1 : 0;

        const [result] =
            await pool.execute(
                `
                INSERT INTO product_images
                (
                    product_id,
                    image_url,
                    public_id,
                    is_primary,
                    sort_order
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    numericProductId,
                    cloudinaryResult.secure_url,
                    cloudinaryResult.public_id ||
                        null,
                    isPrimary,
                    nextSortOrder
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "Product image uploaded successfully",

            image: {
                id: Number(result.insertId),
                product_id: numericProductId,
                image_url:
                    cloudinaryResult.secure_url,
                public_id:
                    cloudinaryResult.public_id ||
                    null,
                is_primary:
                    Boolean(isPrimary),
                sort_order:
                    nextSortOrder
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


// ==========================================
// DELETE PRODUCT IMAGE
// ==========================================

export const deleteProductImage = async (req, res) => {
    try {
        const {
            productId,
            imageId
        } = req.params;

        const numericProductId =
            Number(productId);

        const numericImageId =
            Number(imageId);

        if (
            !Number.isInteger(
                numericProductId
            ) ||
            numericProductId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (
            !Number.isInteger(
                numericImageId
            ) ||
            numericImageId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid image ID"
            });
        }

        const [images] =
            await pool.execute(
                `
                SELECT
                    id,
                    product_id,
                    image_url,
                    public_id,
                    is_primary,
                    sort_order
                FROM product_images
                WHERE id = ?
                  AND product_id = ?
                LIMIT 1
                `,
                [
                    numericImageId,
                    numericProductId
                ]
            );

        if (images.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Product image not found"
            });
        }

        const image = images[0];

        await pool.execute(
            `
            DELETE FROM product_images
            WHERE id = ?
              AND product_id = ?
            `,
            [
                numericImageId,
                numericProductId
            ]
        );

        if (image.public_id) {
            await deleteFromCloudinary(
                image.public_id
            );
        }

        const [remainingImages] =
            await pool.execute(
                `
                SELECT
                    id,
                    is_primary,
                    sort_order
                FROM product_images
                WHERE product_id = ?
                ORDER BY
                    sort_order ASC,
                    id ASC
                `,
                [numericProductId]
            );

        if (remainingImages.length > 0) {
            const hasPrimary =
                remainingImages.some(
                    (item) =>
                        Boolean(
                            item.is_primary
                        )
                );

            if (!hasPrimary) {
                const newPrimary =
                    remainingImages[0];

                await pool.execute(
                    `
                    UPDATE product_images
                    SET is_primary = 1
                    WHERE id = ?
                    `,
                    [newPrimary.id]
                );
            }

            const reorderedImages =
                remainingImages;

            for (
                let index = 0;
                index <
                reorderedImages.length;
                index++
            ) {
                await pool.execute(
                    `
                    UPDATE product_images
                    SET sort_order = ?
                    WHERE id = ?
                    `,
                    [
                        index,
                        reorderedImages[
                            index
                        ].id
                    ]
                );
            }
        }

        return res.status(200).json({
            success: true,
            message:
                "Product image deleted successfully",
            deletedImageId:
                numericImageId
        });
    } catch (error) {
        console.error(
            "DELETE PRODUCT IMAGE ERROR"
        );
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete product image",
            error: error.message
        });
    }
};