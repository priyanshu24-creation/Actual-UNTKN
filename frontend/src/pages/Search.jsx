import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";

import api from "../services/api";

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  return (
    image.image_url ||
    image.imageUrl ||
    image.secure_url ||
    image.secureUrl ||
    image.url ||
    ""
  );
};

const getProductPrice = (product) => {
  const basePrice = Number(
    product?.base_price ??
      product?.basePrice ??
      product?.price ??
      0
  );

  const salePrice =
    product?.sale_price !== null &&
    product?.sale_price !== undefined &&
    product?.sale_price !== ""
      ? Number(product.sale_price)
      : null;

  if (
    salePrice !== null &&
    Number.isFinite(salePrice) &&
    salePrice < basePrice
  ) {
    return salePrice;
  }

  return basePrice;
};

const getProductName = (product) => {
  return (
    product?.name ||
    product?.product_name ||
    product?.title ||
    "UNTKN PRODUCT"
  );
};

const getProductCategory = (product) => {
  return (
    product?.category_name ||
    product?.category ||
    ""
  );
};

const getProductCollection = (product) => {
  return (
    product?.collection_name ||
    product?.collection ||
    ""
  );
};

const getProductDescription = (product) => {
  return (
    product?.description ||
    ""
  );
};

const normalizeProduct = (product, images = []) => {
  const numericId = Number(product?.id);

  return {
    ...product,

    id:
      Number.isInteger(numericId) && numericId > 0
        ? numericId
        : product?.id,

    name: getProductName(product),

    category: getProductCategory(product),

    collection: getProductCollection(product),

    description: getProductDescription(product),

    price: getProductPrice(product),

    images,

    image:
      images[0] ||
      getImageUrl(product?.image) ||
      getImageUrl(product?.image_url) ||
      getImageUrl(product?.imageUrl) ||
      "",
  };
};

function Search() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialQuery =
    searchParams.get("q") ||
    searchParams.get("search") ||
    searchParams.get("query") ||
    "";

  const [search, setSearch] =
    useState(initialQuery);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setSearch(
      searchParams.get("q") ||
        searchParams.get("search") ||
        searchParams.get("query") ||
        ""
    );
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get("/products");

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load products."
          );
        }

        const productList =
          response.data.products ||
          response.data.data ||
          [];

        if (!Array.isArray(productList)) {
          throw new Error(
            "Invalid products response from server."
          );
        }

        const productsWithImages =
          await Promise.all(
            productList.map(
              async (product) => {
                let images = [];

                if (
                  Array.isArray(
                    product?.images
                  )
                ) {
                  images =
                    product.images
                      .map(getImageUrl)
                      .filter(
                        (url) =>
                          url &&
                          !url.includes(
                            "example.com"
                          )
                      );
                }

                const directImage =
                  getImageUrl(
                    product?.image
                  ) ||
                  getImageUrl(
                    product?.image_url
                  ) ||
                  getImageUrl(
                    product?.imageUrl
                  );

                if (
                  directImage &&
                  !images.includes(
                    directImage
                  )
                ) {
                  images.unshift(
                    directImage
                  );
                }

                const numericId =
                  Number(product?.id);

                if (
                  images.length === 0 &&
                  Number.isInteger(
                    numericId
                  ) &&
                  numericId > 0
                ) {
                  try {
                    const imageResponse =
                      await api.get(
                        `/products/${numericId}/images`
                      );

                    if (
                      imageResponse.data
                        ?.success
                    ) {
                      const apiImages =
                        imageResponse
                          .data
                          .images ||
                        imageResponse
                          .data
                          .data ||
                        [];

                      images =
                        apiImages
                          .map(
                            getImageUrl
                          )
                          .filter(
                            (url) =>
                              url &&
                              !url.includes(
                                "example.com"
                              )
                          );
                    }
                  } catch (imageError) {
                    console.warn(
                      `Images could not be loaded for product ${numericId}:`,
                      imageError
                    );
                  }
                }

                return normalizeProduct(
                  product,
                  images
                );
              }
            )
          );

        if (!cancelled) {
          setProducts(
            productsWithImages
          );
        }
      } catch (loadError) {
        console.error(
          "Failed to load search products:",
          loadError
        );

        if (!cancelled) {
          setProducts([]);

          setError(
            loadError?.response?.data
              ?.message ||
              loadError?.message ||
              "Unable to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts =
    useMemo(() => {
      const query =
        String(search || "")
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) => {
          const searchableText =
            [
              product?.name,
              product?.product_name,
              product?.title,
              product?.category,
              product?.category_name,
              product?.collection,
              product?.collection_name,
              product?.description,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            query
          );
        }
      );
    }, [products, search]);

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    const query =
      String(search || "").trim();

    if (query) {
      setSearchParams({
        q: query,
      });
    } else {
      setSearchParams({});
    }
  };

  const formatPrice = (price) => {
    return Number(
      price || 0
    ).toLocaleString("en-IN");
  };

  return (
    <main className="search-page">
      <section className="search-header">
        <div className="search-header-inner">
          <p className="eyebrow">
            SEARCH
          </p>

          <h1>
            FIND YOUR PIECE
          </h1>

          <form
            className="search-form"
            onSubmit={
              handleSearchSubmit
            }
          >
            <div className="search-input-wrapper">
              <SearchIcon
                size={20}
                strokeWidth={1.5}
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products..."
                aria-label="Search products"
              />

              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setSearch("");
                    setSearchParams({});
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="submit"
              className="search-submit"
            >
              SEARCH
            </button>
          </form>
        </div>
      </section>

      <section className="search-results">
        <div className="search-results-header">
          <div>
            <p className="eyebrow">
              {search
                ? `RESULTS FOR "${search}"`
                : "ALL PRODUCTS"}
            </p>

            <h2>
              {loading
                ? "LOADING..."
                : `${filteredProducts.length} PRODUCTS`}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="search-state">
            <p>
              Fetching the latest
              products...
            </p>
          </div>
        ) : error ? (
          <div className="search-state search-error">
            <h3>
              Unable to load products
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              TRY AGAIN
            </button>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="search-state">
            <h3>
              NO PRODUCTS FOUND
            </h3>

            <p>
              {search
                ? `No products matched "${search}".`
                : "No products are available right now."}
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(
              (product) => {
                const productId =
                  Number(product?.id);

                const validProductId =
                  Number.isInteger(
                    productId
                  ) &&
                  productId > 0;

                if (!validProductId) {
                  return null;
                }

                return (
                  <article
                    className="product-card"
                    key={productId}
                  >
                    <Link
                      to={`/product/${productId}`}
                      className="product-image"
                    >
                      {product.image ? (
                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="product-image-placeholder">
                          UNTKN
                        </div>
                      )}
                    </Link>

                    <div className="product-info">
                      <div>
                        <h3>
                          {product.name}
                        </h3>

                        <p>
                          {product.category ||
                            product.collection ||
                            "UNTKN"}
                        </p>
                      </div>

                      <span>
                        ₹
                        {formatPrice(
                          product.price
                        )}
                      </span>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Search;