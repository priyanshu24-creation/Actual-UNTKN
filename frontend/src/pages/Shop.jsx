import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "react-router-dom";

import api from "../services/api.js";
import ProductCard from "../components/ProductCard.jsx";

const CATEGORIES = [
  "All",
  "T-Shirts",
  "Hoodies",
  "Thermals",
  "Bottomwear",
];

function Shop() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [sort, setSort] =
    useState("featured");

  const categoryFromUrl =
    searchParams.get("category") || "All";

  const collectionFromUrl =
    searchParams.get("collection") || "";

  const featuredFromUrl =
    searchParams.get("featured") === "true";

  const category = CATEGORIES.includes(
    categoryFromUrl
  )
    ? categoryFromUrl
    : "All";

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

  const getProductImage = (product) => {
    if (
      product?.image &&
      typeof product.image === "string"
    ) {
      return product.image;
    }

    if (
      product?.image_url &&
      typeof product.image_url === "string"
    ) {
      return product.image_url;
    }

    if (
      product?.imageUrl &&
      typeof product.imageUrl === "string"
    ) {
      return product.imageUrl;
    }

    if (
      product?.primary_image &&
      typeof product.primary_image === "string"
    ) {
      return product.primary_image;
    }

    if (
      product?.primaryImage &&
      typeof product.primaryImage === "string"
    ) {
      return product.primaryImage;
    }

    if (
      Array.isArray(product?.images) &&
      product.images.length > 0
    ) {
      const firstImage =
        product.images.find(
          (item) =>
            Boolean(getImageUrl(item))
        );

      return getImageUrl(firstImage);
    }

    return "";
  };

  const getCategory = (product) => {
    if (
      product?.category &&
      typeof product.category === "object"
    ) {
      return (
        product.category?.name ||
        product.category?.title ||
        ""
      );
    }

    return String(
      product?.category_name ||
        product?.category ||
        product?.categoryName ||
        ""
    ).trim();
  };

  const getCollection = (product) => {
    if (
      product?.collection &&
      typeof product.collection === "object"
    ) {
      return (
        product.collection?.name ||
        product.collection?.title ||
        product.collection?.slug ||
        ""
      );
    }

    return String(
      product?.collection_name ||
        product?.collection ||
        product?.collectionName ||
        ""
    ).trim();
  };

  const getPrice = (product) => {
    const basePrice = Number(
      product?.base_price ??
        product?.basePrice ??
        product?.price ??
        0
    );

    const salePrice =
      product?.sale_price !== null &&
      product?.sale_price !== undefined
        ? Number(product.sale_price)
        : product?.salePrice !== null &&
            product?.salePrice !== undefined
          ? Number(product.salePrice)
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

  const getBasePrice = (product) => {
    return Number(
      product?.base_price ??
        product?.basePrice ??
        product?.price ??
        0
    );
  };

  const getFeatured = (product) => {
    return Boolean(
      product?.is_featured ??
        product?.featured ??
        false
    );
  };

  const isProductActive = (product) => {
    if (
      product?.is_active === false ||
      product?.is_active === 0
    ) {
      return false;
    }

    if (
      product?.active === false ||
      product?.active === 0
    ) {
      return false;
    }

    if (
      product?.published === false ||
      product?.published === 0
    ) {
      return false;
    }

    return true;
  };

  const normalizeProduct = (
    product
  ) => {
    const image =
      getProductImage(product);

    const basePrice =
      getBasePrice(product);

    const price =
      getPrice(product);

    return {
      ...product,

      id: product?.id,

      name:
        product?.name ||
        product?.product_name ||
        "UNTKN Product",

      slug:
        product?.slug ||
        String(product?.id || ""),

      category:
        getCategory(product),

      collection:
        getCollection(product),

      image,

      image_url: image,

      images:
        Array.isArray(product?.images)
          ? product.images
          : [],

      base_price: basePrice,

      sale_price:
        product?.sale_price ??
        product?.salePrice ??
        null,

      price,

      featured:
        getFeatured(product),

      active: true,
    };
  };

  const loadProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * CUSTOMER SHOP ENDPOINT
         *
         * This is the same product database
         * used by the admin panel.
         *
         * There is NO /admin dependency here.
         */

        const response =
          await api.get(
            "/products",
            {
              params: {
                page: 1,
                limit: 100,
                _: Date.now(),
              },
            }
          );

        const data =
          response?.data;

        if (
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              "Failed to load products."
          );
        }

        const rawProducts =
          data?.products ||
          data?.data?.products ||
          data?.data ||
          [];

        if (
          !Array.isArray(rawProducts)
        ) {
          throw new Error(
            "Invalid products response."
          );
        }

        /*
         * Only ACTIVE/PUBLISHED products
         * are visible to customers.
         */

        const activeProducts =
          rawProducts
            .filter(
              isProductActive
            )
            .map(
              normalizeProduct
            );

        /*
         * Load product images from the
         * public product image endpoint
         * when the main product response
         * doesn't contain an image.
         */

        const productsWithImages =
          await Promise.all(
            activeProducts.map(
              async (product) => {
                if (
                  product.image
                ) {
                  return product;
                }

                try {
                  const imageResponse =
                    await api.get(
                      `/products/${product.id}/images`,
                      {
                        params: {
                          _: Date.now(),
                        },
                      }
                    );

                  const imageData =
                    imageResponse?.data;

                  const images =
                    imageData?.images ||
                    imageData?.data?.images ||
                    imageData?.data ||
                    [];

                  if (
                    Array.isArray(images) &&
                    images.length > 0
                  ) {
                    const firstImage =
                      images.find(
                        (item) =>
                          Boolean(
                            getImageUrl(
                              item
                            )
                          )
                      );

                    const image =
                      getImageUrl(
                        firstImage
                      );

                    return {
                      ...product,

                      image,

                      image_url:
                        image,

                      images,
                    };
                  }
                } catch (imageError) {
                  console.warn(
                    `Could not load image for product ${product.id}:`,
                    imageError
                  );
                }

                return product;
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
          requestError?.response
            ?.data?.message ||
            requestError?.message ||
            "Unable to load products."
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProducts();

    const handleProductUpdate =
      () => {
        loadProducts();
      };

    /*
     * Allows the customer shop to
     * refresh when another part of
     * the application announces a
     * product update.
     */

    window.addEventListener(
      "productsUpdated",
      handleProductUpdate
    );

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          loadProducts();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.removeEventListener(
        "productsUpdated",
        handleProductUpdate
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  const filteredProducts =
    useMemo(() => {
      let result = [
        ...products,
      ];

      if (
        category !== "All"
      ) {
        result =
          result.filter(
            (product) =>
              String(
                product.category || ""
              )
                .toLowerCase()
                .trim() ===
              category
                .toLowerCase()
                .trim()
          );
      }

      if (
        collectionFromUrl
      ) {
        result =
          result.filter(
            (product) => {
              const productCollection =
                String(
                  product.collection ||
                    ""
                )
                  .toLowerCase()
                  .trim();

              return (
                productCollection ===
                  collectionFromUrl
                    .toLowerCase()
                    .trim() ||
                productCollection.includes(
                  collectionFromUrl
                    .toLowerCase()
                    .trim()
                )
              );
            }
          );
      }

      if (
        featuredFromUrl
      ) {
        result =
          result.filter(
            (product) =>
              product.featured
          );
      }

      if (
        sort === "price-low"
      ) {
        result.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );
      }

      if (
        sort === "price-high"
      ) {
        result.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );
      }

      if (
        sort === "name"
      ) {
        result.sort(
          (a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
        );
      }

      if (
        sort === "featured"
      ) {
        result.sort(
          (a, b) =>
            Number(
              b.featured
            ) -
            Number(
              a.featured
            )
        );
      }

      return result;
    }, [
      products,
      category,
      collectionFromUrl,
      featuredFromUrl,
      sort,
    ]);

  const handleCategory =
    (selectedCategory) => {
      const nextParams =
        new URLSearchParams(
          searchParams
        );

      if (
        selectedCategory === "All"
      ) {
        nextParams.delete(
          "category"
        );
      } else {
        nextParams.set(
          "category",
          selectedCategory
        );
      }

      setSearchParams(
        nextParams
      );
    };

  return (
    <div className="shop-page">

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
          Explore the latest
          drops, essential
          pieces and
          limited-run
          collections.
        </p>
      </section>

      <section className="shop-controls">

        <div className="category-list">

          {CATEGORIES.map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() =>
                  handleCategory(
                    item
                  )
                }
              >
                {item}
              </button>
            )
          )}

        </div>

        <div className="sort-wrapper">

          <label htmlFor="sort">
            SORT
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
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

      {!loading &&
        !error && (
          <div className="product-count">
            {filteredProducts.length}{" "}
            PRODUCTS
          </div>
        )}

      {error && (
        <div className="shop-empty">
          <h2>
            PRODUCTS COULD NOT BE LOADED
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadProducts
            }
          >
            TRY AGAIN
          </button>
        </div>
      )}

      <section className="shop-products">

        {loading ? (
          <div className="shop-empty">
            <h2>
              LOADING PRODUCTS
            </h2>

            <p>
              Please wait while
              we load the latest
              UNTKN collection.
            </p>
          </div>
        ) : error ? null : filteredProducts.length ===
          0 ? (
          <div className="shop-empty">
            <h2>
              NO PRODUCTS
            </h2>

            <p>
              No products were
              found in this
              category.
            </p>

            {category !==
              "All" && (
              <button
                type="button"
                onClick={() =>
                  handleCategory(
                    "All"
                  )
                }
              >
                VIEW ALL PRODUCTS
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map(
            (product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            )
          )
        )}

      </section>
    </div>
  );
}

export default Shop;