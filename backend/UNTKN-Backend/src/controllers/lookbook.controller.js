import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const parseBoolean = (value, fallback = true) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    ) {
        return true;
    }

    if (
        value === false ||
        value === "false" ||
        value === 0 ||
        value === "0"
    ) {
        return false;
    }

    return fallback;
};

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "untkn/lookbook",
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
            .from(buffer)
            .pipe(stream);
    });
};

const formatLookbookItem = (look) => ({
    id: look.id,
    title: look.title,
    subtitle: look.subtitle,
    description: look.description,
    image: look.image_url,
    image_url: look.image_url,
    link_url: look.link_url,
    displayOrder: Number(look.display_order),
    display_order: Number(look.display_order),
    isActive: Boolean(look.is_active),
    is_active: Boolean(look.is_active),
    created_at: look.created_at,
    updated_at: look.updated_at
});

export const getLookbookItems = async (req, res) => {
    try {
        const [looks] = await pool.execute(
            `
            SELECT
                id,
                title,
                subtitle,
                description,
                image_url,
                link_url,
                display_order,
                is_active,
                created_at,
                updated_at
            FROM lookbook
            ORDER BY display_order ASC, id ASC
            `
        );

        return res.status(200).json({
            success: true,
            count: looks.length,
            looks: looks.map(formatLookbookItem)
        });
    } catch (error) {
        console.error("GET LOOKBOOK ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch lookbook items"
        });
    }
};

export const getActiveLookbookItems = async (req, res) => {
    try {
        const [looks] = await pool.execute(
            `
            SELECT
                id,
                title,
                subtitle,
                description,
                image_url,
                link_url,
                display_order,
                is_active,
                created_at,
                updated_at
            FROM lookbook
            WHERE is_active = 1
            ORDER BY display_order ASC, id ASC
            `
        );

        return res.status(200).json({
            success: true,
            count: looks.length,
            looks: looks.map(formatLookbookItem)
        });
    } catch (error) {
        console.error("GET ACTIVE LOOKBOOK ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch active lookbook items"
        });
    }
};

export const getLookbookItem = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid lookbook ID is required"
            });
        }

        const [looks] = await pool.execute(
            `
            SELECT
                id,
                title,
                subtitle,
                description,
                image_url,
                link_url,
                display_order,
                is_active,
                created_at,
                updated_at
            FROM lookbook
            WHERE id = ?
            `,
            [numericId]
        );

        if (looks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lookbook item not found"
            });
        }

        return res.status(200).json({
            success: true,
            look: formatLookbookItem(looks[0])
        });
    } catch (error) {
        console.error("GET LOOKBOOK ITEM ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch lookbook item"
        });
    }
};

export const createLookbookItem = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            description,
            link_url,
            display_order,
            is_active
        } = req.body;

        if (!title || !String(title).trim()) {
            return res.status(400).json({
                success: false,
                message: "Lookbook title is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Lookbook image is required"
            });
        }

        const cloudinaryResult =
            await uploadToCloudinary(req.file.buffer);

        const order =
            Number.isInteger(Number(display_order)) &&
            Number(display_order) > 0
                ? Number(display_order)
                : 1;

        const active =
            parseBoolean(is_active, true) ? 1 : 0;

        const [result] = await pool.execute(
            `
            INSERT INTO lookbook
            (
                title,
                subtitle,
                description,
                image_url,
                link_url,
                display_order,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                String(title).trim(),
                subtitle?.trim() || null,
                description?.trim() || null,
                cloudinaryResult.secure_url,
                link_url?.trim() || null,
                order,
                active
            ]
        );

        const [looks] = await pool.execute(
            `
            SELECT
                id,
                title,
                subtitle,
                description,
                image_url,
                link_url,
                display_order,
                is_active,
                created_at,
                updated_at
            FROM lookbook
            WHERE id = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Lookbook item created successfully",
            look: formatLookbookItem(looks[0])
        });
    } catch (error) {
        console.error("CREATE LOOKBOOK ERROR");
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message: "Failed to create lookbook item",
            error: error.message
        });
    }
};

