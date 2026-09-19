import pool from "../config/database.js";

// ======================================================
// GET USER ADDRESSES
// ======================================================

export const getAddresses = async (req, res) => {
    try {
        const [addresses] = await pool.execute(
            `
            SELECT
                id,
                user_id,
                full_name,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                is_default,
                created_at,
                updated_at
            FROM addresses
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
            `,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            count: addresses.length,
            addresses
        });

    } catch (error) {
        console.error(
            "Get addresses error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch addresses"
        });
    }
};

// ======================================================
// GET DEFAULT ADDRESS
// ======================================================

export const getDefaultAddress = async (req, res) => {
    try {
        const [addresses] = await pool.execute(
            `
            SELECT
                id,
                user_id,
                full_name,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                is_default,
                created_at,
                updated_at
            FROM addresses
            WHERE user_id = ?
              AND is_default = TRUE
            ORDER BY id DESC
            LIMIT 1
            `,
            [req.user.id]
        );

        if (addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Default address not found"
            });
        }

        return res.status(200).json({
            success: true,
            address: addresses[0]
        });

    } catch (error) {
        console.error(
            "Get default address error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch default address"
        });
    }
};

// ======================================================
// CREATE ADDRESS
// ======================================================

export const createAddress = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            full_name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country = "India",
            is_default = true
        } = req.body;

        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (
            !full_name ||
            !phone ||
            !address_line1 ||
            !city ||
            !state ||
            !postal_code
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Full name, phone, address, city, state and postal code are required"
            });
        }

        const cleanFullName =
            String(full_name).trim();

        const cleanPhone =
            String(phone).trim();

        const cleanAddressLine1 =
            String(address_line1).trim();

        const cleanAddressLine2 =
            address_line2
                ? String(address_line2).trim()
                : null;

        const cleanCity =
            String(city).trim();

        const cleanState =
            String(state).trim();

        const cleanPostalCode =
            String(postal_code).trim();

        const cleanCountry =
            String(country).trim() || "India";

        if (cleanFullName.length < 2) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Full name must contain at least 2 characters"
            });
        }

        if (cleanFullName.length > 100) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Full name must not exceed 100 characters"
            });
        }

        if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Phone number must contain 10 to 15 digits"
            });
        }

        if (!/^[0-9]{6}$/.test(cleanPostalCode)) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Postal code must contain exactly 6 digits"
            });
        }

        if (cleanAddressLine1.length > 255) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Address line 1 is too long"
            });
        }

        if (cleanAddressLine2 &&
            cleanAddressLine2.length > 255) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Address line 2 is too long"
            });
        }

        // ----------------------------------------------
        // TRANSACTION
        // ----------------------------------------------

        await connection.beginTransaction();

        // If this address is default,
        // remove default status from existing addresses
        if (is_default) {
            await connection.execute(
                `
                UPDATE addresses
                SET is_default = FALSE
                WHERE user_id = ?
                `,
                [req.user.id]
            );
        }

        // If this is the user's first address,
        // automatically make it default
        const [existingAddresses] =
            await connection.execute(
                `
                SELECT id
                FROM addresses
                WHERE user_id = ?
                LIMIT 1
                `,
                [req.user.id]
            );

        const makeDefault =
            existingAddresses.length === 0
                ? true
                : Boolean(is_default);

        const [result] =
            await connection.execute(
                `
                INSERT INTO addresses (
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    req.user.id,
                    cleanFullName,
                    cleanPhone,
                    cleanAddressLine1,
                    cleanAddressLine2,
                    cleanCity,
                    cleanState,
                    cleanPostalCode,
                    cleanCountry,
                    makeDefault
                ]
            );

        await connection.commit();

        const [addresses] =
            await pool.execute(
                `
                SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default,
                    created_at,
                    updated_at
                FROM addresses
                WHERE id = ?
                LIMIT 1
                `,
                [result.insertId]
            );

        connection.release();

        return res.status(201).json({
            success: true,
            message:
                "Address created successfully",
            address: addresses[0]
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error(
            "Create address error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create address"
        });
    }
};

// ======================================================
// UPDATE ADDRESS
// ======================================================

export const updateAddress = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

        const addressId = Number(id);

        if (
            !Number.isInteger(addressId) ||
            addressId <= 0
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        const {
            full_name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country = "India",
            is_default = true
        } = req.body;

        if (
            !full_name ||
            !phone ||
            !address_line1 ||
            !city ||
            !state ||
            !postal_code
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Full name, phone, address, city, state and postal code are required"
            });
        }

        const cleanFullName =
            String(full_name).trim();

        const cleanPhone =
            String(phone).trim();

        const cleanAddressLine1 =
            String(address_line1).trim();

        const cleanAddressLine2 =
            address_line2
                ? String(address_line2).trim()
                : null;

        const cleanCity =
            String(city).trim();

        const cleanState =
            String(state).trim();

        const cleanPostalCode =
            String(postal_code).trim();

        const cleanCountry =
            String(country).trim() || "India";

        if (cleanFullName.length < 2) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Full name must contain at least 2 characters"
            });
        }

        if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Phone number must contain 10 to 15 digits"
            });
        }

        if (!/^[0-9]{6}$/.test(cleanPostalCode)) {
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Postal code must contain exactly 6 digits"
            });
        }

        await connection.beginTransaction();

        // Make sure this address belongs to current user
        const [existingAddresses] =
            await connection.execute(
                `
                SELECT id
                FROM addresses
                WHERE id = ?
                  AND user_id = ?
                LIMIT 1
                `,
                [
                    addressId,
                    req.user.id
                ]
            );

        if (existingAddresses.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        if (is_default) {
            await connection.execute(
                `
                UPDATE addresses
                SET is_default = FALSE
                WHERE user_id = ?
                `,
                [req.user.id]
            );
        }

        await connection.execute(
            `
            UPDATE addresses
            SET
                full_name = ?,
                phone = ?,
                address_line1 = ?,
                address_line2 = ?,
                city = ?,
                state = ?,
                postal_code = ?,
                country = ?,
                is_default = ?
            WHERE id = ?
              AND user_id = ?
            `,
            [
                cleanFullName,
                cleanPhone,
                cleanAddressLine1,
                cleanAddressLine2,
                cleanCity,
                cleanState,
                cleanPostalCode,
                cleanCountry,
                Boolean(is_default),
                addressId,
                req.user.id
            ]
        );

        await connection.commit();

        const [addresses] =
            await pool.execute(
                `
                SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default,
                    created_at,
                    updated_at
                FROM addresses
                WHERE id = ?
                LIMIT 1
                `,
                [addressId]
            );

        connection.release();

        return res.status(200).json({
            success: true,
            message:
                "Address updated successfully",
            address: addresses[0]
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error(
            "Update address error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update address"
        });
    }
};

// ======================================================
// DELETE ADDRESS
// ======================================================

export const deleteAddress = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

        const addressId = Number(id);

        if (
            !Number.isInteger(addressId) ||
            addressId <= 0
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        await connection.beginTransaction();

        const [addresses] =
            await connection.execute(
                `
                SELECT
                    id,
                    is_default
                FROM addresses
                WHERE id = ?
                  AND user_id = ?
                LIMIT 1
                `,
                [
                    addressId,
                    req.user.id
                ]
            );

        if (addresses.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const wasDefault =
            Boolean(addresses[0].is_default);

        await connection.execute(
            `
            DELETE FROM addresses
            WHERE id = ?
              AND user_id = ?
            `,
            [
                addressId,
                req.user.id
            ]
        );

        // If default address was deleted,
        // make another address default
        if (wasDefault) {
            const [remainingAddresses] =
                await connection.execute(
                    `
                    SELECT id
                    FROM addresses
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [req.user.id]
                );

            if (
                remainingAddresses.length > 0
            ) {
                await connection.execute(
                    `
                    UPDATE addresses
                    SET is_default = TRUE
                    WHERE id = ?
                      AND user_id = ?
                    `,
                    [
                        remainingAddresses[0].id,
                        req.user.id
                    ]
                );
            }
        }

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message:
                "Address deleted successfully"
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error(
            "Delete address error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete address"
        });
    }
};

// ======================================================
// SET DEFAULT ADDRESS
// ======================================================

export const setDefaultAddress = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

        const addressId = Number(id);

        if (
            !Number.isInteger(addressId) ||
            addressId <= 0
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        await connection.beginTransaction();

        const [addresses] =
            await connection.execute(
                `
                SELECT id
                FROM addresses
                WHERE id = ?
                  AND user_id = ?
                LIMIT 1
                `,
                [
                    addressId,
                    req.user.id
                ]
            );

        if (addresses.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        await connection.execute(
            `
            UPDATE addresses
            SET is_default = FALSE
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        await connection.execute(
            `
            UPDATE addresses
            SET is_default = TRUE
            WHERE id = ?
              AND user_id = ?
            `,
            [
                addressId,
                req.user.id
            ]
        );

        await connection.commit();

        const [updatedAddresses] =
            await pool.execute(
                `
                SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default,
                    created_at,
                    updated_at
                FROM addresses
                WHERE id = ?
                LIMIT 1
                `,
                [addressId]
            );

        connection.release();

        return res.status(200).json({
            success: true,
            message:
                "Default address updated successfully",
            address:
                updatedAddresses[0]
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error(
            "Set default address error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to set default address"
        });
    }
};