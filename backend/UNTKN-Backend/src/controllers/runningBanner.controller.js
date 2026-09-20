import pool from "../config/database.js";

const formatSettings = (settings) => ({
    enabled: Boolean(settings.enabled),
    messages: [
        settings.message_1 || "",
        settings.message_2 || "",
        settings.message_3 || ""
    ]
});

export const getRunningBanner = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `
            SELECT
                id,
                enabled,
                message_1,
                message_2,
                message_3
            FROM running_banner_settings
            ORDER BY id ASC
            LIMIT 1
            `
        );

        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                settings: {
                    enabled: true,
                    messages: [
                        "FREE SHIPPING ON ORDERS ABOVE ₹999",
                        "NEW DROP LIVE NOW",
                        "EASY RETURNS"
                    ]
                }
            });
        }

        return res.status(200).json({
            success: true,
            settings: formatSettings(rows[0])
        });
    } catch (error) {
        console.error(
            "GET RUNNING BANNER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch running banner settings"
        });
    }
};

export const updateRunningBanner = async (req, res) => {
    try {
        const {
            enabled,
            messages
        } = req.body;

        if (!Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                message: "Messages must be an array"
            });
        }

        if (messages.length !== 3) {
            return res.status(400).json({
                success: false,
                message: "Exactly 3 banner messages are required"
            });
        }

        const cleanedMessages = messages.map(
            (message) =>
                String(message || "")
                    .trim()
                    .slice(0, 80)
        );

        if (
            cleanedMessages.some(
                (message) => !message
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "All banner messages are required"
            });
        }

        const bannerEnabled =
            enabled === true ||
            enabled === 1 ||
            enabled === "1";

        const [existingRows] = await pool.execute(
            `
            SELECT id
            FROM running_banner_settings
            ORDER BY id ASC
            LIMIT 1
            `
        );

        if (existingRows.length === 0) {
            await pool.execute(
                `
                INSERT INTO running_banner_settings (
                    enabled,
                    message_1,
                    message_2,
                    message_3
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    bannerEnabled ? 1 : 0,
                    cleanedMessages[0],
                    cleanedMessages[1],
                    cleanedMessages[2]
                ]
            );
        } else {
            await pool.execute(
                `
                UPDATE running_banner_settings
                SET
                    enabled = ?,
                    message_1 = ?,
                    message_2 = ?,
                    message_3 = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [
                    bannerEnabled ? 1 : 0,
                    cleanedMessages[0],
                    cleanedMessages[1],
                    cleanedMessages[2],
                    existingRows[0].id
                ]
            );
        }

        const [rows] = await pool.execute(
            `
            SELECT
                id,
                enabled,
                message_1,
                message_2,
                message_3
            FROM running_banner_settings
            ORDER BY id ASC
            LIMIT 1
            `
        );

        return res.status(200).json({
            success: true,
            message: "Running banner settings updated successfully",
            settings: formatSettings(rows[0])
        });
    } catch (error) {
        console.error(
            "UPDATE RUNNING BANNER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update running banner settings"
        });
    }
};