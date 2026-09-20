import pool from "../config/database.js";

export const getDeliveryMethods = async (req, res) => {
    try {
        const [methods] = await pool.execute(
            `
            SELECT
                id,
                method_id,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            WHERE is_active = 1
            ORDER BY id ASC
            `
        );

        return res.status(200).json({
            success: true,
            deliveryMethods: methods.map((method) => ({
                id: method.method_id,
                name: method.name,
                description: method.description,
                price: Number(method.price),
                isActive: Boolean(method.is_active)
            }))
        });
    } catch (error) {
        console.error("GET DELIVERY METHODS ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch delivery methods"
        });
    }
};

export const getAdminDeliveryMethods = async (req, res) => {
    try {
        const [methods] = await pool.execute(
            `
            SELECT
                id,
                method_id,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            ORDER BY id ASC
            `
        );

        return res.status(200).json({
            success: true,
            deliveryMethods: methods.map((method) => ({
                id: method.method_id,
                name: method.name,
                description: method.description,
                price: Number(method.price),
                isActive: Boolean(method.is_active)
            }))
        });
    } catch (error) {
        console.error("GET ADMIN DELIVERY METHODS ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch delivery settings"
        });
    }
};

export const updateDeliveryMethods = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { deliveryMethods } = req.body;

        if (!Array.isArray(deliveryMethods)) {
            return res.status(400).json({
                success: false,
                message: "deliveryMethods must be an array"
            });
        }

        await connection.beginTransaction();

        for (const method of deliveryMethods) {
            if (!method.id) {
                continue;
            }

            const price = Number(method.price);

            if (!Number.isFinite(price) || price < 0) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: `Invalid delivery price for ${method.id}`
                });
            }

            await connection.execute(
                `
                UPDATE delivery_methods
                SET
                    price = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE method_id = ?
                `,
                [
                    price,
                    method.id
                ]
            );
        }

        await connection.commit();

        const [methods] = await connection.execute(
            `
            SELECT
                id,
                method_id,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            ORDER BY id ASC
            `
        );

        return res.status(200).json({
            success: true,
            message: "Delivery settings updated successfully",
            deliveryMethods: methods.map((method) => ({
                id: method.method_id,
                name: method.name,
                description: method.description,
                price: Number(method.price),
                isActive: Boolean(method.is_active)
            }))
        });
    } catch (error) {
        await connection.rollback();

        console.error("UPDATE DELIVERY METHODS ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to update delivery settings"
        });
    } finally {
        connection.release();
    }
};