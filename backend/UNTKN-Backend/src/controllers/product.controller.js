import pool from "../config/database.js";

const ALLOWED_PRODUCT_TYPES = [
    "T-Shirts",
    "Hoodies",
    "Thermals",
    "Bottomwear"
];

const normalizeProductType = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return "T-Shirts";
    }

    const cleanValue = String(value).trim();

    return (
        ALLOWED_PRODUCT_TYPES.find(
            (item) =>
                item.toLowerCase() ===
                cleanValue.toLowerCase()
        ) || null
    );
};

const isValidPositiveInteger = (value) => {
    return (
        Number.isInteger(Number(value)) &&
        Number(value) > 0
    );
};

const isValidNonNegativeNumber = (value) => {
    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= 0
    );
};

const validateSlug = (slug) => {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
    );
};

const findCategory = async (categoryId) => {
    const [rows] = await pool.execute(
        `
            SELECT id, name, slug
            FROM categories
            WHERE id = ?
              AND is_active = TRUE
            LIMIT 1
        `,
        [categoryId]
    );

    return rows[0] || null;
};

const findCollection = async (collectionId) => {
    const [rows] = await pool.execute(
        `
            SELECT id, name, slug
            FROM collections
            WHERE id = ?
              AND is_active = TRUE
            LIMIT 1
        `,
        [collectionId]
    );

    return rows[0] || null;
};


// ======================================================
// GET ALL PRODUCTS
// Public
// ======================================================

export const getProducts = async (req, res) => {
    try {
        const {
            page = "1",
            limit = "10",
            category,
            type,
            collection,
            featured,
            search,
            min_price,
            max_price
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Page must be a positive integer"
            });
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber <= 0 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Limit must be between 1 and 100"
            });
        }

        const offset =
            (pageNumber - 1) *
            limitNumber;

        let whereClause = `
            WHERE p.published = TRUE
        `;

        const params = [];

        if (category !== undefined) {
            const cleanCategory =
                String(category)
                    .trim()
                    .toLowerCase();

            if (!cleanCategory) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category cannot be empty"
                });
            }

            whereClause += `
                AND c.slug = ?
            `;

            params.push(
                cleanCategory
            );
        }

        if (type !== undefined) {
            const productType =
                normalizeProductType(type);

            if (!productType) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product type. Allowed values: T-Shirts, Hoodies, Thermals, Bottomwear"
                });
            }

            whereClause += `
                AND p.product_type = ?
            `;

            params.push(
                productType
            );
        }

        if (collection !== undefined) {
            const cleanCollection =
                String(collection)
                    .trim()
                    .toLowerCase();

            if (!cleanCollection) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Collection cannot be empty"
                });
            }

            whereClause += `
                AND col.slug = ?
            `;

            params.push(
                cleanCollection
            );
        }

        if (featured !== undefined) {
            if (
                featured !== "true" &&
                featured !== "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Featured must be true or false"
                });
            }

            whereClause += `
                AND p.featured = ?
            `;

            params.push(
                featured === "true"
                    ? 1
                    : 0
            );
        }

        if (search !== undefined) {
            const cleanSearch =
                String(search).trim();

            if (cleanSearch) {
                whereClause += `
                    AND (
                        p.name LIKE ?
                        OR p.description LIKE ?
                        OR p.short_description LIKE ?
                    )
                `;

                const searchValue =
                    `%${cleanSearch}%`;

                params.push(
                    searchValue,
                    searchValue,
                    searchValue
                );
            }
        }

        if (min_price !== undefined) {
            const minPrice =
                Number(min_price);

            if (
                !Number.isFinite(
                    minPrice
                ) ||
                minPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum price must be a valid non-negative number"
                });
            }

            whereClause += `
                AND COALESCE(
                    p.sale_price,
                    p.base_price
                ) >= ?
            `;

            params.push(
                minPrice
            );
        }

        if (max_price !== undefined) {
            const maxPrice =
                Number(max_price);

            if (
                !Number.isFinite(
                    maxPrice
                ) ||
                maxPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum price must be a valid non-negative number"
                });
            }

            if (
                min_price !== undefined &&
                Number(min_price) >
                    maxPrice
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum price cannot be greater than maximum price"
                });
            }

            whereClause += `
                AND COALESCE(
                    p.sale_price,
                    p.base_price
                ) <= ?
            `;

            params.push(
                maxPrice
            );
        }

        const countQuery = `
            SELECT
                COUNT(*) AS total
            FROM products p

            LEFT JOIN categories c
                ON p.category_id = c.id

            LEFT JOIN collections col
                ON p.collection_id = col.id

            ${whereClause}
        `;

        const [countResult] =
            await pool.execute(
                countQuery,
                params
            );

        const total =
            Number(
                countResult[0]?.total || 0
            );

        const productsQuery = `
            SELECT
                p.*,

                pi.image_url,

                c.name AS category_name,
                c.slug AS category_slug,

                col.name AS collection_name,
                col.slug AS collection_slug

            FROM products p

            LEFT JOIN categories c
                ON p.category_id = c.id

            LEFT JOIN collections col
                ON p.collection_id = col.id

            LEFT JOIN (
                SELECT
                    product_id,
                    image_url
                FROM product_images
                WHERE is_primary = 1
            ) pi
                ON p.id = pi.product_id

            ${whereClause}

            ORDER BY
                p.created_at DESC

            LIMIT ?
            OFFSET ?
        `;

        const productParams = [
            ...params,
            limitNumber,
            offset
        ];

        const [products] =
            await pool.execute(
                productsQuery,
                productParams
            );

        const totalPages =
            Math.ceil(
                total /
                limitNumber
            );

        return res.status(200).json({
            success: true,

            count:
                products.length,

            pagination: {
                current_page:
                    pageNumber,

                per_page:
                    limitNumber,

                total_products:
                    total,

                total_pages:
                    totalPages,

                has_next_page:
                    pageNumber <
                    totalPages,

                has_previous_page:
                    pageNumber > 1
            },

            products
        });

    } catch (error) {
        console.error(
            "Get products error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch products"
        });
    }
};


