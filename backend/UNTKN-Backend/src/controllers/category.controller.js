import pool from "../config/database.js";

export const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.execute(
            `SELECT
                id,
                name,
                slug,
                description,
                image_url,
                is_active,
                created_at,
                updated_at
             FROM categories
             WHERE is_active = TRUE
             ORDER BY name ASC`
        );

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};


export const getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const [categories] = await pool.execute(
            `SELECT
                id,
                name,
                slug,
                description,
                image_url,
                is_active,
                created_at,
                updated_at
             FROM categories
             WHERE slug = ?
             AND is_active = TRUE
             LIMIT 1`,
            [slug]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            category: categories[0]
        });
    } catch (error) {
        console.error("Get category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch category"
        });
    }
};


export const createCategory = async (req, res) => {
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

        const [existing] = await pool.execute(
            `SELECT id
             FROM categories
             WHERE name = ? OR slug = ?
             LIMIT 1`,
            [name.trim(), slug.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Category name or slug already exists"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO categories
                (name, slug, description, image_url)
             VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                slug.trim().toLowerCase(),
                description?.trim() || null,
                image_url?.trim() || null
            ]
        );

        const [categories] = await pool.execute(
            `SELECT *
             FROM categories
             WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category: categories[0]
        });
    } catch (error) {
        console.error("Create category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create category"
        });
    }
};


export const updateCategory = async (req, res) => {
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
             FROM categories
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        await pool.execute(
            `UPDATE categories
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

        const [categories] = await pool.execute(
            `SELECT *
             FROM categories
             WHERE id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: categories[0]
        });
    } catch (error) {
        console.error("Update category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update category"
        });
    }
};


export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            `SELECT id
             FROM categories
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        await pool.execute(
            `UPDATE categories
             SET is_active = FALSE
             WHERE id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error("Delete category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete category"
        });
    }
};