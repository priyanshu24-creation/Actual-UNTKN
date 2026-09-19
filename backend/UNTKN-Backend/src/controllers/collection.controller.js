import pool from "../config/database.js";

/*
|--------------------------------------------------------------------------
| GET ALL COLLECTIONS
|--------------------------------------------------------------------------
| GET /api/collections
|--------------------------------------------------------------------------
*/

export const getCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(`
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
            ORDER BY created_at DESC
        `);

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
        console.error("GET COLLECTIONS ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch collections"
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET COLLECTION BY SLUG
|--------------------------------------------------------------------------
| GET /api/collections/slug/:slug
|--------------------------------------------------------------------------
*/

export const getCollectionBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const cleanSlug =
            typeof slug === "string"
                ? slug.trim().toLowerCase()
                : "";

        if (!cleanSlug) {
            return res.status(400).json({
                success: false,
                message: "Collection slug is required"
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
            WHERE slug = ?
            LIMIT 1
            `,
            [cleanSlug]
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
        console.error("GET COLLECTION BY SLUG ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch collection"
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE COLLECTION
|--------------------------------------------------------------------------
| GET /api/collections/:id
|--------------------------------------------------------------------------
*/

export const getCollectionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !/^\d+$/.test(id)) {
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
            [id]
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
        console.error("GET COLLECTION ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch collection"
        });
    }
};


/*
|--------------------------------------------------------------------------
| CREATE COLLECTION
|--------------------------------------------------------------------------
| POST /api/collections
|--------------------------------------------------------------------------
*/

export const createCollection = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            image_url,
            is_active
        } = req.body;

        const cleanName =
            typeof name === "string"
                ? name.trim()
                : "";

        const cleanSlug =
            typeof slug === "string"
                ? slug.trim().toLowerCase()
                : "";

        const cleanDescription =
            typeof description === "string"
                ? description.trim()
                : null;

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

        const [existingCollections] = await pool.execute(
            `
            SELECT id
            FROM collections
            WHERE slug = ?
            LIMIT 1
            `,
            [cleanSlug]
        );

        if (existingCollections.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A collection with this slug already exists"
            });
        }

        const activeValue =
            typeof is_active === "boolean"
                ? is_active
                : true;

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
                cleanDescription || null,
                image_url || null,
                activeValue
            ]
        );

        const [createdRows] = await pool.execute(
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
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Collection created successfully",

            collection: {
                ...createdRows[0],
                is_active: Boolean(
                    createdRows[0].is_active
                )
            }
        });

    } catch (error) {
        console.error("CREATE COLLECTION ERROR:");
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A collection with this slug already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create collection"
        });
    }
};


/*
|--------------------------------------------------------------------------
| UPDATE COLLECTION
|--------------------------------------------------------------------------
| PUT /api/collections/:id
|--------------------------------------------------------------------------
*/

export const updateCollection = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection ID"
            });
        }

        const [existingRows] = await pool.execute(
            `
            SELECT id
            FROM collections
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        const {
            name,
            slug,
            description,
            image_url,
            is_active
        } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                !name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Collection name cannot be empty"
                });
            }

            updates.push("name = ?");
            values.push(name.trim());
        }

        if (slug !== undefined) {
            if (
                typeof slug !== "string" ||
                !slug.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Collection slug cannot be empty"
                });
            }

            const cleanSlug =
                slug.trim().toLowerCase();

            const [duplicateRows] =
                await pool.execute(
                    `
                    SELECT id
                    FROM collections
                    WHERE slug = ?
                    AND id != ?
                    LIMIT 1
                    `,
                    [cleanSlug, id]
                );

            if (duplicateRows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A collection with this slug already exists"
                });
            }

            updates.push("slug = ?");
            values.push(cleanSlug);
        }

        if (description !== undefined) {
            updates.push("description = ?");

            values.push(
                typeof description === "string"
                    ? description.trim() || null
                    : null
            );
        }

        if (image_url !== undefined) {
            updates.push("image_url = ?");
            values.push(image_url || null);
        }

        if (is_active !== undefined) {
            updates.push("is_active = ?");
            values.push(Boolean(is_active));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        values.push(id);

        await pool.execute(
            `
            UPDATE collections
            SET ${updates.join(", ")}
            WHERE id = ?
            `,
            values
        );

        const [updatedRows] = await pool.execute(
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
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Collection updated successfully",

            collection: {
                ...updatedRows[0],
                is_active: Boolean(
                    updatedRows[0].is_active
                )
            }
        });

    } catch (error) {
        console.error("UPDATE COLLECTION ERROR:");
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "A collection with this slug already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update collection"
        });
    }
};


/*
|--------------------------------------------------------------------------
| DELETE COLLECTION
|--------------------------------------------------------------------------
| DELETE /api/collections/:id
|--------------------------------------------------------------------------
*/

export const deleteCollection = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection ID"
            });
        }

        const [existingRows] = await pool.execute(
            `
            SELECT
                id,
                name
            FROM collections
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        await pool.execute(
            `
            DELETE FROM collections
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Collection deleted successfully",

            collection: {
                id: existingRows[0].id,
                name: existingRows[0].name
            }
        });

    } catch (error) {
        console.error("DELETE COLLECTION ERROR:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete collection"
        });
    }
};