// ======================================================
// GET PRODUCT BY SLUG
// Public
// ======================================================

export const getProductBySlug = async (
    req,
    res
) => {
    try {
        const { slug } =
            req.params;

        if (
            !slug ||
            !String(slug).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product slug is required"
            });
        }

        const cleanSlug =
            String(slug)
                .trim()
                .toLowerCase();

        const [products] =
            await pool.execute(
                `
                    SELECT
                        p.*,

                        c.name AS category_name,
                        c.slug AS category_slug,

                        col.name AS collection_name,
                        col.slug AS collection_slug

                    FROM products p

                    LEFT JOIN categories c
                        ON p.category_id = c.id

                    LEFT JOIN collections col
                        ON p.collection_id = col.id

                    WHERE p.slug = ?
                      AND p.published = TRUE

                    LIMIT 1
                `,
                [cleanSlug]
            );

        if (
            products.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found"
            });
        }

        const product =
            products[0];

        const [images] =
            await pool.execute(
                `
                    SELECT
                        id,
                        image_url,
                        public_id,
                        alt_text,
                        is_primary,
                        sort_order

                    FROM product_images

                    WHERE product_id = ?

                    ORDER BY
                        is_primary DESC,
                        sort_order ASC,
                        id ASC
                `,
                [product.id]
            );

        const [variants] =
            await pool.execute(
                `
                    SELECT
                        pv.id,
                        pv.sku,
                        pv.price,
                        pv.stock_quantity,
                        pv.active,
                        pv.size_id,
                        s.name AS size_name,
                        pv.color_id,
                        c.name AS color_name,
                        c.hex_code

                    FROM product_variants pv

                    LEFT JOIN sizes s
                        ON pv.size_id = s.id

                    LEFT JOIN colors c
                        ON pv.color_id = c.id

                    WHERE pv.product_id = ?
                      AND pv.active = TRUE

                    ORDER BY
                        pv.id ASC
                `,
                [product.id]
            );

        return res.status(200).json({
            success: true,

            product: {
                ...product,
                images,
                variants
            }
        });

    } catch (error) {
        console.error(
            "Get product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch product"
        });
    }
};


// ======================================================
// CREATE PRODUCT
// Admin only
// ======================================================

