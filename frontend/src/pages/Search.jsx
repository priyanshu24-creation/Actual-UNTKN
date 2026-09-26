import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Link,
    useSearchParams
} from "react-router-dom";

import api from "../services/api";

function Search() {
    const [
        searchParams,
        setSearchParams
    ] = useSearchParams();

    const query =
        searchParams.get("q") ||
        searchParams.get("search") ||
        "";

    const [
        products,
        setProducts
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadProducts =
            async () => {
                try {
                    setLoading(true);
                    setError("");

                    const response =
                        await api.get(
                            "/products"
                        );

                    if (
                        !response.data?.success
                    ) {
                        throw new Error(
                            response.data
                                ?.message ||
                            "Failed to load products."
                        );
                    }

                    const apiProducts =
                        response.data
                            ?.products ||
                        response.data
                            ?.data ||
                        [];

                    if (
                        !Array.isArray(
                            apiProducts
                        )
                    ) {
                        throw new Error(
                            "Invalid products response."
                        );
                    }

                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setProducts(
                        apiProducts
                    );

                } catch (
                    requestError
                ) {
                    console.error(
                        "Search products error:",
                        requestError
                    );

                    if (
                        !cancelled
                    ) {
                        setProducts([]);

                        setError(
                            requestError
                                ?.response
                                ?.data
                                ?.message ||
                            requestError
                                ?.message ||
                            "Unable to load products."
                        );
                    }
                } finally {
                    if (
                        !cancelled
                    ) {
                        setLoading(false);
                    }
                }
            };

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    const normalizedQuery =
        query
            .trim()
            .toLowerCase();

    const filteredProducts =
        useMemo(() => {
            if (
                !normalizedQuery
            ) {
                return products;
            }

            return products.filter(
                (product) => {
                    const name =
                        String(
                            product.name ||
                            product.product_name ||
                            ""
                        ).toLowerCase();

                    const category =
                        String(
                            product.category_name ||
                            product.category ||
                            ""
                        ).toLowerCase();

                    const collection =
                        String(
                            product.collection_name ||
                            product.collection ||
                            ""
                        ).toLowerCase();

                    const description =
                        String(
                            product.description ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(
                            normalizedQuery
                        ) ||
                        category.includes(
                            normalizedQuery
                        ) ||
                        collection.includes(
                            normalizedQuery
                        ) ||
                        description.includes(
                            normalizedQuery
                        )
                    );
                }
            );
        }, [
            products,
            normalizedQuery
        ]);

    const getProductId =
        (product) => {
            return (
                product.id ||
                product.product_id
            );
        };

    const getProductSlug =
        (product) => {
            return (
                product.slug ||
                product.product_slug ||
                getProductId(
                    product
                )
            );
        };

    const getProductName =
        (product) => {
            return (
                product.name ||
                product.product_name ||
                "UNTKN PRODUCT"
            );
        };

    const getProductPrice =
        (product) => {
            const price =
                product.sale_price ??
                product.price ??
                product.base_price ??
                product.unit_price ??
                product.current_price ??
                0;

            const numericPrice =
                Number(price);

            return Number.isFinite(
                numericPrice
            )
                ? numericPrice
                : 0;
        };

    const getProductImage =
        (product) => {
            return (
                product.image_url ||
                product.primary_image ||
                product.image ||
                product.thumbnail ||
                ""
            );
        };

    const formatPrice =
        (value) => {
            return `₹${Number(
                value || 0
            ).toLocaleString(
                "en-IN"
            )}`;
        };

    const getCategory =
        (product) => {
            return (
                product.category_name ||
                product.category ||
                "PRODUCT"
            );
        };

    const handleSearch =
        (event) => {
            event.preventDefault();

            const form =
                event.currentTarget;

            const input =
                form.elements.search;

            const value =
                String(
                    input?.value ||
                    ""
                ).trim();

            if (value) {
                setSearchParams({
                    q: value
                });
            } else {
                setSearchParams({});
            }
        };

    return (
        <main
            className="search-page"
        >
            <section
                className="search-header"
            >
                <form
                    onSubmit={
                        handleSearch
                    }
                    className="search-form"
                >
                    <input
                        name="search"
                        type="search"
                        defaultValue={
                            query
                        }
                        placeholder="SEARCH PRODUCTS..."
                        autoComplete="off"
                        aria-label="Search products"
                    />

                    <button
                        type="submit"
                    >
                        SEARCH →
                    </button>
                </form>
            </section>

            <section
                className="search-results"
            >
                {loading ? (
                    <div
                        className="search-state"
                    >
                        LOADING PRODUCTS...
                    </div>
                ) : error ? (
                    <div
                        className="search-state"
                    >
                        {error}
                    </div>
                ) : (
                    <>
                        <div
                            className="search-results-header"
                        >
                            <span>
                                {
                                    filteredProducts.length
                                }{" "}
                                PRODUCTS
                            </span>
                        </div>

                        {filteredProducts.length ===
                        0 ? (
                            <div
                                className="search-state"
                            >
                                {normalizedQuery
                                    ? `NO PRODUCTS FOUND FOR "${query}"`
                                    : "NO PRODUCTS AVAILABLE"}
                            </div>
                        ) : (
                            <div
                                className="search-products-grid"
                            >
                                {filteredProducts.map(
                                    (
                                        product
                                    ) => {
                                        const id =
                                            getProductId(
                                                product
                                            );

                                        const slug =
                                            getProductSlug(
                                                product
                                            );

                                        const name =
                                            getProductName(
                                                product
                                            );

                                        const price =
                                            getProductPrice(
                                                product
                                            );

                                        const image =
                                            getProductImage(
                                                product
                                            );

                                        return (
                                            <Link
                                                key={
                                                    id ||
                                                    slug ||
                                                    name
                                                }
                                                to={`/product/${encodeURIComponent(
                                                    slug
                                                )}`}
                                                className="search-product-card"
                                            >
                                                <div
                                                    className="search-product-image"
                                                >
                                                    {image ? (
                                                        <img
                                                            src={
                                                                image
                                                            }
                                                            alt={
                                                                name
                                                            }
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="search-product-placeholder"
                                                        >
                                                            UNTKN
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    className="search-product-info"
                                                >
                                                    <div>
                                                        <h3>
                                                            {
                                                                name
                                                            }
                                                        </h3>

                                                        <p>
                                                            {
                                                                getCategory(
                                                                    product
                                                                )
                                                            }
                                                        </p>
                                                    </div>

                                                    <strong>
                                                        {formatPrice(
                                                            price
                                                        )}
                                                    </strong>
                                                </div>
                                            </Link>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

export default Search;