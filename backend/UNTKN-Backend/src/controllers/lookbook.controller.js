import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

let lookbookColumnsCache = null;

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

const getLookbookColumns = async () => {
    if (lookbookColumnsCache) {
        return lookbookColumnsCache;
    }

    const [rows] = await pool.execute("SHOW COLUMNS FROM lookbook");

    lookbookColumnsCache = rows.map((row) => row.Field);

    return lookbookColumnsCache;
};

const hasColumn = (columns, column) => {
    return columns.includes(column);
};

const resetLookbookColumnsCache = () => {
    lookbookColumnsCache = null;
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
                    return;
                }

                resolve(result);
            }
        );

        Readable.from(buffer).pipe(stream);
    });
};

const formatLookbookItem = (look) => ({
    id: look.id,
    title: look.title || "",
    subtitle: look.subtitle || "",
    description: look.description || "",
    image: look.image_url || "",
    image_url: look.image_url || "",
    link_url: look.link_url || "",
    displayOrder: Number(look.display_order ?? 1),
    display_order: Number(look.display_order ?? 1),
    isActive: Boolean(Number(look.is_active ?? 1)),
    is_active: Boolean(Number(look.is_active ?? 1)),
    created_at: look.created_at || null,
    updated_at: look.updated_at || null
});

const getAllLookbookRows = async (onlyActive = false) => {
    const columns = await getLookbookColumns();

    if (!hasColumn(columns, "id")) {
        throw new Error("The lookbook table is missing the id column");
    }

    const orderColumn = hasColumn(columns, "display_order")
        ? "display_order"
        : "id";

    let sql = "SELECT * FROM lookbook";
    const params = [];

    if (onlyActive && hasColumn(columns, "is_active")) {
        sql += " WHERE is_active = 1";
    }

    sql += ` ORDER BY ${orderColumn} ASC, id ASC`;

    const [rows] = await pool.execute(sql, params);

    return rows;
};

export const getLookbookItems = async (req, res) => {
    try {
        const looks = await getAllLookbookRows(false);

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
            message: "Failed to fetch lookbook items",
            error: error.message
        });
    }
};

export const getActiveLookbookItems = async (req, res) => {
    try {
        const looks = await getAllLookbookRows(true);

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
            message: "Failed to fetch active lookbook items",
            error: error.message
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

        const columns = await getLookbookColumns();

        if (!hasColumn(columns, "id")) {
            throw new Error("The lookbook table is missing the id column");
        }

        const [looks] = await pool.execute(
            "SELECT * FROM lookbook WHERE id = ?",
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
            message: "Failed to fetch lookbook item",
            error: error.message
        });
    }
};

