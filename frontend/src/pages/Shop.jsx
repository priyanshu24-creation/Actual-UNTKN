import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../services/api";
import ProductCard from "../components/ProductCard";

function Shop() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const urlCategory =
    searchParams.get("category") || "All";

  const [sort, setSort] =
    useState("featured");

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const categories = [
    "All",
    "T-Shirts",
    "Hoodies",
    "Thermals",
    "Bottomwear",
  ];

  const category =
    categories.includes(urlCategory)
      ? urlCategory
      : "All";

  /* =========================
     GET IMAGE URL
  ========================= */

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
      image.url ||
      image.secure_url ||
      image.secureUrl ||
      ""
    );
  };

  /* =========================
     LOAD PRODUCTS
  ========================= */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/products",
          {
            params: {
              page: 1,
              limit: 100,
            },
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load products."
          );
        }

        const apiProducts =
          response.data.products ||
          response.data.data ||
          [];

        /* =========================
           FILTER ACTIVE PRODUCTS
        ========================= */

        const activeProducts =
          apiProducts.filter((product) => {
            if (
              product.is_active !== undefined
            ) {
              return Boolean(product.is_active);
            }

            if (
              product.active !== undefined
            ) {
              return Boolean(product.active);
            }

            return true;
          });

        /* =========================
           LOAD IMAGES
        ========================= */

        const productsWithImages =
          await Promise.all(
            activeProducts.map(
              async (product) => {
                let images = [];

                /*
                 * First check whether the product
                 * response already contains images.
                 */

                if (
                  Array.isArray(product.images)
                ) {
                  images = product.images;
                }

                /*
                 * If images are not included in the
                 * product response, request them
                 * from the product image endpoint.
                 */

                if (images.length === 0) {
                  try {
                    const imageResponse =
                      await api.get(
                        `/products/${product.id}/images`
                      );

                    if (
                      imageResponse.data?.success
                    ) {
                      images =
                        imageResponse.data.images ||
                        imageResponse.data.data ||
                        [];
                    }
                  } catch (imageError) {
                    console.error(
                      `Failed to load images for product ${product.id}:`,
                      imageError
                    );
                  }
                }

                /* =========================
                   IMAGE URL
                ========================= */

                let imageUrl =
                  getImageUrl(
                    product.image
                  );

                if (!imageUrl) {
                  imageUrl =
                    getImageUrl(
                      product.image_url
                    );
                }

                if (
                  !imageUrl &&
                  images.length > 0
                ) {
                  imageUrl =
                    getImageUrl(images[0]);
                }

                /* =========================
                   PRICE
                ========================= */

                const basePrice = Number(
                  product.base_price ??
                    product.basePrice ??
                    product.price ??
                    0
                );

                const salePrice =
                  product.sale_price !==
                    null &&
                  product.sale_price !==
                    undefined
                    ? Number(
                        product.sale_price
                      )
                    : null;

                const finalPrice =
                  salePrice !== null &&
                  salePrice < basePrice
                    ? salePrice
                    : basePrice;

                /* =========================
                   CATEGORY
                ========================= */

                const productCategory =
                  product.category_name ||
                  product.category ||
                  "";

                /* =========================
                   NORMALIZED PRODUCT
                ========================= */

                return {
                  ...product,

                  id: product.id,

                  name:
                    product.name ||
                    product.product_name ||
                    "UNTKN Product",

                  slug:
                    product.slug || "",

                  price: finalPrice,

                  base_price: basePrice,

                  sale_price: salePrice,

                  category:
                    productCategory,

                  collection:
                    product.collection_name ||
                    product.collection ||
                    "",

                  image: imageUrl,

                  image_url: imageUrl,

                  images: images,

                  featured:
                    Boolean(
                      product.is_featured
                    ) ||
                    Boolean(
                      product.featured
                    ),

                  active: true,
                };
              }
            )
          );

        setProducts(
          productsWithImages
        );
      } catch (requestError) {
        console.error(
          "Failed to load products:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.message ||
            requestError.message ||
            "Unable to load products."
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* =========================
     CATEGORY FILTER
  ========================= */

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (category !== "All") {
      result = result.filter(
        (product) =>
          String(product.category)
            .toLowerCase()
            .trim() ===
          String(category)
            .toLowerCase()
            .trim()
      );
    }

    /* =========================
       SORT
    ========================= */

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );
    }

    if (sort === "name") {
      result.sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );
    }

    if (sort === "featured") {
      result.sort(
        (a, b) =>
          Number(b.featured) -
          Number(a.featured)
      );
    }

    return result;
  }, [
    products,
    category,
    sort,
  ]);

  /* =========================
     CATEGORY CHANGE
  ========================= */

  const handleCategoryChange = (item) => {
    if (item === "All") {
      setSearchParams({});
    } else {
      setSearchParams({
        category: item,
      });
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="shop-page">
      {/* HEADER */}

      <section className="shop-header">
        <div>
          <p className="eyebrow">
            THE COLLECTION
          </p>

          <h1>
            SHOP
          </h1>
        </div>

        <p className="shop-description">
          Explore the latest drops, essential pieces
          and limited-run collections.
        </p>
      </section>

      {/* CONTROLS */}

      <section className="shop-controls">
        <div className="category-list">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                handleCategoryChange(item)
              }
            >
              {item}
            </button>
          ))}
        </div>

        <div className="sort-wrapper">
          <label htmlFor="sort">
            SORT
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
          >
            <option value="featured">
              FEATURED
            </option>

            <option value="price-low">
              PRICE — LOW TO HIGH
            </option>

            <option value="price-high">
              PRICE — HIGH TO LOW
            </option>

            <option value="name">
              NAME
            </option>
          </select>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="shop-empty">
          <h2>
            UNABLE TO LOAD PRODUCTS
          </h2>

          <p>
            {error}
          </p>
        </div>
      )}

      {/* PRODUCT COUNT */}

      {!loading && !error && (
        <div className="product-count">
          {filteredProducts.length} PRODUCTS
        </div>
      )}

      {/* PRODUCTS */}

      <section className="shop-products">
        {loading ? (
          <div className="shop-empty">
            <h2>
              LOADING PRODUCTS
            </h2>

            <p>
              Please wait while we load the
              latest UNTKN collection.
            </p>
          </div>
        ) : error ? (
          <div className="shop-empty">
            <h2>
              PRODUCTS COULD NOT BE LOADED
            </h2>

            <p>
              Please try again.
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))
        ) : (
          <div className="shop-empty">
            <h2>
              NO PRODUCTS
            </h2>

            <p>
              No products were found in this
              category.
            </p>

            <button
              type="button"
              onClick={() =>
                handleCategoryChange("All")
              }
            >
              VIEW ALL PRODUCTS
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Shop;