export const createProduct = async (
    req,
    res
) => {
    try {
        const {
            name,
            slug,
            category_id,
            product_type,
            collection_id,
            short_description,
            description,
            materials,
            care_instructions,
            base_price,
            sale_price,
            currency,
            published,
            featured,
            seo_title,
            seo_description
        } = req.body;

        if (
            typeof name !==
                "string" ||
            !name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product name is required"
            });
        }

        if (
            typeof slug !==
                "string" ||
            !slug.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product slug is required"
            });
        }

        if (
            base_price ===
                undefined ||
            base_price ===
                null ||
            base_price === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Base price is required"
            });
        }

        const cleanName =
            name.trim();

        const cleanSlug =
            slug.trim().toLowerCase();

        if (
            !validateSlug(
                cleanSlug
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Slug can contain only lowercase letters, numbers and hyphens"
            });
        }

        const basePrice =
            Number(base_price);

        if (
            !isValidNonNegativeNumber(
                basePrice
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Base price must be a valid non-negative number"
            });
        }

        const salePrice =
            sale_price !==
                undefined &&
            sale_price !== null &&
            sale_price !== ""
                ? Number(
                      sale_price
                  )
                : null;

        if (
            salePrice !== null &&
            !isValidNonNegativeNumber(
                salePrice
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Sale price must be a valid non-negative number"
            });
        }

        if (
            salePrice !== null &&
            salePrice >
                basePrice
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Sale price cannot be greater than base price"
            });
        }

        const cleanCurrency =
            currency
                ? String(currency)
                      .trim()
                      .toUpperCase()
                : "INR";

        if (
            !/^[A-Z]{3}$/.test(
                cleanCurrency
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Currency must be a valid 3-letter currency code"
            });
        }

        const finalProductType =
            normalizeProductType(
                product_type
            );

        if (!finalProductType) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid product type. Allowed values: T-Shirts, Hoodies, Thermals, Bottomwear"
            });
        }

        const finalPublished =
            published ===
                undefined
                ? false
                : published ===
                      true ||
                  published ===
                      "true";

        const finalFeatured =
            featured ===
                undefined
                ? false
                : featured ===
                      true ||
                  featured ===
                      "true";

        if (
            published !==
                undefined &&
            published !== true &&
            published !== false &&
            published !==
                "true" &&
            published !==
                "false"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Published must be true or false"
            });
        }

        if (
            featured !==
                undefined &&
            featured !== true &&
            featured !== false &&
            featured !==
                "true" &&
            featured !==
                "false"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Featured must be true or false"
            });
        }

        const [duplicate] =
            await pool.execute(
                `
                    SELECT id
                    FROM products
                    WHERE slug = ?
                    LIMIT 1
                `,
                [cleanSlug]
            );

        if (
            duplicate.length >
            0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Product slug already exists"
            });
        }

        let categoryId =
            null;

        if (
            category_id !==
                undefined &&
            category_id !==
                null &&
            category_id !== ""
        ) {
            if (
                !isValidPositiveInteger(
                    category_id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid category ID"
                });
            }

            const category =
                await findCategory(
                    Number(
                        category_id
                    )
                );

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid category"
                });
            }

            categoryId =
                Number(
                    category.id
                );
        }

        let collectionId =
            null;

        if (
            collection_id !==
                undefined &&
            collection_id !==
                null &&
            collection_id !== ""
        ) {
            if (
                !isValidPositiveInteger(
                    collection_id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid collection ID"
                });
            }

            const collection =
                await findCollection(
                    Number(
                        collection_id
                    )
                );

            if (!collection) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid collection"
                });
            }

            collectionId =
                Number(
                    collection.id
                );
        }

        const [result] =
            await pool.execute(
                `
                    INSERT INTO products (
                        name,
                        slug,
                        category_id,
                        product_type,
                        collection_id,
                        short_description,
                        description,
                        materials,
                        care_instructions,
                        base_price,
                        sale_price,
                        currency,
                        published,
                        featured,
                        seo_title,
                        seo_description
                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `,
                [
                    cleanName,
                    cleanSlug,
                    categoryId,
                    finalProductType,
                    collectionId,
                    typeof short_description ===
                        "string"
                        ? short_description.trim()
                        : null,
                    typeof description ===
                        "string"
                        ? description.trim()
                        : null,
                    typeof materials ===
                        "string"
                        ? materials.trim()
                        : null,
                    typeof care_instructions ===
                        "string"
                        ? care_instructions.trim()
                        : null,
                    basePrice,
                    salePrice,
                    cleanCurrency,
                    finalPublished,
                    finalFeatured,
                    typeof seo_title ===
                        "string"
                        ? seo_title.trim()
                        : null,
                    typeof seo_description ===
                        "string"
                        ? seo_description.trim()
                        : null
                ]
            );

        const [products] =
            await pool.execute(
                `
                    SELECT *
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message:
                "Product created successfully",
            product:
                products[0]
        });

    } catch (error) {
        console.error(
            "Create product error:",
            error
        );

        if (
            error?.code ===
                "ER_DUP_ENTRY" ||
            error?.errno ===
                1062
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Product slug already exists"
            });
        }

        if (
            error?.code ===
                "ER_BAD_FIELD_ERROR"
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Database schema is missing the product_type column"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create product",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined
        });
    }
};


// ======================================================
// UPDATE PRODUCT
// Admin only
// ======================================================

export const updateProduct = async (
    req,
    res
) => {
    try {
        const {
            id
        } = req.params;

        const productId =
            Number(id);

        if (
            !isValidPositiveInteger(
                productId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product ID must be a valid positive integer"
            });
        }

        const [existing] =
            await pool.execute(
                `
                    SELECT *
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                `,
                [productId]
            );

        if (
            existing.length ===
            0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found"
            });
        }

        const currentProduct =
            existing[0];

        const {
            name,
            slug,
            category_id,
            product_type,
            collection_id,
            short_description,
            description,
            materials,
            care_instructions,
            base_price,
            sale_price,
            currency,
            published,
            featured,
            seo_title,
            seo_description
        } = req.body;

        const fields = [];
        const values = [];

        if (
            name !== undefined
        ) {
            if (
                typeof name !==
                    "string" ||
                !name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product name must be a non-empty string"
                });
            }

            fields.push(
                "name = ?"
            );

            values.push(
                name.trim()
            );
        }

        if (
            slug !== undefined
        ) {
            if (
                typeof slug !==
                    "string" ||
                !slug.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product slug must be a non-empty string"
                });
            }

            const cleanSlug =
                slug.trim().toLowerCase();

            if (
                !validateSlug(
                    cleanSlug
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Slug can contain only lowercase letters, numbers and hyphens"
                });
            }

            const [duplicate] =
                await pool.execute(
                    `
                        SELECT id
                        FROM products
                        WHERE slug = ?
                          AND id != ?
                        LIMIT 1
                    `,
                    [
                        cleanSlug,
                        productId
                    ]
                );

            if (
                duplicate.length >
                0
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Product slug already exists"
                });
            }

            fields.push(
                "slug = ?"
            );

            values.push(
                cleanSlug
            );
        }

        if (
            category_id !==
                undefined
        ) {
            if (
                category_id ===
                    null ||
                category_id ===
                    ""
            ) {
                fields.push(
                    "category_id = ?"
                );

                values.push(
                    null
                );
            } else {
                if (
                    !isValidPositiveInteger(
                        category_id
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid category ID"
                    });
                }

                const category =
                    await findCategory(
                        Number(
                            category_id
                        )
                    );

                if (!category) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid category"
                    });
                }

                fields.push(
                    "category_id = ?"
                );

                values.push(
                    Number(
                        category.id
                    )
                );
            }
        }

        if (
            product_type !==
                undefined
        ) {
            const validProductType =
                normalizeProductType(
                    product_type
                );

            if (
                !validProductType
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product type. Allowed values: T-Shirts, Hoodies, Thermals, Bottomwear"
                });
            }

            fields.push(
                "product_type = ?"
            );

            values.push(
                validProductType
            );
        }

        if (
            collection_id !==
                undefined
        ) {
            if (
                collection_id ===
                    null ||
                collection_id ===
                    ""
            ) {
                fields.push(
                    "collection_id = ?"
                );

                values.push(
                    null
                );
            } else {
                if (
                    !isValidPositiveInteger(
                        collection_id
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid collection ID"
                    });
                }

                const collection =
                    await findCollection(
                        Number(
                            collection_id
                        )
                    );

                if (!collection) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid collection"
                    });
                }

                fields.push(
                    "collection_id = ?"
                );

                values.push(
                    Number(
                        collection.id
                    )
                );
            }
        }

        if (
            short_description !==
                undefined
        ) {
            fields.push(
                "short_description = ?"
            );

            values.push(
                typeof short_description ===
                    "string"
                    ? short_description.trim()
                    : null
            );
        }

        if (
            description !==
                undefined
        ) {
            fields.push(
                "description = ?"
            );

            values.push(
                typeof description ===
                    "string"
                    ? description.trim()
                    : null
            );
        }

        if (
            materials !==
                undefined
        ) {
            fields.push(
                "materials = ?"
            );

            values.push(
                typeof materials ===
                    "string"
                    ? materials.trim()
                    : null
            );
        }

        if (
            care_instructions !==
                undefined
        ) {
            fields.push(
                "care_instructions = ?"
            );

            values.push(
                typeof care_instructions ===
                    "string"
                    ? care_instructions.trim()
                    : null
            );
        }

        let finalBasePrice =
            Number(
                currentProduct.base_price
            );

        let finalSalePrice =
            currentProduct.sale_price ===
                null
                ? null
                : Number(
                      currentProduct.sale_price
                  );

        if (
            base_price !==
                undefined
        ) {
            const newBasePrice =
                Number(
                    base_price
                );

            if (
                !isValidNonNegativeNumber(
                    newBasePrice
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Base price must be a valid non-negative number"
                });
            }

            finalBasePrice =
                newBasePrice;

            fields.push(
                "base_price = ?"
            );

            values.push(
                newBasePrice
            );
        }

        if (
            sale_price !==
                undefined
        ) {
            const newSalePrice =
                sale_price ===
                    null ||
                sale_price ===
                    ""
                    ? null
                    : Number(
                          sale_price
                      );

            if (
                newSalePrice !==
                    null &&
                !isValidNonNegativeNumber(
                    newSalePrice
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Sale price must be a valid non-negative number"
                });
            }

            finalSalePrice =
                newSalePrice;

            fields.push(
                "sale_price = ?"
            );

            values.push(
                newSalePrice
            );
        }

        if (
            finalSalePrice !==
                null &&
            finalSalePrice >
                finalBasePrice
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Sale price cannot be greater than base price"
            });
        }

        if (
            currency !==
                undefined
        ) {
            if (
                typeof currency !==
                    "string" ||
                !currency.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Currency must be a valid 3-letter currency code"
                });
            }

            const cleanCurrency =
                currency
                    .trim()
                    .toUpperCase();

            if (
                !/^[A-Z]{3}$/.test(
                    cleanCurrency
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Currency must be a valid 3-letter currency code"
                });
            }

            fields.push(
                "currency = ?"
            );

            values.push(
                cleanCurrency
            );
        }

        if (
            published !==
                undefined
        ) {
            if (
                published !== true &&
                published !== false &&
                published !==
                    "true" &&
                published !==
                    "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Published must be true or false"
                });
            }

            fields.push(
                "published = ?"
            );

            values.push(
                published === true ||
                    published ===
                        "true"
            );
        }

        if (
            featured !==
                undefined
        ) {
            if (
                featured !== true &&
                featured !== false &&
                featured !==
                    "true" &&
                featured !==
                    "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Featured must be true or false"
                });
            }

            fields.push(
                "featured = ?"
            );

            values.push(
                featured === true ||
                    featured ===
                        "true"
            );
        }

        if (
            seo_title !==
                undefined
        ) {
            fields.push(
                "seo_title = ?"
            );

            values.push(
                typeof seo_title ===
                    "string"
                    ? seo_title.trim()
                    : null
            );
        }

        if (
            seo_description !==
                undefined
        ) {
            fields.push(
                "seo_description = ?"
            );

            values.push(
                typeof seo_description ===
                    "string"
                    ? seo_description.trim()
                    : null
            );
        }

        if (
            fields.length ===
            0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No fields provided for update"
            });
        }

        values.push(
            productId
        );

        await pool.execute(
            `
                UPDATE products
                SET ${fields.join(
                    ", "
                )}
                WHERE id = ?
            `,
            values
        );

        const [products] =
            await pool.execute(
                `
                    SELECT *
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                `,
                [productId]
            );

        return res.status(200).json({
            success: true,
            message:
                "Product updated successfully",
            product:
                products[0]
        });

    } catch (error) {
        console.error(
            "Update product error:",
            error
        );

        if (
            error?.code ===
                "ER_DUP_ENTRY" ||
            error?.errno ===
                1062
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Product slug already exists"
            });
        }

        if (
            error?.code ===
                "ER_BAD_FIELD_ERROR"
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Database schema is missing the product_type column"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update product",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined
        });
    }
};


// ======================================================
// DELETE PRODUCT
// Admin only
// ======================================================

export const deleteProduct = async (
    req,
    res
) => {
    let connection = null;

    try {
        const productId =
            Number(
                req.params.id
            );

        if (
            !isValidPositiveInteger(
                productId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product ID must be a valid positive integer"
            });
        }

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        const [existing] =
            await connection.execute(
                `
                    SELECT
                        id,
                        name,
                        slug
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                `,
                [productId]
            );

        if (
            existing.length ===
            0
        ) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Product not found"
            });
        }

        await connection.execute(
            `
                DELETE FROM products
                WHERE id = ?
            `,
            [productId]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message:
                "Product deleted permanently",
            productId
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {
            }
        }

        console.error(
            "Delete product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete product",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};