export const createLookbookItem = async (req, res) => {
    try {
        const columns = await getLookbookColumns();

        if (!hasColumn(columns, "title")) {
            return res.status(500).json({
                success: false,
                message: "The lookbook table is missing the title column"
            });
        }

        if (!hasColumn(columns, "image_url")) {
            return res.status(500).json({
                success: false,
                message: "The lookbook table is missing the image_url column"
            });
        }

        const title = req.body?.title;
        const subtitle = req.body?.subtitle;
        const description = req.body?.description;
        const linkUrl = req.body?.link_url;
        const displayOrder = req.body?.display_order;
        const isActive = req.body?.is_active;

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

        if (!req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: "Uploaded image data is missing"
            });
        }

        const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

        if (!cloudinaryResult?.secure_url) {
            throw new Error("Cloudinary did not return a secure image URL");
        }

        const insertColumns = [];
        const placeholders = [];
        const values = [];

        if (hasColumn(columns, "title")) {
            insertColumns.push("title");
            placeholders.push("?");
            values.push(String(title).trim());
        }

        if (hasColumn(columns, "subtitle")) {
            insertColumns.push("subtitle");
            placeholders.push("?");
            values.push(
                subtitle !== undefined && String(subtitle).trim()
                    ? String(subtitle).trim()
                    : null
            );
        }

        if (hasColumn(columns, "description")) {
            insertColumns.push("description");
            placeholders.push("?");
            values.push(
                description !== undefined && String(description).trim()
                    ? String(description).trim()
                    : null
            );
        }

        if (hasColumn(columns, "image_url")) {
            insertColumns.push("image_url");
            placeholders.push("?");
            values.push(cloudinaryResult.secure_url);
        }

        if (hasColumn(columns, "link_url")) {
            insertColumns.push("link_url");
            placeholders.push("?");
            values.push(
                linkUrl !== undefined && String(linkUrl).trim()
                    ? String(linkUrl).trim()
                    : null
            );
        }

        if (hasColumn(columns, "display_order")) {
            const parsedOrder = Number(displayOrder);

            const order =
                Number.isInteger(parsedOrder) && parsedOrder > 0
                    ? parsedOrder
                    : 1;

            insertColumns.push("display_order");
            placeholders.push("?");
            values.push(order);
        }

        if (hasColumn(columns, "is_active")) {
            insertColumns.push("is_active");
            placeholders.push("?");
            values.push(parseBoolean(isActive, true) ? 1 : 0);
        }

        if (insertColumns.length === 0) {
            throw new Error("No valid columns available for Lookbook insert");
        }

        const sql = `
            INSERT INTO lookbook
            (${insertColumns.join(", ")})
            VALUES (${placeholders.join(", ")})
        `;

        const [result] = await pool.execute(sql, values);

        const [looks] = await pool.execute(
            "SELECT * FROM lookbook WHERE id = ?",
            [result.insertId]
        );

        if (looks.length === 0) {
            throw new Error("Lookbook item was created but could not be retrieved");
        }

        return res.status(201).json({
            success: true,
            message: "Lookbook item created successfully",
            look: formatLookbookItem(looks[0])
        });
    } catch (error) {
        console.error("CREATE LOOKBOOK ERROR");
        console.error(error);

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

        const columns = await getLookbookColumns();

        const [existing] = await pool.execute(
            "SELECT * FROM lookbook WHERE id = ?",
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
        } = req.body || {};

        const fields = [];
        const values = [];

        if (title !== undefined && hasColumn(columns, "title")) {
            if (!String(title).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Lookbook title cannot be empty"
                });
            }

            fields.push("title = ?");
            values.push(String(title).trim());
        }

        if (subtitle !== undefined && hasColumn(columns, "subtitle")) {
            fields.push("subtitle = ?");
            values.push(
                String(subtitle).trim() || null
            );
        }

        if (description !== undefined && hasColumn(columns, "description")) {
            fields.push("description = ?");
            values.push(
                String(description).trim() || null
            );
        }

        if (link_url !== undefined && hasColumn(columns, "link_url")) {
            fields.push("link_url = ?");
            values.push(
                String(link_url).trim() || null
            );
        }

        if (
            display_order !== undefined &&
            hasColumn(columns, "display_order")
        ) {
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

        if (is_active !== undefined && hasColumn(columns, "is_active")) {
            fields.push("is_active = ?");
            values.push(
                parseBoolean(is_active, true) ? 1 : 0
            );
        }

        if (req.file) {
            if (!hasColumn(columns, "image_url")) {
                return res.status(500).json({
                    success: false,
                    message: "The lookbook table is missing the image_url column"
                });
            }

            if (!req.file.buffer) {
                return res.status(400).json({
                    success: false,
                    message: "Uploaded image data is missing"
                });
            }

            const cloudinaryResult = await uploadToCloudinary(
                req.file.buffer
            );

            if (!cloudinaryResult?.secure_url) {
                throw new Error(
                    "Cloudinary did not return a secure image URL"
                );
            }

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
            "SELECT * FROM lookbook WHERE id = ?",
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

        const columns = await getLookbookColumns();

        if (!hasColumn(columns, "is_active")) {
            return res.status(500).json({
                success: false,
                message: "The lookbook table is missing the is_active column"
            });
        }

        const [looks] = await pool.execute(
            "SELECT id, is_active FROM lookbook WHERE id = ?",
            [numericId]
        );

        if (looks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lookbook item not found"
            });
        }

        const newStatus = Number(looks[0].is_active) === 1 ? 0 : 1;

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
            message: "Failed to update lookbook status",
            error: error.message
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
            "SELECT id FROM lookbook WHERE id = ?",
            [numericId]
        );

        if (looks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lookbook item not found"
            });
        }

        await pool.execute(
            "DELETE FROM lookbook WHERE id = ?",
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
            message: "Failed to delete lookbook item",
            error: error.message
        });
    }
};

export const refreshLookbookSchemaCache = async () => {
    resetLookbookColumnsCache();
    return getLookbookColumns();
};