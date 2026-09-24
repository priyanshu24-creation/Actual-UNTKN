import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Package,
    RefreshCw,
    Tag,
    CalendarDays,
    Clock3,
    Copy,
    Power,
    X,
    Sparkles
} from "lucide-react";

import api from "../../services/api.js";

const EMPTY_COUPON_FORM = {
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_discount_amount: "",
    start_mode: "now",
    starts_at: "",
    expiry_mode: "never",
    expires_at: "",
    usage_limit: "",
    per_user_limit: "1",
    first_order_only: false,
    scope_type: "all",
    scope_id: "",
    is_active: true
};

function AdminProducts() {
    const [productList, setProductList] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    const [coupons, setCoupons] = useState([]);
    const [couponLoading, setCouponLoading] = useState(true);
    const [couponError, setCouponError] = useState("");
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [couponSubmitting, setCouponSubmitting] = useState(false);
    const [couponForm, setCouponForm] = useState(
        EMPTY_COUPON_FORM
    );
    const [editingCouponId, setEditingCouponId] =
        useState(null);
    const [categoriesData, setCategoriesData] =
        useState([]);
    const [collectionsData, setCollectionsData] =
        useState([]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/products",
                {
                    params: {
                        page: 1,
                        limit: 100
                    }
                }
            );

            const data = response.data;

            const products =
                data?.products ||
                data?.data?.products ||
                data?.data ||
                [];

            setProductList(
                Array.isArray(products)
                    ? products
                    : []
            );
        } catch (err) {
            console.error(
                "Failed to load products:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load products."
            );

            setProductList([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoupons = async () => {
        try {
            setCouponLoading(true);
            setCouponError("");

            const response = await api.get(
                "/coupons/admin"
            );

            const list =
                response.data?.coupons ||
                response.data?.data?.coupons ||
                [];

            setCoupons(
                Array.isArray(list)
                    ? list
                    : []
            );
        } catch (err) {
            console.error(
                "Failed to load coupons:",
                err
            );

            setCouponError(
                err?.response?.data?.message ||
                    "Failed to load coupons."
            );
        } finally {
            setCouponLoading(false);
        }
    };

    const fetchCouponOptions = async () => {
        try {
            const [
                categoriesResponse,
                collectionsResponse
            ] = await Promise.all([
                api.get("/categories"),
                api.get("/collections")
            ]);

            const categories =
                categoriesResponse.data?.categories ||
                categoriesResponse.data?.data?.categories ||
                categoriesResponse.data?.data ||
                [];

            const collections =
                collectionsResponse.data?.collections ||
                collectionsResponse.data?.data?.collections ||
                collectionsResponse.data?.data ||
                [];

            setCategoriesData(
                Array.isArray(categories)
                    ? categories
                    : []
            );

            setCollectionsData(
                Array.isArray(collections)
                    ? collections
                    : []
            );
        } catch (err) {
            console.error(
                "Failed to load coupon options:",
                err
            );
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCoupons();
        fetchCouponOptions();
    }, []);

    const categories = useMemo(() => {
        const names = productList
            .map((product) => {
                if (
                    typeof product.category ===
                    "object"
                ) {
                    return product.category?.name;
                }

                return (
                    product.category ||
                    product.category_name ||
                    product.categoryName
                );
            })
            .filter(Boolean);

        return [
            "All",
            ...new Set(names)
        ];
    }, [productList]);

    const filteredProducts = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return productList.filter(
            (product) => {
                const name = String(
                    product.name || ""
                ).toLowerCase();

                const slug = String(
                    product.slug || ""
                ).toLowerCase();

                const sku = String(
                    product.sku ||
                        product.product_sku ||
                        ""
                ).toLowerCase();

                const categoryName =
                    getCategory(product).toLowerCase();

                const collectionName =
                    getCollection(
                        product
                    ).toLowerCase();

                const matchesSearch =
                    !searchValue ||
                    name.includes(
                        searchValue
                    ) ||
                    slug.includes(
                        searchValue
                    ) ||
                    sku.includes(
                        searchValue
                    ) ||
                    categoryName.includes(
                        searchValue
                    ) ||
                    collectionName.includes(
                        searchValue
                    );

                const matchesCategory =
                    category === "All" ||
                    categoryName ===
                        category.toLowerCase();

                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );
    }, [
        productList,
        search,
        category
    ]);

    const handleDelete = async (id) => {
        const product =
            productList.find(
                (item) => item.id === id
            );

        if (!product) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete "${product.name}"? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(id);
            setError("");

            await api.delete(
                `/products/${id}`
            );

            setProductList(
                (current) =>
                    current.filter(
                        (item) =>
                            item.id !== id
                    )
            );
        } catch (err) {
            console.error(
                "Failed to delete product:",
                err
            );

            setError(
                err?.response?.data
                    ?.message ||
                    "Failed to delete product."
            );
        } finally {
            setDeletingId(null);
        }
    };

    function getCategory(product) {
        if (
            typeof product.category ===
            "object"
        ) {
            return (
                product.category?.name ||
                "Uncategorized"
            );
        }

        return (
            product.category ||
            product.category_name ||
            product.categoryName ||
            "Uncategorized"
        );
    }

    function getCollection(product) {
        if (
            typeof product.collection ===
            "object"
        ) {
            return (
                product.collection?.name ||
                ""
            );
        }

        return (
            product.collection ||
            product.collection_name ||
            product.collectionName ||
            ""
        );
    }

    function getImage(product) {
        if (
            product.image &&
            typeof product.image ===
                "string"
        ) {
            return product.image;
        }

        if (
            product.primary_image &&
            typeof product.primary_image ===
                "string"
        ) {
            return product.primary_image;
        }

        if (
            product.primaryImage &&
            typeof product.primaryImage ===
                "string"
        ) {
            return product.primaryImage;
        }

        if (
            product.image_url &&
            typeof product.image_url ===
                "string"
        ) {
            return product.image_url;
        }

        if (
            product.imageUrl &&
            typeof product.imageUrl ===
                "string"
        ) {
            return product.imageUrl;
        }

        if (
            Array.isArray(
                product.images
            )
        ) {
            const firstImage =
                product.images.find(
                    (item) => {
                        if (
                            typeof item ===
                            "string"
                        ) {
                            return item;
                        }

                        return (
                            item?.image_url ||
                            item?.imageUrl ||
                            item?.url
                        );
                    }
                );

            if (
                typeof firstImage ===
                "string"
            ) {
                return firstImage;
            }

            return (
                firstImage?.image_url ||
                firstImage?.imageUrl ||
                firstImage?.url ||
                ""
            );
        }

        return "";
    }

    function getOldPrice(product) {
        return (
            product.old_price ??
            product.oldPrice ??
            product.compare_at_price ??
            product.compareAtPrice ??
            product.base_price ??
            product.price ??
            0
        );
    }

    function getPrice(product) {
        return (
            product.sale_price ??
            product.salePrice ??
            product.final_price ??
            product.finalPrice ??
            product.price ??
            0
        );
    }

    function getSizes(product) {
        if (
            Array.isArray(
                product.sizes
            )
        ) {
            return product.sizes;
        }

        if (
            Array.isArray(
                product.variants
            )
        ) {
            return [
                ...new Set(
                    product.variants
                        .map(
                            (variant) => {
                                if (
                                    typeof variant.size ===
                                    "object"
                                ) {
                                    return variant
                                        .size
                                        ?.name;
                                }

                                return (
                                    variant.size ||
                                    variant.size_name ||
                                    variant.sizeName
                                );
                            }
                        )
                        .filter(Boolean)
                )
            ];
        }

        return [];
    }

    function getStock(product) {
        if (
            Array.isArray(
                product.variants
            )
        ) {
            return product.variants.reduce(
                (
                    total,
                    variant
                ) =>
                    total +
                    Number(
                        variant.stock_quantity ??
                            variant.stock ??
                            0
                    ),
                0
            );
        }

        return Number(
            product.stock_quantity ??
                product.stock ??
                0
        );
    }

    function getStatus(product) {
        if (
            product.is_active ===
                false ||
            product.is_active === 0
        ) {
            return "Inactive";
        }

        if (
            product.published ===
                false ||
            product.published === 0
        ) {
            return "Draft";
        }

        return "Active";
    }

    function formatPrice(value) {
        const number = Number(value);

        if (
            Number.isNaN(number)
        ) {
            return "0";
        }

        return number.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
    }

    const handleCouponField = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setCouponForm(
            (current) => ({
                ...current,
                [name]:
                    type === "checkbox"
                        ? checked
                        : value
            })
        );
    };

    const generateCouponCode =
        () => {
            const alphabet =
                "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

            let code =
                "UNTKN-";

            for (
                let index = 0;
                index < 6;
                index += 1
            ) {
                code +=
                    alphabet[
                        Math.floor(
                            Math.random() *
                                alphabet.length
                        )
                    ];
            }

            setCouponForm(
                (current) => ({
                    ...current,
                    code
                })
            );
        };

    const openCreateCoupon =
        () => {
            setEditingCouponId(null);
            setCouponForm({
                ...EMPTY_COUPON_FORM
            });
            setCouponModalOpen(true);
        };

    const openEditCoupon =
        (coupon) => {
            setEditingCouponId(
                coupon.id
            );

            setCouponForm({
                code:
                    coupon.code || "",
                discount_type:
                    coupon.discount_type ||
                    "percentage",
                discount_value:
                    coupon.discount_value ??
                    "",
                min_order_amount:
                    coupon.min_order_amount ??
                    "",
                max_discount_amount:
                    coupon.max_discount_amount ??
                    "",
                start_mode:
                    new Date(
                        coupon.starts_at
                    ).getTime() >
                    Date.now()
                        ? "schedule"
                        : "now",
                starts_at:
                    coupon.starts_at
                        ? toDateTimeLocal(
                              coupon.starts_at
                          )
                        : "",
                expiry_mode:
                    coupon.expires_at
                        ? "date"
                        : "never",
                expires_at:
                    coupon.expires_at
                        ? toDateTimeLocal(
                              coupon.expires_at
                          )
                        : "",
                usage_limit:
                    coupon.usage_limit ??
                    "",
                per_user_limit:
                    coupon.per_user_limit ??
                    "1",
                first_order_only:
                    Boolean(
                        coupon.first_order_only
                    ),
                scope_type:
                    coupon.scope_type ||
                    "all",
                scope_id:
                    coupon.scope_id ??
                    "",
                is_active:
                    Boolean(
                        coupon.is_active
                    )
            });

            setCouponModalOpen(true);
        };

    const submitCoupon =
        async (event) => {
            event.preventDefault();

            try {
                setCouponSubmitting(true);
                setCouponError("");

                if (
                    !couponForm.code.trim()
                ) {
                    throw new Error(
                        "Enter a coupon code."
                    );
                }

                if (
                    !couponForm.discount_value
                ) {
                    throw new Error(
                        "Enter the offer value."
                    );
                }

                if (
                    couponForm.scope_type !==
                        "all" &&
                    !couponForm.scope_id
                ) {
                    throw new Error(
                        "Select a category or collection."
                    );
                }

                const payload = {
                    code:
                        couponForm.code
                            .trim()
                            .toUpperCase(),
                    discount_type:
                        couponForm.discount_type,
                    discount_value:
                        Number(
                            couponForm.discount_value
                        ),
                    min_order_amount:
                        couponForm.min_order_amount
                            ? Number(
                                  couponForm.min_order_amount
                              )
                            : 0,
                    max_discount_amount:
                        couponForm.discount_type ===
                            "percentage" &&
                        couponForm.max_discount_amount
                            ? Number(
                                  couponForm.max_discount_amount
                              )
                            : null,
                    starts_at:
                        couponForm.start_mode ===
                        "schedule"
                            ? new Date(
                                  couponForm.starts_at
                              ).toISOString()
                            : new Date().toISOString(),
                    expires_at:
                        couponForm.expiry_mode ===
                        "date"
                            ? new Date(
                                  couponForm.expires_at
                              ).toISOString()
                            : null,
                    usage_limit:
                        couponForm.usage_limit
                            ? Number(
                                  couponForm.usage_limit
                              )
                            : null,
                    per_user_limit:
                        Number(
                            couponForm.per_user_limit ||
                                1
                        ),
                    first_order_only:
                        couponForm.first_order_only,
                    scope_type:
                        couponForm.scope_type,
                    scope_id:
                        couponForm.scope_type ===
                        "all"
                            ? null
                            : Number(
                                  couponForm.scope_id
                              ),
                    is_active:
                        couponForm.is_active
                };

                let response;

                if (
                    editingCouponId
                ) {
                    response =
                        await api.put(
                            `/coupons/admin/${editingCouponId}`,
                            payload
                        );
                } else {
                    response =
                        await api.post(
                            "/coupons/admin",
                            payload
                        );
                }

                if (
                    !response.data?.success
                ) {
                    throw new Error(
                        response.data
                            ?.message ||
                            "Failed to save coupon."
                    );
                }

                setCouponModalOpen(
                    false
                );
                setEditingCouponId(
                    null
                );
                setCouponForm({
                    ...EMPTY_COUPON_FORM
                });

                await fetchCoupons();
            } catch (err) {
                console.error(
                    "Coupon save error:",
                    err
                );

                setCouponError(
                    err?.response?.data
                        ?.message ||
                        err?.message ||
                        "Failed to save coupon."
                );
            } finally {
                setCouponSubmitting(
                    false
                );
            }
        };

    const toggleCoupon =
        async (id) => {
            try {
                await api.patch(
                    `/coupons/admin/${id}/toggle`
                );

                await fetchCoupons();
            } catch (err) {
                setCouponError(
                    err?.response?.data
                        ?.message ||
                        "Failed to update coupon."
                );
            }
        };

    const deleteCoupon =
        async (coupon) => {
            const confirmed =
                window.confirm(
                    `Delete coupon "${coupon.code}"?`
                );

            if (!confirmed) {
                return;
            }

            try {
                await api.delete(
                    `/coupons/admin/${coupon.id}`
                );

                await fetchCoupons();
            } catch (err) {
                setCouponError(
                    err?.response?.data
                        ?.message ||
                        "This coupon cannot be deleted."
                );
            }
        };

    const copyCoupon =
        async (code) => {
            try {
                await navigator.clipboard.writeText(
                    code
                );
            } catch {
                window.prompt(
                    "Copy coupon code:",
                    code
                );
            }
        };

    const handleRefresh =
        () => {
            fetchProducts();
            fetchCoupons();
        };

    const couponCounts =
        useMemo(
            () => ({
                active: coupons.filter(
                    (coupon) =>
                        coupon.status ===
                        "active"
                ).length,
                scheduled:
                    coupons.filter(
                        (coupon) =>
                            coupon.status ===
                            "scheduled"
                    ).length,
                expired:
                    coupons.filter(
                        (coupon) =>
                            coupon.status ===
                            "expired"
                    ).length
            }),
            [coupons]
        );

    return (
        <section
            className="admin-products-page"
            style={{
                position: "relative"
            }}
        >
            <div
                className="admin-page-header"
            >
                <div>
                    <p className="admin-page-eyebrow">
                        CATALOGUE
                    </p>

                    <h1>Products</h1>

                    <p>
                        Manage your products,
                        pricing and inventory.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems:
                            "center",
                        flexWrap:
                            "wrap",
                        justifyContent:
                            "flex-end"
                    }}
                >
                    <button
                        type="button"
                        className="admin-action-button"
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            loading ||
                            couponLoading
                        }
                        title="Refresh"
                    >
                        <RefreshCw
                            size={17}
                            strokeWidth={
                                1.6
                            }
                        />
                    </button>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                            openCreateCoupon
                        }
                        style={{
                            display:
                                "inline-flex",
                            alignItems:
                                "center",
                            gap: "7px"
                        }}
                    >
                        <Tag
                            size={17}
                            strokeWidth={
                                1.7
                            }
                        />
                        Create Coupon
                    </button>

                    <Link
                        to="/admin/products/add"
                        className="admin-primary-button"
                    >
                        <Plus
                            size={18}
                            strokeWidth={
                                1.7
                            }
                        />
                        Add Product
                    </Link>
                </div>
            </div>

            <div
                style={{
                    marginBottom:
                        "28px",
                    padding:
                        "24px",
                    border:
                        "1px solid #dedede",
                    background:
                        "linear-gradient(135deg, #fafafa, #f3f3f3)",
                    position:
                        "relative",
                    overflow:
                        "hidden"
                }}
            >
                <div
                    style={{
                        position:
                            "absolute",
                        width: "180px",
                        height: "180px",
                        borderRadius:
                            "50%",
                        background:
                            "rgba(0,0,0,0.035)",
                        right: "-50px",
                        top: "-80px"
                    }}
                />

                <div
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "flex-start",
                        gap: "20px",
                        position:
                            "relative",
                        flexWrap:
                            "wrap"
                    }}
                >
                    <div>
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "8px",
                                marginBottom:
                                    "8px"
                            }}
                        >
                            <Sparkles
                                size={15}
                                strokeWidth={
                                    1.5
                                }
                            />
                            <span
                                style={{
                                    fontSize:
                                        "10px",
                                    letterSpacing:
                                        "0.16em",
                                    fontWeight:
                                        600
                                }}
                            >
                                PROMOTIONS
                            </span>
                        </div>

                        <h2
                            style={{
                                margin:
                                    "0 0 7px",
                                fontSize:
                                    "24px",
                                fontWeight:
                                    500,
                                letterSpacing:
                                    "-0.03em"
                            }}
                        >
                            Coupon Studio
                        </h2>

                        <p
                            style={{
                                margin:
                                    0,
                                color:
                                    "#777",
                                fontSize:
                                    "12px",
                                maxWidth:
                                    "560px",
                                lineHeight:
                                    1.6
                            }}
                        >
                            Create offers,
                            schedule them
                            for later, set
                            limits and let
                            UNTKN activate
                            and expire them
                            automatically.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            openCreateCoupon
                        }
                        style={{
                            border:
                                "1px solid #111",
                            background:
                                "#111",
                            color:
                                "#fff",
                            padding:
                                "12px 17px",
                            display:
                                "inline-flex",
                            alignItems:
                                "center",
                            gap: "8px",
                            cursor:
                                "pointer",
                            fontSize:
                                "11px",
                            letterSpacing:
                                "0.08em"
                        }}
                    >
                        <Plus
                            size={15}
                        />
                        NEW OFFER
                    </button>
                </div>

                <div
                    style={{
                        display:
                            "grid",
                        gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                        gap: "10px",
                        marginTop:
                            "20px",
                        maxWidth:
                            "620px"
                    }}
                >
                    {[
                        [
                            "ACTIVE",
                            couponCounts.active
                        ],
                        [
                            "SCHEDULED",
                            couponCounts.scheduled
                        ],
                        [
                            "EXPIRED",
                            couponCounts.expired
                        ]
                    ].map(
                        ([label, value]) => (
                            <div
                                key={
                                    label
                                }
                                style={{
                                    padding:
                                        "13px 15px",
                                    background:
                                        "#fff",
                                    border:
                                        "1px solid #e6e6e6"
                                }}
                            >
                                <span
                                    style={{
                                        display:
                                            "block",
                                        color:
                                            "#888",
                                        fontSize:
                                            "9px",
                                        letterSpacing:
                                            "0.13em",
                                        marginBottom:
                                            "6px"
                                    }}
                                >
                                    {label}
                                </span>

                                <strong
                                    style={{
                                        fontSize:
                                            "20px",
                                        fontWeight:
                                            500
                                    }}
                                >
                                    {
                                        value
                                    }
                                </strong>
                            </div>
                        )
                    )}
                </div>
            </div>

            {couponError && (
                <div
                    style={{
                        marginBottom:
                            "18px",
                        padding:
                            "12px 14px",
                        border:
                            "1px solid #e6caca",
                        background:
                            "#fff7f7",
                        color:
                            "#9b3c3c",
                        fontSize:
                            "12px"
                    }}
                >
                    {couponError}
                </div>
            )}

            <div
                style={{
                    marginBottom:
                        "30px",
                    border:
                        "1px solid #dedede",
                    background:
                        "#fff"
                }}
            >
                <div
                    style={{
                        padding:
                            "18px 20px",
                        borderBottom:
                            "1px solid #e8e8e8",
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        gap: "12px"
                    }}
                >
                    <div>
                        <p
                            className="admin-page-eyebrow"
                            style={{
                                marginBottom:
                                    "4px"
                            }}
                        >
                            OFFER VAULT
                        </p>
                        <h2
                            style={{
                                margin:
                                    0,
                                fontSize:
                                    "19px",
                                fontWeight:
                                    500
                            }}
                        >
                            Coupons
                        </h2>
                    </div>

                    <span
                        style={{
                            color:
                                "#777",
                            fontSize:
                                "11px"
                        }}
                    >
                        {coupons.length}{" "}
                        total
                    </span>
                </div>

                {couponLoading ? (
                    <div
                        style={{
                            padding:
                                "35px",
                            textAlign:
                                "center",
                            color:
                                "#777",
                            fontSize:
                                "12px"
                        }}
                    >
                        Loading coupon
                        studio...
                    </div>
                ) : coupons.length ===
                  0 ? (
                    <div
                        style={{
                            padding:
                                "40px 20px",
                            textAlign:
                                "center"
                        }}
                    >
                        <Tag
                            size={30}
                            strokeWidth={
                                1.2
                            }
                        />
                        <h3
                            style={{
                                margin:
                                    "12px 0 5px",
                                fontWeight:
                                    500
                            }}
                        >
                            No coupons yet
                        </h3>
                        <p
                            style={{
                                margin:
                                    0,
                                color:
                                    "#888",
                                fontSize:
                                    "12px"
                            }}
                        >
                            Create your
                            first offer
                            and it will
                            automatically
                            appear to
                            eligible
                            customers.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display:
                                "grid",
                            gap: "1px",
                            background:
                                "#e8e8e8"
                        }}
                    >
                        {coupons.map(
                            (coupon) => (
                                <div
                                    key={
                                        coupon.id
                                    }
                                    style={{
                                        background:
                                            "#fff",
                                        padding:
                                            "17px 20px",
                                        display:
                                            "grid",
                                        gridTemplateColumns:
                                            "minmax(150px, 1.4fr) minmax(120px, 1fr) minmax(120px, .8fr) auto",
                                        alignItems:
                                            "center",
                                        gap: "18px"
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                gap:
                                                    "8px",
                                                marginBottom:
                                                    "5px"
                                            }}
                                        >
                                            <strong
                                                style={{
                                                    fontSize:
                                                        "14px",
                                                    letterSpacing:
                                                        "0.06em"
                                                }}
                                            >
                                                {
                                                    coupon.code
                                                }
                                            </strong>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyCoupon(
                                                        coupon.code
                                                    )
                                                }
                                                title="Copy coupon"
                                                style={{
                                                    border:
                                                        0,
                                                    background:
                                                        "transparent",
                                                    padding:
                                                        0,
                                                    cursor:
                                                        "pointer"
                                                }}
                                            >
                                                <Copy
                                                    size={
                                                        13
                                                    }
                                                    strokeWidth={
                                                        1.5
                                                    }
                                                />
                                            </button>
                                        </div>

                                        <span
                                            style={{
                                                color:
                                                    "#888",
                                                fontSize:
                                                    "10px"
                                            }}
                                        >
                                            {coupon.scope_type ===
                                            "all"
                                                ? "ALL PRODUCTS"
                                                : coupon.scope_type ===
                                                  "category"
                                                ? "CATEGORY"
                                                : "COLLECTION"}
                                        </span>
                                    </div>

                                    <div>
                                        <strong
                                            style={{
                                                fontSize:
                                                    "15px",
                                                fontWeight:
                                                    500
                                            }}
                                        >
                                            {coupon.discount_type ===
                                            "percentage"
                                                ? `${coupon.discount_value}% OFF`
                                                : `₹${formatPrice(
                                                      coupon.discount_value
                                                  )} OFF`}
                                        </strong>

                                        <span
                                            style={{
                                                display:
                                                    "block",
                                                marginTop:
                                                    "4px",
                                                color:
                                                    "#888",
                                                fontSize:
                                                    "10px"
                                            }}
                                        >
                                            Min ₹
                                            {formatPrice(
                                                coupon.min_order_amount
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                display:
                                                    "inline-flex",
                                                alignItems:
                                                    "center",
                                                gap:
                                                    "6px",
                                                padding:
                                                    "6px 8px",
                                                border:
                                                    "1px solid #e5e5e5",
                                                fontSize:
                                                    "9px",
                                                letterSpacing:
                                                    "0.1em"
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width:
                                                        "6px",
                                                    height:
                                                        "6px",
                                                    borderRadius:
                                                        "50%",
                                                    background:
                                                        coupon.status ===
                                                        "active"
                                                            ? "#2f6b3f"
                                                            : coupon.status ===
                                                              "scheduled"
                                                            ? "#b27b19"
                                                            : "#999"
                                                }}
                                            />
                                            {String(
                                                coupon.status
                                            ).toUpperCase()}
                                        </span>

                                        <span
                                            style={{
                                                display:
                                                    "block",
                                                marginTop:
                                                    "7px",
                                                color:
                                                    "#888",
                                                fontSize:
                                                    "10px"
                                            }}
                                        >
                                            {coupon.usage_limit
                                                ? `${coupon.usage_count} / ${coupon.usage_limit} used`
                                                : `${coupon.usage_count} used`}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            gap:
                                                "6px",
                                            justifyContent:
                                                "flex-end"
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditCoupon(
                                                    coupon
                                                )
                                            }
                                            className="admin-action-button"
                                            title="Edit"
                                        >
                                            <Pencil
                                                size={
                                                    15
                                                }
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleCoupon(
                                                    coupon.id
                                                )
                                            }
                                            className="admin-action-button"
                                            title={
                                                coupon.is_active
                                                    ? "Pause"
                                                    : "Activate"
                                            }
                                        >
                                            <Power
                                                size={
                                                    15
                                                }
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteCoupon(
                                                    coupon
                                                )
                                            }
                                            className="admin-action-button delete"
                                            title="Delete"
                                        >
                                            <Trash2
                                                size={
                                                    15
                                                }
                                            />
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <div className="admin-product-toolbar">
                <div className="admin-product-search">
                    <Search
                        size={18}
                        strokeWidth={1.5}
                    />

                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(
                            event
                        ) =>
                            setSearch(
                                event.target
                                    .value
                            )
                        }
                    />
                </div>

                <select
                    className="admin-product-filter"
                    value={category}
                    onChange={(
                        event
                    ) =>
                        setCategory(
                            event.target.value
                        )
                    }
                >
                    {categories.map(
                        (item) => (
                            <option
                                key={item}
                                value={
                                    item
                                }
                            >
                                {item}
                            </option>
                        )
                    )}
                </select>
            </div>

            {error && (
                <div
                    style={{
                        padding:
                            "14px 16px",
                        marginBottom:
                            "20px",
                        border:
                            "1px solid #e5caca",
                        background:
                            "#fff7f7",
                        color:
                            "#a33"
                    }}
                >
                    {error}
                </div>
            )}

            <div className="admin-products-panel">
                <div className="admin-panel-heading">
                    <div>
                        <h2>
                            All Products
                        </h2>

                        <span>
                            {loading
                                ? "Loading..."
                                : `${filteredProducts.length} products`}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="admin-products-empty">
                        <Package
                            size={38}
                            strokeWidth={
                                1.3
                            }
                        />

                        <h3>
                            Loading products...
                        </h3>

                        <p>
                            Fetching
                            products
                            from the
                            database.
                        </p>
                    </div>
                ) : filteredProducts.length ===
                  0 ? (
                    <div className="admin-products-empty">
                        <Package
                            size={38}
                            strokeWidth={
                                1.3
                            }
                        />

                        <h3>
                            No products
                            found
                        </h3>

                        <p>
                            {productList.length ===
                            0
                                ? "No products are available in your database."
                                : "Try changing your search or category filter."}
                        </p>
                    </div>
                ) : (
                    <div className="admin-products-table-wrapper">
                        <table className="admin-products-table">
                            <thead>
                                <tr>
                                    <th>
                                        PRODUCT
                                    </th>
                                    <th>
                                        CATEGORY
                                    </th>
                                    <th>
                                        COLLECTION
                                    </th>
                                    <th>
                                        PRICE
                                    </th>
                                    <th>
                                        SALE PRICE
                                    </th>
                                    <th>
                                        SIZES
                                    </th>
                                    <th>
                                        STOCK
                                    </th>
                                    <th>
                                        STATUS
                                    </th>
                                    <th>
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.map(
                                    (
                                        product
                                    ) => {
                                        const image =
                                            getImage(
                                                product
                                            );
                                        const sizes =
                                            getSizes(
                                                product
                                            );
                                        const stock =
                                            getStock(
                                                product
                                            );
                                        const status =
                                            getStatus(
                                                product
                                            );

                                        return (
                                            <tr
                                                key={
                                                    product.id
                                                }
                                            >
                                                <td>
                                                    <div className="admin-product-info">
                                                        <div className="admin-product-image">
                                                            {image ? (
                                                                <img
                                                                    src={
                                                                        image
                                                                    }
                                                                    alt={
                                                                        product.name
                                                                    }
                                                                    loading="lazy"
                                                                    onError={(
                                                                        event
                                                                    ) => {
                                                                        event.currentTarget.style.display =
                                                                            "none";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Package
                                                                    size={
                                                                        24
                                                                    }
                                                                    strokeWidth={
                                                                        1.3
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    product.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                ID:
                                                                #
                                                                {
                                                                    product.id
                                                                }
                                                            </span>

                                                            {product.slug && (
                                                                <span>
                                                                    {
                                                                        product.slug
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="admin-category-badge">
                                                        {getCategory(
                                                            product
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    {getCollection(
                                                        product
                                                    ) ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    ₹
                                                    {formatPrice(
                                                        getOldPrice(
                                                            product
                                                        )
                                                    )}
                                                </td>

                                                <td>
                                                    <strong>
                                                        ₹
                                                        {formatPrice(
                                                            getPrice(
                                                                product
                                                            )
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {sizes.length >
                                                    0 ? (
                                                        <div className="admin-size-list">
                                                            {sizes.map(
                                                                (
                                                                    size,
                                                                    index
                                                                ) => {
                                                                    const sizeValue =
                                                                        typeof size ===
                                                                        "object"
                                                                            ? size?.name ||
                                                                              size?.size ||
                                                                              size?.value
                                                                            : size;

                                                                    return (
                                                                        <span
                                                                            key={`${sizeValue}-${index}`}
                                                                        >
                                                                            {
                                                                                sizeValue
                                                                            }
                                                                        </span>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span>
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        style={{
                                                            fontWeight:
                                                                600,
                                                            color:
                                                                stock <=
                                                                5
                                                                    ? "#a33"
                                                                    : "inherit"
                                                        }}
                                                    >
                                                        {
                                                            stock
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span>
                                                        {
                                                            status
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-product-actions">
                                                        <Link
                                                            to={`/admin/products/edit/${product.id}`}
                                                            className="admin-action-button"
                                                            aria-label={`Edit ${product.name}`}
                                                        >
                                                            <Pencil
                                                                size={
                                                                    16
                                                                }
                                                                strokeWidth={
                                                                    1.6
                                                                }
                                                            />
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            className="admin-action-button delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    product.id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                product.id
                                                            }
                                                            aria-label={`Delete ${product.name}`}
                                                        >
                                                            <Trash2
                                                                size={
                                                                    16
                                                                }
                                                                strokeWidth={
                                                                    1.6
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {couponModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position:
                            "fixed",
                        inset: 0,
                        zIndex: 1000,
                        background:
                            "rgba(0,0,0,.48)",
                        backdropFilter:
                            "blur(7px)",
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        padding:
                            "24px"
                    }}
                >
                    <div
                        style={{
                            width:
                                "min(720px, 100%)",
                            maxHeight:
                                "calc(100vh - 48px)",
                            overflowY:
                                "auto",
                            background:
                                "#fff",
                            boxShadow:
                                "0 30px 80px rgba(0,0,0,.25)"
                        }}
                    >
                        <div
                            style={{
                                padding:
                                    "22px 24px",
                                borderBottom:
                                    "1px solid #e7e7e7",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "space-between"
                            }}
                        >
                            <div>
                                <p
                                    className="admin-page-eyebrow"
                                    style={{
                                        marginBottom:
                                            "5px"
                                    }}
                                >
                                    {editingCouponId
                                        ? "EDIT OFFER"
                                        : "NEW OFFER"}
                                </p>

                                <h2
                                    style={{
                                        margin:
                                            0,
                                        fontSize:
                                            "24px",
                                        fontWeight:
                                            500,
                                        letterSpacing:
                                            "-0.03em"
                                    }}
                                >
                                    Coupon Studio
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setCouponModalOpen(
                                        false
                                    )
                                }
                                style={{
                                    border:
                                        "1px solid #ddd",
                                    background:
                                        "#fff",
                                    width:
                                        "36px",
                                    height:
                                        "36px",
                                    cursor:
                                        "pointer",
                                    display:
                                        "grid",
                                    placeItems:
                                        "center"
                                }}
                            >
                                <X
                                    size={
                                        17
                                    }
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                submitCoupon
                            }
                            style={{
                                padding:
                                    "24px"
                            }}
                        >
                            {couponError && (
                                <div
                                    style={{
                                        marginBottom:
                                            "18px",
                                        padding:
                                            "12px",
                                        background:
                                            "#fff7f7",
                                        border:
                                            "1px solid #e6caca",
                                        color:
                                            "#9b3c3c",
                                        fontSize:
                                            "12px"
                                    }}
                                >
                                    {
                                        couponError
                                    }
                                </div>
                            )}

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "1fr 1fr",
                                    gap:
                                        "18px"
                                }}
                            >
                                <CouponField
                                    label="COUPON CODE"
                                    hint="Customers enter this at checkout."
                                >
                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            gap:
                                                "7px"
                                        }}
                                    >
                                        <input
                                            name="code"
                                            value={
                                                couponForm.code
                                            }
                                            onChange={
                                                handleCouponField
                                            }
                                            placeholder="UNTKN20"
                                            maxLength={
                                                50
                                            }
                                            required
                                            style={{
                                                ...inputStyle,
                                                flex: 1
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={
                                                generateCouponCode
                                            }
                                            style={
                                                secondaryButtonStyle
                                            }
                                        >
                                            GENERATE
                                        </button>
                                    </div>
                                </CouponField>

                                <CouponField label="OFFER TYPE">
                                    <select
                                        name="discount_type"
                                        value={
                                            couponForm.discount_type
                                        }
                                        onChange={
                                            handleCouponField
                                        }
                                        style={
                                            inputStyle
                                        }
                                    >
                                        <option value="percentage">
                                            Percentage %
                                        </option>
                                        <option value="fixed">
                                            Fixed amount ₹
                                        </option>
                                    </select>
                                </CouponField>

                                <CouponField
                                    label="HOW MUCH OFFER?"
                                >
                                    <input
                                        name="discount_value"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            couponForm.discount_value
                                        }
                                        onChange={
                                            handleCouponField
                                        }
                                        placeholder={
                                            couponForm.discount_type ===
                                            "percentage"
                                                ? "20"
                                                : "200"
                                        }
                                        required
                                        style={
                                            inputStyle
                                        }
                                    />
                                </CouponField>

                                <CouponField
                                    label="MINIMUM ORDER"
                                    hint="Leave 0 for no minimum."
                                >
                                    <input
                                        name="min_order_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            couponForm.min_order_amount
                                        }
                                        onChange={
                                            handleCouponField
                                        }
                                        placeholder="999"
                                        style={
                                            inputStyle
                                        }
                                    />
                                </CouponField>

                                {couponForm.discount_type ===
                                    "percentage" && (
                                    <CouponField
                                        label="MAX DISCOUNT"
                                        hint="Optional cap for percentage offers."
                                    >
                                        <input
                                            name="max_discount_amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                couponForm.max_discount_amount
                                            }
                                            onChange={
                                                handleCouponField
                                            }
                                            placeholder="500"
                                            style={
                                                inputStyle
                                            }
                                        />
                                    </CouponField>
                                )}

                                <CouponField
                                    label="USAGE LIMIT"
                                    hint="Leave empty for unlimited."
                                >
                                    <input
                                        name="usage_limit"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            couponForm.usage_limit
                                        }
                                        onChange={
                                            handleCouponField
                                        }
                                        placeholder="100"
                                        style={
                                            inputStyle
                                        }
                                    />
                                </CouponField>

                                <CouponField
                                    label="PER CUSTOMER"
                                >
                                    <input
                                        name="per_user_limit"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            couponForm.per_user_limit
                                        }
                                        onChange={
                                            handleCouponField
                                        }
                                        style={
                                            inputStyle
                                        }
                                    />
                                </CouponField>

                                <CouponField
                                    label="APPLIES TO"
                                >
                                    <select
                                        name="scope_type"
                                        value={
                                            couponForm.scope_type
                                        }
                                        onChange={
                                            handleCouponField
                                        }
                                        style={
                                            inputStyle
                                        }
                                    >
                                        <option value="all">
                                            Entire store
                                        </option>
                                        <option value="category">
                                            One category
                                        </option>
                                        <option value="collection">
                                            One collection
                                        </option>
                                    </select>
                                </CouponField>

                                {couponForm.scope_type !==
                                    "all" && (
                                    <CouponField
                                        label={
                                            couponForm.scope_type ===
                                            "category"
                                                ? "SELECT CATEGORY"
                                                : "SELECT COLLECTION"
                                        }
                                    >
                                        <select
                                            name="scope_id"
                                            value={
                                                couponForm.scope_id
                                            }
                                            onChange={
                                                handleCouponField
                                            }
                                            required
                                            style={
                                                inputStyle
                                            }
                                        >
                                            <option value="">
                                                Select...
                                            </option>

                                            {(couponForm.scope_type ===
                                            "category"
                                                ? categoriesData
                                                : collectionsData
                                            ).map(
                                                (
                                                    item
                                                ) => (
                                                    <option
                                                        key={
                                                            item.id
                                                        }
                                                        value={
                                                            item.id
                                                        }
                                                    >
                                                        {item.name ||
                                                            item.title ||
                                                            `#${item.id}`}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </CouponField>
                                )}
                            </div>

                            <div
                                style={{
                                    marginTop:
                                        "20px",
                                    borderTop:
                                        "1px solid #ececec",
                                    paddingTop:
                                        "20px"
                                }}
                            >
                                <p
                                    className="admin-page-eyebrow"
                                    style={{
                                        marginBottom:
                                            "12px"
                                    }}
                                >
                                    AVAILABILITY
                                </p>

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr",
                                        gap:
                                            "18px"
                                    }}
                                >
                                    <CouponField label="START">
                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap:
                                                    "7px",
                                                marginBottom:
                                                    "9px"
                                            }}
                                        >
                                            <ChoiceButton
                                                active={
                                                    couponForm.start_mode ===
                                                    "now"
                                                }
                                                onClick={() =>
                                                    setCouponForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,
                                                            start_mode:
                                                                "now"
                                                        })
                                                    )
                                                }
                                            >
                                                <Clock3
                                                    size={
                                                        14
                                                    }
                                                />
                                                NOW
                                            </ChoiceButton>

                                            <ChoiceButton
                                                active={
                                                    couponForm.start_mode ===
                                                    "schedule"
                                                }
                                                onClick={() =>
                                                    setCouponForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,
                                                            start_mode:
                                                                "schedule"
                                                        })
                                                    )
                                                }
                                            >
                                                <CalendarDays
                                                    size={
                                                        14
                                                    }
                                                />
                                                SCHEDULE
                                            </ChoiceButton>
                                        </div>

                                        {couponForm.start_mode ===
                                            "schedule" && (
                                            <input
                                                name="starts_at"
                                                type="datetime-local"
                                                value={
                                                    couponForm.starts_at
                                                }
                                                onChange={
                                                    handleCouponField
                                                }
                                                required
                                                style={
                                                    inputStyle
                                                }
                                            />
                                        )}
                                    </CouponField>

                                    <CouponField label="EXPIRATION">
                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap:
                                                    "7px",
                                                marginBottom:
                                                    "9px"
                                            }}
                                        >
                                            <ChoiceButton
                                                active={
                                                    couponForm.expiry_mode ===
                                                    "never"
                                                }
                                                onClick={() =>
                                                    setCouponForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,
                                                            expiry_mode:
                                                                "never"
                                                        })
                                                    )
                                                }
                                            >
                                                NO EXPIRY
                                            </ChoiceButton>

                                            <ChoiceButton
                                                active={
                                                    couponForm.expiry_mode ===
                                                    "date"
                                                }
                                                onClick={() =>
                                                    setCouponForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,
                                                            expiry_mode:
                                                                "date"
                                                        })
                                                    )
                                                }
                                            >
                                                SET DATE
                                            </ChoiceButton>
                                        </div>

                                        {couponForm.expiry_mode ===
                                            "date" && (
                                            <input
                                                name="expires_at"
                                                type="datetime-local"
                                                value={
                                                    couponForm.expires_at
                                                }
                                                onChange={
                                                    handleCouponField
                                                }
                                                required
                                                style={
                                                    inputStyle
                                                }
                                            />
                                        )}
                                    </CouponField>
                                </div>
                            </div>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                    gap:
                                        "20px",
                                    marginTop:
                                        "20px",
                                    padding:
                                        "15px",
                                    border:
                                        "1px solid #e7e7e7",
                                    background:
                                        "#fafafa"
                                }}
                            >
                                <div>
                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            fontSize:
                                                "12px"
                                        }}
                                    >
                                        FIRST ORDER ONLY
                                    </strong>
                                    <span
                                        style={{
                                            color:
                                                "#888",
                                            fontSize:
                                                "10px"
                                        }}
                                    >
                                        Restrict this offer
                                        to customers who
                                        have not placed an
                                        order yet.
                                    </span>
                                </div>

                                <input
                                    type="checkbox"
                                    name="first_order_only"
                                    checked={
                                        couponForm.first_order_only
                                    }
                                    onChange={
                                        handleCouponField
                                    }
                                    style={{
                                        width:
                                            "18px",
                                        height:
                                            "18px"
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                    gap:
                                        "20px",
                                    marginTop:
                                        "10px",
                                    padding:
                                        "15px",
                                    border:
                                        "1px solid #e7e7e7",
                                    background:
                                        "#fafafa"
                                }}
                            >
                                <div>
                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            fontSize:
                                                "12px"
                                        }}
                                    >
                                        COUPON ENABLED
                                    </strong>
                                    <span
                                        style={{
                                            color:
                                                "#888",
                                            fontSize:
                                                "10px"
                                        }}
                                    >
                                        Scheduled coupons
                                        stay hidden until
                                        their start time.
                                    </span>
                                </div>

                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={
                                        couponForm.is_active
                                    }
                                    onChange={
                                        handleCouponField
                                    }
                                    style={{
                                        width:
                                            "18px",
                                        height:
                                            "18px"
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    marginTop:
                                        "22px",
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap:
                                        "9px"
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCouponModalOpen(
                                            false
                                        )
                                    }
                                    style={
                                        secondaryButtonStyle
                                    }
                                >
                                    CANCEL
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        couponSubmitting
                                    }
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity:
                                            couponSubmitting
                                                ? 0.6
                                                : 1
                                    }}
                                >
                                    {couponSubmitting
                                        ? "SAVING..."
                                        : editingCouponId
                                        ? "UPDATE COUPON"
                                        : "CREATE COUPON"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d9d9d9",
    background: "#fff",
    padding: "11px 12px",
    fontSize: "12px",
    outline: "none"
};