export const updateLookbookItem = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid lookbook ID is required"
            });
        }

        const [existing] = await pool.execute(
            `
            SELECT
                id,
                image_url
            FROM lookbook
            WHERE id = ?
            `,
            [numericId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lookbook item not found"
            });
        }

        const {
            title,
            subtitle,
            description,
            link_url,
            display_order,
            is_active
        } = req.body;

        const fields = [];
        const values = [];

        if (title !== undefined) {
            if (!String(title).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Lookbook title cannot be empty"
                });
            }

            fields.push("title = ?");
            values.push(String(title).trim());
        }

        if (subtitle !== undefined) {
            fields.push("subtitle = ?");
            values.push(
                String(subtitle).trim() || null
            );
        }

        if (description !== undefined) {
            fields.push("description = ?");
            values.push(
                String(description).trim() || null
            );
        }

        if (link_url !== undefined) {
            fields.push("link_url = ?");
            values.push(
                String(link_url).trim() || null
            );
        }

        if (display_order !== undefined) {
            const order = Number(display_order);

            if (!Number.isInteger(order) || order <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Display order must be a positive number"
                });
            }

            fields.push("display_order = ?");
            values.push(order);
        }

        if (is_active !== undefined) {
            fields.push("is_active = ?");
            values.push(
                parseBoolean(is_active, true) ? 1 : 0
            );
        }

        if (req.file) {
            const cloudinaryResult =
                await uploadToCloudinary(req.file.buffer);

            fields.push("image_url = ?");
            values.push(cloudinaryResult.secure_url);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No changes provided"
            });
        }

        values.push(numericId);

        await pool.execute(
            `
            UPDATE lookbook
            SET ${fields.join(", ")}
            WHERE id = ?
            `,
            values
        );

        const [looks] = await pool.execute(
            `
            SELECT
                id,
                title,
                subtitle,
                description,
                image_url,
                link_url,
                display_order,
                is_active,
                created_at,
                updated_at
            FROM lookbook
            WHERE id = ?
            `,
            [numericId]
        );

        return res.status(200).json({
            success: true,
            message: "Lookbook item updated successfully",
            look: formatLookbookItem(looks[0])
        });
    } catch (error) {
        console.error("UPDATE LOOKBOOK ERROR");
        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message: "Failed to update lookbook item",
            error: error.message
        });
    }
};

export const toggleLookbookStatus = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid lookbook ID is required"
            });
        }

        const [looks] = await pool.execute(
            `
            SELECT
                id,
                is_active
            FROM lookbook
            WHERE id = ?
            `,
            [numericId]
        );

        if (looks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lookbook item not found"
            });
        }

        const newStatus =
            looks[0].is_active ? 0 : 1;

        await pool.execute(
            `
            UPDATE lookbook
            SET is_active = ?
            WHERE id = ?
            `,
            [newStatus, numericId]
        );

        return res.status(200).json({
            success: true,
            message: newStatus
                ? "Lookbook item is now visible"
                : "Lookbook item is now hidden",
            is_active: Boolean(newStatus),
            isActive: Boolean(newStatus)
        });
    } catch (error) {
        console.error("TOGGLE LOOKBOOK ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to update lookbook status"
        });
    }
};

export const deleteLookbookItem = async (req, res) => {
    try {
        const numericId = Number(req.params.id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid lookbook ID is required"
            });
        }

        const [looks] = await pool.execute(
            `
            SELECT id
            FROM lookbook
            WHERE id = ?
            `,
            [numericId]
        );

        if (looks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lookbook item not found"
            });
        }

        await pool.execute(
            `
            DELETE FROM lookbook
            WHERE id = ?
            `,
            [numericId]
        );

        return res.status(200).json({
            success: true,
            message: "Lookbook item deleted successfully"
        });
    } catch (error) {
        console.error("DELETE LOOKBOOK ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete lookbook item"
        });
    }
};