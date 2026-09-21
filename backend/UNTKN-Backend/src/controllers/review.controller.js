import pool from "../config/database.js";

export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const [reviews] = await pool.query(
            `SELECT
                id,
                product_id,
                user_id,
                name,
                email,
                rating,
                title,
                comment,
                is_approved,
                created_at,
                updated_at
             FROM reviews
             WHERE product_id = ? AND is_approved = 1
             ORDER BY created_at DESC`,
            [productId]
        );

        res.json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error("Get product reviews error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load product reviews"
        });
    }
};

export const createProductReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, email, rating, title, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "Rating and comment are required"
            });
        }

        const numericRating = Number(rating);

        if (numericRating < 1 || numericRating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        const [products] = await pool.query(
            "SELECT id FROM products WHERE id = ? LIMIT 1",
            [productId]
        );

        if (!products.length) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const userId = req.user?.id || null;

        const [result] = await pool.query(
            `INSERT INTO reviews
                (product_id, user_id, name, email, rating, title, comment, is_approved)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                productId,
                userId,
                name || null,
                email || null,
                numericRating,
                title || null,
                comment
            ]
        );

        const [reviews] = await pool.query(
            `SELECT
                id,
                product_id,
                user_id,
                name,
                email,
                rating,
                title,
                comment,
                is_approved,
                created_at,
                updated_at
             FROM reviews
             WHERE id = ?
             LIMIT 1`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review: reviews[0]
        });
    } catch (error) {
        console.error("Create product review error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit review"
        });
    }
};
