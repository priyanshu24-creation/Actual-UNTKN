import pool from "../config/database.js";

const DEFAULT_DELIVERY_METHODS = [
    {
        id: "standard",
        name: "STANDARD DELIVERY",
        description: "5–7 BUSINESS DAYS",
        price: 99,
        isActive: true
    },
    {
        id: "express",
        name: "EXPRESS DELIVERY",
        description: "2–3 BUSINESS DAYS",
        price: 199,
        isActive: true
    }
];

let schemaReadyPromise = null;
let methodKeyColumn = "id";

const toBoolean = (value) => {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
};

const normalizeMethod = (row) => ({
    id:
        row.id ??
        row.method_id ??
        null,

    name:
        row.name ??
        "",

    description:
        row.description ??
        "",

    price:
        Number(
            row.price ?? 0
        ),

    isActive:
        toBoolean(
            row.is_active
        )
});

const getExistingColumns = async () => {
    const [rows] = await pool.execute(
        `
        SELECT
            COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'delivery_methods'
        ORDER BY ORDINAL_POSITION
        `
    );

    return rows.map(
        (row) =>
            row.COLUMN_NAME
    );
};

const ensureDeliveryMethodSchema = async () => {
    if (!schemaReadyPromise) {
        schemaReadyPromise = (async () => {

            await pool.execute(
                `
                CREATE TABLE IF NOT EXISTS delivery_methods (
                    id VARCHAR(50) NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    description VARCHAR(255) NULL,
                    price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id)
                )
                ENGINE=InnoDB
                DEFAULT CHARSET=utf8mb4
                COLLATE=utf8mb4_unicode_ci
                `
            );

            let columns =
                await getExistingColumns();

            if (
                columns.includes("id")
            ) {
                methodKeyColumn =
                    "id";
            } else if (
                columns.includes("method_id")
            ) {
                methodKeyColumn =
                    "method_id";
            } else {
                await pool.execute(
                    `
                    ALTER TABLE delivery_methods
                    ADD COLUMN id VARCHAR(50) NOT NULL
                    `
                );

                methodKeyColumn =
                    "id";

                columns =
                    await getExistingColumns();
            }

            if (
                !columns.includes(
                    "name"
                )
            ) {
                await pool.execute(
                    `
                    ALTER TABLE delivery_methods
                    ADD COLUMN name VARCHAR(150) NOT NULL DEFAULT ''
                    `
                );
            }

            if (
                !columns.includes(
                    "description"
                )
            ) {
                await pool.execute(
                    `
                    ALTER TABLE delivery_methods
                    ADD COLUMN description VARCHAR(255) NULL
                    `
                );
            }

            if (
                !columns.includes(
                    "price"
                )
            ) {
                await pool.execute(
                    `
                    ALTER TABLE delivery_methods
                    ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0
                    `
                );
            }

            if (
                !columns.includes(
                    "is_active"
                )
            ) {
                await pool.execute(
                    `
                    ALTER TABLE delivery_methods
                    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
                    `
                );
            }

            const [
                rows
            ] = await pool.execute(
                `
                SELECT COUNT(*) AS total
                FROM delivery_methods
                `
            );

            if (
                Number(
                    rows[0]?.total || 0
                ) === 0
            ) {
                for (
                    const method
                    of DEFAULT_DELIVERY_METHODS
                ) {
                    await pool.execute(
                        `
                        INSERT INTO delivery_methods
                        (
                            ${methodKeyColumn},
                            name,
                            description,
                            price,
                            is_active
                        )
                        VALUES (?, ?, ?, ?, ?)
                        `,
                        [
                            method.id,
                            method.name,
                            method.description,
                            method.price,
                            method.isActive
                                ? 1
                                : 0
                        ]
                    );
                }
            }

        })().catch(
            (error) => {
                schemaReadyPromise =
                    null;

                throw error;
            }
        );
    }

    return schemaReadyPromise;
};

export const getDeliveryMethods =
    async () => {

        await ensureDeliveryMethodSchema();

        const [
            rows
        ] = await pool.execute(
            `
            SELECT
                ${methodKeyColumn} AS method_key,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            WHERE is_active = 1
            ORDER BY
                CASE
                    WHEN ${methodKeyColumn} = 'standard'
                        THEN 1
                    WHEN ${methodKeyColumn} = 'express'
                        THEN 2
                    ELSE 3
                END,
                ${methodKeyColumn} ASC
            `
        );

        return rows.map(
            (row) => ({
                id:
                    row.method_key,

                name:
                    row.name || "",

                description:
                    row.description || "",

                price:
                    Number(
                        row.price || 0
                    ),

                isActive:
                    toBoolean(
                        row.is_active
                    )
            })
        );
    };