const secondaryButtonStyle = {
    border: "1px solid #d4d4d4",
    background: "#fff",
    color: "#111",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "10px",
    letterSpacing: "0.08em",
    whiteSpace: "nowrap"
};

const primaryButtonStyle = {
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    padding: "11px 16px",
    cursor: "pointer",
    fontSize: "10px",
    letterSpacing: "0.08em"
};

function CouponField({
    label,
    hint,
    children
}) {
    return (
        <label
            style={{
                display: "block"
            }}
        >
            <span
                style={{
                    display: "block",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    marginBottom: "7px"
                }}
            >
                {label}
            </span>

            {children}

            {hint && (
                <span
                    style={{
                        display: "block",
                        marginTop: "5px",
                        color: "#888",
                        fontSize: "9px",
                        lineHeight: 1.4
                    }}
                >
                    {hint}
                </span>
            )}
        </label>
    );
}

function ChoiceButton({
    active,
    onClick,
    children
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                padding: "9px 8px",
                border: active
                    ? "1px solid #111"
                    : "1px solid #ddd",
                background: active
                    ? "#111"
                    : "#fff",
                color: active
                    ? "#fff"
                    : "#555",
                cursor: "pointer",
                fontSize: "9px",
                letterSpacing: "0.06em"
            }}
        >
            {children}
        </button>
    );
}

function toDateTimeLocal(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (number) =>
        String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
        date.getMonth() + 1
    )}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
}

export default AdminProducts;
