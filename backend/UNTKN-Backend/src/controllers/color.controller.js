import pool from "../config/database.js";

export const getColors = async (req, res) => {
    try {
        const [colors] = await pool.execute(
            `
            SELECT *
            FROM colors
            WHERE is_active = TRUE
            ORDER BY id ASC
            `
        );

        return res.status(200).json({
            success: true,
            count: colors.length,
            colors
        });
    } catch (error) {
        console.error("Get colors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch colors"
        });
    }
};


export const createColor = async (req, res) => {
    try {
        const {
            name,
            hex_code
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Color name is required"
            });
        }

        const cleanName = name.trim();

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM colors
            WHERE name = ?
            LIMIT 1
            `,
            [cleanName]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Color already exists"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO colors
                (name, hex_code)
            VALUES (?, ?)
            `,
            [
                cleanName,
                hex_code?.trim() || null
            ]
        );

        const [colors] = await pool.execute(
            `
            SELECT *
            FROM colors
            WHERE id = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Color created successfully",
            color: colors[0]
        });
    } catch (error) {
        console.error("Create color error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create color"
        });
    }
};


export const updateColor = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            hex_code,
            is_active
        } = req.body;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM colors
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Color not found"
            });
        }

        await pool.execute(
            `
            UPDATE colors
            SET
                name = COALESCE(?, name),
                hex_code = COALESCE(?, hex_code),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
            `,
            [
                name?.trim() || null,
                hex_code?.trim() || null,
                is_active !== undefined ? is_active : null,
                id
            ]
        );

        const [colors] = await pool.execute(
            `
            SELECT *
            FROM colors
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Color updated successfully",
            color: colors[0]
        });
    } catch (error) {
        console.error("Update color error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update color"
        });
    }
};


export const deleteColor = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM colors
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Color not found"
            });
        }

        await pool.execute(
            `
            UPDATE colors
            SET is_active = FALSE
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Color deleted successfully"
        });
    } catch (error) {
        console.error("Delete color error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete color"
        });
    }
};