export const getAllDeliveryMethods =
    async () => {

        await ensureDeliveryMethodSchema();

        const [
            rows
        ] = await pool.execute(
            `
            SELECT
                ${methodKeyColumn} AS method_key,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            ORDER BY
                CASE
                    WHEN ${methodKeyColumn} = 'standard'
                        THEN 1
                    WHEN ${methodKeyColumn} = 'express'
                        THEN 2
                    ELSE 3
                END,
                ${methodKeyColumn} ASC
            `
        );

        return rows.map(
            (row) => ({
                id:
                    row.method_key,

                name:
                    row.name || "",

                description:
                    row.description || "",

                price:
                    Number(
                        row.price || 0
                    ),

                isActive:
                    toBoolean(
                        row.is_active
                    )
            })
        );
    };

export const updateDeliveryMethods =
    async (
        deliveryMethods
    ) => {

        await ensureDeliveryMethodSchema();

        if (
            !Array.isArray(
                deliveryMethods
            )
        ) {
            throw new Error(
                "deliveryMethods must be an array"
            );
        }

        if (
            deliveryMethods.length === 0
        ) {
            throw new Error(
                "At least one delivery method is required"
            );
        }

        const connection =
            await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (
                const method
                of deliveryMethods
            ) {
                const id =
                    String(
                        method?.id || ""
                    ).trim();

                if (!id) {
                    throw new Error(
                        "Every delivery method must have an id"
                    );
                }

                const name =
                    String(
                        method?.name ||
                        id
                    ).trim();

                const description =
                    String(
                        method?.description ||
                        ""
                    ).trim();

                const price =
                    Number(
                        method?.price ?? 0
                    );

                if (
                    !Number.isFinite(
                        price
                    ) ||
                    price < 0
                ) {
                    throw new Error(
                        `Invalid delivery price for ${id}`
                    );
                }

                const active =
                    method?.isActive === true ||
                    method?.isActive === 1 ||
                    method?.isActive === "1" ||
                    method?.isActive === "true";

                await connection.execute(
                    `
                    INSERT INTO delivery_methods
                    (
                        ${methodKeyColumn},
                        name,
                        description,
                        price,
                        is_active
                    )
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        description = VALUES(description),
                        price = VALUES(price),
                        is_active = VALUES(is_active)
                    `,
                    [
                        id,
                        name,
                        description,
                        Number(
                            price.toFixed(2)
                        ),
                        active
                            ? 1
                            : 0
                    ]
                );
            }

            await connection.commit();

            const [
                rows
            ] = await connection.execute(
                `
                SELECT
                    ${methodKeyColumn} AS method_key,
                    name,
                    description,
                    price,
                    is_active
                FROM delivery_methods
                ORDER BY
                    CASE
                        WHEN ${methodKeyColumn} = 'standard'
                            THEN 1
                        WHEN ${methodKeyColumn} = 'express'
                            THEN 2
                        ELSE 3
                    END,
                    ${methodKeyColumn} ASC
                `
            );

            return rows.map(
                (row) => ({
                    id:
                        row.method_key,

                    name:
                        row.name || "",

                    description:
                        row.description || "",

                    price:
                        Number(
                            row.price || 0
                        ),

                    isActive:
                        toBoolean(
                            row.is_active
                        )
                })
            );

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    };

export const getDeliveryMethodById =
    async (id) => {

        await ensureDeliveryMethodSchema();

        const [
            rows
        ] = await pool.execute(
            `
            SELECT
                ${methodKeyColumn} AS method_key,
                name,
                description,
                price,
                is_active
            FROM delivery_methods
            WHERE ${methodKeyColumn} = ?
            LIMIT 1
            `,
            [id]
        );

        if (
            rows.length === 0
        ) {
            return null;
        }

        return {
            id:
                rows[0].method_key,

            name:
                rows[0].name || "",

            description:
                rows[0].description || "",

            price:
                Number(
                    rows[0].price || 0
                ),

            isActive:
                toBoolean(
                    rows[0].is_active
                )
        };
    };