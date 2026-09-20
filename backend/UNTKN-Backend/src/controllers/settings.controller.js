import pool from "../config/database.js";

const mapSettings = (row) => ({
    id: Number(row.id),

    storeName: row.store_name,
    tagline: row.tagline,

    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,

    instagram: row.instagram,
    facebook: row.facebook,
    youtube: row.youtube,
    website: row.website,

    currency: row.currency,
    currencySymbol: row.currency_symbol,

    freeShipping: String(row.free_shipping),
    shippingCharge: String(row.shipping_charge),

    contactEnabled: Boolean(row.contact_enabled),
    newsletterEnabled: Boolean(row.newsletter_enabled),
    maintenanceMode: Boolean(row.maintenance_mode),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapPublicSettings = (row) => ({
    storeName: row.store_name,
    tagline: row.tagline,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    instagram: row.instagram,
    facebook: row.facebook,
    youtube: row.youtube,
    website: row.website,
    contactEnabled: Boolean(row.contact_enabled),
    newsletterEnabled: Boolean(row.newsletter_enabled),
});

export const getPublicSettings = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                store_name,
                tagline,
                email,
                phone,
                whatsapp,
                address,
                instagram,
                facebook,
                youtube,
                website,
                contact_enabled,
                newsletter_enabled
            FROM store_settings
            ORDER BY id ASC
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Store settings not found",
            });
        }

        return res.status(200).json({
            success: true,
            settings: mapPublicSettings(rows[0]),
        });
    } catch (error) {
        console.error("Get public settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch public store settings",
        });
    }
};

export const getSettings = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT *
            FROM store_settings
            ORDER BY id ASC
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Store settings not found",
            });
        }

        return res.status(200).json({
            success: true,
            settings: mapSettings(rows[0]),
        });
    } catch (error) {
        console.error("Get settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch store settings",
        });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const {
            storeName,
            tagline,
            email,
            phone,
            whatsapp,
            address,
            instagram,
            facebook,
            youtube,
            website,
            currency,
            currencySymbol,
            freeShipping,
            shippingCharge,
            contactEnabled,
            newsletterEnabled,
            maintenanceMode,
        } = req.body;

        if (!storeName || !String(storeName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Store name is required",
            });
        }

        if (!currency || !String(currency).trim()) {
            return res.status(400).json({
                success: false,
                message: "Currency is required",
            });
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                String(email).trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        const shippingFree = Number(freeShipping);
        const shippingChargeValue = Number(shippingCharge);

        if (
            Number.isNaN(shippingFree) ||
            shippingFree < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Free shipping amount must be a valid number",
            });
        }

        if (
            Number.isNaN(shippingChargeValue) ||
            shippingChargeValue < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Shipping charge must be a valid number",
            });
        }

        const [rows] = await pool.execute(`
            SELECT id
            FROM store_settings
            ORDER BY id ASC
            LIMIT 1
        `);

        if (rows.length === 0) {
            const [result] = await pool.execute(
                `
                INSERT INTO store_settings (
                    store_name,
                    tagline,
                    email,
                    phone,
                    whatsapp,
                    address,
                    instagram,
                    facebook,
                    youtube,
                    website,
                    currency,
                    currency_symbol,
                    free_shipping,
                    shipping_charge,
                    contact_enabled,
                    newsletter_enabled,
                    maintenance_mode
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    storeName.trim(),
                    tagline ? String(tagline).trim() : null,
                    email ? String(email).trim() : null,
                    phone ? String(phone).trim() : null,
                    whatsapp ? String(whatsapp).trim() : null,
                    address ? String(address).trim() : null,
                    instagram ? String(instagram).trim() : null,
                    facebook ? String(facebook).trim() : null,
                    youtube ? String(youtube).trim() : null,
                    website ? String(website).trim() : null,
                    currency.trim(),
                    currencySymbol ? String(currencySymbol).trim() : "",
                    shippingFree,
                    shippingChargeValue,
                    Boolean(contactEnabled),
                    Boolean(newsletterEnabled),
                    Boolean(maintenanceMode),
                ]
            );

            const [created] = await pool.execute(
                `
                SELECT *
                FROM store_settings
                WHERE id = ?
                `,
                [result.insertId]
            );

            return res.status(201).json({
                success: true,
                message: "Store settings created successfully",
                settings: mapSettings(created[0]),
            });
        }

        const settingsId = rows[0].id;

        await pool.execute(
            `
            UPDATE store_settings
            SET
                store_name = ?,
                tagline = ?,
                email = ?,
                phone = ?,
                whatsapp = ?,
                address = ?,
                instagram = ?,
                facebook = ?,
                youtube = ?,
                website = ?,
                currency = ?,
                currency_symbol = ?,
                free_shipping = ?,
                shipping_charge = ?,
                contact_enabled = ?,
                newsletter_enabled = ?,
                maintenance_mode = ?
            WHERE id = ?
            `,
            [
                storeName.trim(),
                tagline ? String(tagline).trim() : null,
                email ? String(email).trim() : null,
                phone ? String(phone).trim() : null,
                whatsapp ? String(whatsapp).trim() : null,
                address ? String(address).trim() : null,
                instagram ? String(instagram).trim() : null,
                facebook ? String(facebook).trim() : null,
                youtube ? String(youtube).trim() : null,
                website ? String(website).trim() : null,
                currency.trim(),
                currencySymbol ? String(currencySymbol).trim() : "",
                shippingFree,
                shippingChargeValue,
                Boolean(contactEnabled),
                Boolean(newsletterEnabled),
                Boolean(maintenanceMode),
                settingsId,
            ]
        );

        const [updated] = await pool.execute(
            `
            SELECT *
            FROM store_settings
            WHERE id = ?
            `,
            [settingsId]
        );

        return res.status(200).json({
            success: true,
            message: "Store settings updated successfully",
            settings: mapSettings(updated[0]),
        });
    } catch (error) {
        console.error("Update settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update store settings",
        });
    }
};