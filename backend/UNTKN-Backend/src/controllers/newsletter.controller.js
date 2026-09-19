import pool from "../config/database.js";


// ======================================================
// ADMIN - GET ALL NEWSLETTER SUBSCRIBERS
// ======================================================

export const getNewsletterSubscribers = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                source,
                active,
                created_at,
                updated_at
            FROM newsletter_subscribers
            ORDER BY created_at DESC
            `
        );

        const subscribers = rows.map((subscriber) => ({
            id: Number(subscriber.id),

            name:
                subscriber.name ||
                subscriber.email.split("@")[0],

            email: subscriber.email,

            source:
                subscriber.source || null,

            status:
                subscriber.active
                    ? "Subscribed"
                    : "Unsubscribed",

            subscribed: subscriber.created_at,

            active: Boolean(subscriber.active),

            created_at: subscriber.created_at,

            updated_at: subscriber.updated_at,
        }));

        return res.status(200).json({
            success: true,
            count: subscribers.length,
            subscribers,
        });

    } catch (error) {
        console.error(
            "Get newsletter subscribers error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch newsletter subscribers",
        });
    }
};


// ======================================================
// PUBLIC - SUBSCRIBE TO NEWSLETTER
// ======================================================

export const subscribeToNewsletter = async (req, res) => {
    try {
        const {
            name,
            email,
            source,
        } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email",
            });
        }

        const [existing] = await pool.execute(
            `
            SELECT
                id,
                active
            FROM newsletter_subscribers
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        // Existing subscriber
        if (existing.length > 0) {

            const subscriber =
                existing[0];

            // Already subscribed
            if (subscriber.active) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already subscribed",
                });
            }

            // Re-subscribe
            await pool.execute(
                `
                UPDATE newsletter_subscribers
                SET
                    name = ?,
                    source = ?,
                    active = TRUE
                WHERE id = ?
                `,
                [
                    name || null,
                    source || null,
                    subscriber.id,
                ]
            );

            return res.status(200).json({
                success: true,
                message:
                    "You have been subscribed again",
            });
        }

        // New subscriber
        const [result] =
            await pool.execute(
                `
                INSERT INTO newsletter_subscribers
                    (
                        name,
                        email,
                        source,
                        active
                    )
                VALUES (?, ?, ?, TRUE)
                `,
                [
                    name || null,
                    normalizedEmail,
                    source || null,
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "Successfully subscribed to newsletter",
            subscriber_id:
                Number(result.insertId),
        });

    } catch (error) {
        console.error(
            "Newsletter subscription error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to subscribe to newsletter",
        });
    }
};


// ======================================================
// ADMIN - UPDATE SUBSCRIBER STATUS
// ======================================================

export const updateNewsletterSubscriber =
    async (req, res) => {

        try {
            const { id } = req.params;
            const { active } = req.body;

            if (!id || !/^\d+$/.test(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid subscriber ID is required",
                });
            }

            if (typeof active !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Active status must be true or false",
                });
            }

            const [existing] =
                await pool.execute(
                    `
                    SELECT id
                    FROM newsletter_subscribers
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [id]
                );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Subscriber not found",
                });
            }

            await pool.execute(
                `
                UPDATE newsletter_subscribers
                SET active = ?
                WHERE id = ?
                `,
                [
                    active,
                    id,
                ]
            );

            return res.status(200).json({
                success: true,
                message:
                    active
                        ? "Subscriber activated"
                        : "Subscriber unsubscribed",
            });

        } catch (error) {
            console.error(
                "Update newsletter subscriber error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update subscriber",
            });
        }
    };


// ======================================================
// ADMIN - DELETE SUBSCRIBER
// ======================================================

export const deleteNewsletterSubscriber =
    async (req, res) => {

        try {
            const { id } = req.params;

            if (!id || !/^\d+$/.test(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid subscriber ID is required",
                });
            }

            const [existing] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        email
                    FROM newsletter_subscribers
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [id]
                );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Subscriber not found",
                });
            }

            await pool.execute(
                `
                DELETE FROM newsletter_subscribers
                WHERE id = ?
                `,
                [id]
            );

            return res.status(200).json({
                success: true,
                message:
                    "Subscriber removed successfully",
            });

        } catch (error) {
            console.error(
                "Delete newsletter subscriber error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete subscriber",
            });
        }
    };