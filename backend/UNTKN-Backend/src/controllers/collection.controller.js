import pool from "../config/database.js";

export const getCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            `SELECT *
             FROM collections
             WHERE is_active = TRUE
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: collections.length,
            collections
        });
    } catch (error) {
        console.error("Get collections error:", error);

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
            `SELECT *
             FROM collections
             WHERE slug = ?
             AND is_active = TRUE
             LIMIT 1`,
            [slug]
        );

        if (collections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        return res.status(200).json({
            success: true,
            collection: collections[0]
        });
    } catch (error) {
        console.error("Get collection error:", error);

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
            description,
            image_url
        } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: "Name and slug are required"
            });
        }

        const cleanName = name.trim();
        const cleanSlug = slug.trim().toLowerCase();

        const [existing] = await pool.execute(
            `SELECT id
             FROM collections
             WHERE name = ?
             OR slug = ?
             LIMIT 1`,
            [cleanName, cleanSlug]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Collection name or slug already exists"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO collections
                (name, slug, description, image_url)
             VALUES (?, ?, ?, ?)`,
            [
                cleanName,
                cleanSlug,
                description?.trim() || null,
                image_url?.trim() || null
            ]
        );

        const [collections] = await pool.execute(
            `SELECT *
             FROM collections
             WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Collection created successfully",
            collection: collections[0]
        });
    } catch (error) {
        console.error("Create collection error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create collection"
        });
    }
};

export const updateCollection = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            slug,
            description,
            image_url,
            is_active
        } = req.body;

        const [existing] = await pool.execute(
            `SELECT id
             FROM collections
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        await pool.execute(
            `UPDATE collections
             SET
                name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                image_url = COALESCE(?, image_url),
                is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [
                name?.trim() || null,
                slug?.trim().toLowerCase() || null,
                description !== undefined ? description : null,
                image_url !== undefined ? image_url : null,
                is_active !== undefined ? is_active : null,
                id
            ]
        );

        const [collections] = await pool.execute(
            `SELECT *
             FROM collections
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Collection updated successfully",
            collection: collections[0]
        });
    } catch (error) {
        console.error("Update collection error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update collection"
        });
    }
};

export const deleteCollection = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            `SELECT id
             FROM collections
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        await pool.execute(
            `UPDATE collections
             SET is_active = FALSE
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Collection deleted successfully"
        });
    } catch (error) {
        console.error("Delete collection error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete collection"
        });
    }
};