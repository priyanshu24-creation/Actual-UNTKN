import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const parseBoolean = (value, defaultValue = true) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    return String(value).toLowerCase() === "true";
};

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "untkn/collections",
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

        Readable.from(buffer).pipe(stream);
    });
};

export const getCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            `
            SELECT
                id,
                name,
                slug,
                description,
                image_url,
                is_active,
                created_at,
                updated_at
            FROM collections
            ORDER BY id DESC
            `
        );

        return res.status(200).json({
            success: true,
            count: collections.length,
            collections: collections.map((collection) => ({
                id: collection.id,
                name: collection.name,
                slug: collection.slug,
                description: collection.description,
                image_url: collection.image_url,
                is_active: Boolean(collection.is_active),
                created_at: collection.created_at,
                updated_at: collection.updated_at
            }))
        });
    } catch (error) {
        console.error("GET COLLECTIONS ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch collections"
        });
    }
};

export const getCollectionBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const [collections] = await pool.execute(
            `
            SELECT
                id,
                name,
                slug,
                description,
                image_url,
                is_active,
                created_at,
                updated_at
            FROM collections
            WHERE slug = ?
            LIMIT 1
            `,
            [slug]
        );

        if (collections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        const collection = collections[0];

        return res.status(200).json({
            success: true,
            collection: {
                id: collection.id,
                name: collection.name,
                slug: collection.slug,
                description: collection.description,
                image_url: collection.image_url,
                is_active: Boolean(collection.is_active),
                created_at: collection.created_at,
                updated_at: collection.updated_at
            }
        });
    } catch (error) {
        console.error("GET COLLECTION BY SLUG ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch collection"
        });
    }
};

export const getCollection = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection ID"
            });
        }

        const [collections] = await pool.execute(
            `
            SELECT
                id,
                name,
                slug,
                description,
                image_url,
                is_active,
                created_at,
                updated_at
            FROM collections
            WHERE id = ?
            LIMIT 1
            `,
            [numericId]
        );

        if (collections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        const collection = collections[0];

        return res.status(200).json({
            success: true,
            collection: {
                id: collection.id,
                name: collection.name,
                slug: collection.slug,
                description: collection.description,
                image_url: collection.image_url,
                is_active: Boolean(collection.is_active),
                created_at: collection.created_at,
                updated_at: collection.updated_at
            }
        });
    } catch (error) {
        console.error("GET COLLECTION ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch collection"
        });
    }
};

export const createCollection = async (req, res) => {
    try {
        const {
            name,
            slug,
            description
        } = req.body;

        const isActive = parseBoolean(
            req.body.is_active,
            true
        );

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Collection name is required"
            });
        }

        if (!slug || !String(slug).trim()) {
            return res.status(400).json({
                success: false,
                message: "Collection slug is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Collection image is required"
            });
        }

        const cleanName = String(name).trim();
        const cleanSlug = String(slug).trim().toLowerCase();
        const cleanDescription = description
            ? String(description).trim()
            : null;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM collections
            WHERE slug = ?
            LIMIT 1
            `,
            [cleanSlug]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A collection with this slug already exists"
            });
        }

        const cloudinaryResult =
            await uploadToCloudinary(req.file.buffer);

        const [result] = await pool.execute(
            `
            INSERT INTO collections
            (
                name,
                slug,
                description,
                image_url,
                is_active
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                cleanName,
                cleanSlug,
                cleanDescription,
                cloudinaryResult.secure_url,
                isActive ? 1 : 0
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Collection created successfully",
            collection: {
                id: result.insertId,
                name: cleanName,
                slug: cleanSlug,
                description: cleanDescription,
                image_url: cloudinaryResult.secure_url,
                is_active: isActive
            }
        });
    } catch (error) {
        console.error("CREATE COLLECTION ERROR");
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message: "Failed to create collection",
            error: error.message
        });
    }
};

export const updateCollection = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection ID"
            });
        }

        const {
            name,
            slug,
            description
        } = req.body;

        const isActive = parseBoolean(
            req.body.is_active,
            true
        );

        const [existingCollections] = await pool.execute(
            `
            SELECT
                id,
                name,
                slug,
                description,
                image_url,
                is_active
            FROM collections
            WHERE id = ?
            LIMIT 1
            `,
            [numericId]
        );

        if (existingCollections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        const existing = existingCollections[0];

        const cleanName =
            name !== undefined
                ? String(name).trim()
                : existing.name;

        const cleanSlug =
            slug !== undefined
                ? String(slug).trim().toLowerCase()
                : existing.slug;

        const cleanDescription =
            description !== undefined
                ? String(description).trim()
                : existing.description;

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Collection name is required"
            });
        }

        if (!cleanSlug) {
            return res.status(400).json({
                success: false,
                message: "Collection slug is required"
            });
        }

        const [duplicate] = await pool.execute(
            `
            SELECT id
            FROM collections
            WHERE slug = ?
            AND id != ?
            LIMIT 1
            `,
            [cleanSlug, numericId]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A collection with this slug already exists"
            });
        }

        let imageUrl = existing.image_url;

        if (req.file) {
            const cloudinaryResult =
                await uploadToCloudinary(req.file.buffer);

            imageUrl = cloudinaryResult.secure_url;
        }

        if (
            String(req.body.remove_image).toLowerCase() === "true" &&
            !req.file
        ) {
            imageUrl = null;
        }

        const [result] = await pool.execute(
            `
            UPDATE collections
            SET
                name = ?,
                slug = ?,
                description = ?,
                image_url = ?,
                is_active = ?
            WHERE id = ?
            `,
            [
                cleanName,
                cleanSlug,
                cleanDescription,
                imageUrl,
                isActive ? 1 : 0,
                numericId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Collection updated successfully",
            collection: {
                id: numericId,
                name: cleanName,
                slug: cleanSlug,
                description: cleanDescription,
                image_url: imageUrl,
                is_active: isActive
            }
        });
    } catch (error) {
        console.error("UPDATE COLLECTION ERROR");
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message: "Failed to update collection",
            error: error.message
        });
    }
};

export const deleteCollection = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection ID"
            });
        }

        const [result] = await pool.execute(
            `
            DELETE FROM collections
            WHERE id = ?
            `,
            [numericId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Collection deleted successfully"
        });
    } catch (error) {
        console.error("DELETE COLLECTION ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete collection"
        });
    }
};