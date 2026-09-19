import pool from "../config/database.js";

export const getSizes = async (req, res) => {
    try {
        const [sizes] = await pool.execute(
            `
            SELECT *
            FROM sizes
            WHERE is_active = TRUE
            ORDER BY sort_order ASC, id ASC
            `
        );

        return res.status(200).json({
            success: true,
            count: sizes.length,
            sizes
        });
    } catch (error) {
        console.error("Get sizes error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch sizes"
        });
    }
};


export const createSize = async (req, res) => {
    try {
        const {
            name,
            sort_order
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Size name is required"
            });
        }

        const cleanName = name.trim();

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM sizes
            WHERE name = ?
            LIMIT 1
            `,
            [cleanName]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Size already exists"
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO sizes
                (name, sort_order)
            VALUES (?, ?)
            `,
            [
                cleanName,
                Number(sort_order) || 0
            ]
        );

        const [sizes] = await pool.execute(
            `
            SELECT *
            FROM sizes
            WHERE id = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Size created successfully",
            size: sizes[0]
        });
    } catch (error) {
        console.error("Create size error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create size"
        });
    }
};


export const updateSize = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            sort_order,
            is_active
        } = req.body;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM sizes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Size not found"
            });
        }

        await pool.execute(
            `
            UPDATE sizes
            SET
                name = COALESCE(?, name),
                sort_order = COALESCE(?, sort_order),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
            `,
            [
                name?.trim() || null,
                sort_order !== undefined ? Number(sort_order) : null,
                is_active !== undefined ? is_active : null,
                id
            ]
        );

        const [sizes] = await pool.execute(
            `
            SELECT *
            FROM sizes
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Size updated successfully",
            size: sizes[0]
        });
    } catch (error) {
        console.error("Update size error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update size"
        });
    }
};


export const deleteSize = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM sizes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Size not found"
            });
        }

        await pool.execute(
            `
            UPDATE sizes
            SET is_active = FALSE
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Size deleted successfully"
        });
    } catch (error) {
        console.error("Delete size error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete size"
        });
    }
};