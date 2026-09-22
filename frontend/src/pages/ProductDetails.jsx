import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
  Check,
  Heart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  X,
} from "lucide-react";

import api from "../services/api";
import ProductReviews from "../components/ProductReviews";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  const [productImages, setProductImages] = useState([]);
  const [variants, setVariants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");

  const [addingToCart, setAddingToCart] = useState(false);
  const [bagNotification, setBagNotification] = useState(null);
  const [actionNotification, setActionNotification] = useState(null);

  useEffect(() => {
    if (!bagNotification && !actionNotification) {
      return;
    }

    const timer = setTimeout(() => {
      setBagNotification(null);
      setActionNotification(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [bagNotification, actionNotification]);

  /* =====================================================
     IMAGE URL HELPER
  ===================================================== */

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

  /* =====================================================
     VARIANT HELPERS
  ===================================================== */

  const getVariantSize = (variant) => {
    return (
      variant?.size_name ||
      variant?.size ||
      variant?.size_label ||
      variant?.size?.name ||
      ""
    );
  };

  const getVariantColor = (variant) => {
    return (
      variant?.color_name ||
      variant?.color ||
      variant?.color_label ||
      variant?.color?.name ||
      ""
    );
  };

  const getVariantStock = (variant) => {
    return Number(
      variant?.stock_quantity ??
        variant?.stock ??
        variant?.quantity ??
        variant?.inventory ??
        0
    );
  };

  const isVariantActive = (variant) => {
    if (
      variant?.active === false ||
      variant?.active === 0
    ) {
      return false;
    }

    return true;
  };

  /* =====================================================
     LOAD PRODUCT
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const routeValue = String(id || "").trim();

        if (!routeValue) {
          throw new Error(
            "Product ID or slug is missing."
          );
        }

        let fullProduct = null;

        /* =================================================
           FIRST: TRY THE VALUE AS A SLUG

           Backend:
           GET /api/products/:slug
        ================================================= */

        try {
          const productResponse = await api.get(
            `/products/${encodeURIComponent(routeValue)}`
          );

          if (productResponse.data?.success) {
            fullProduct =
              productResponse.data.product ||
              productResponse.data.data ||
              null;
          }
        } catch (slugError) {
          console.warn(
            "Slug product request failed:",
            slugError
          );
        }

        /* =================================================
           SECOND: IF URL VALUE IS NUMERIC,
           FIND PRODUCT BY ID
        ================================================= */

        if (
          !fullProduct &&
          /^\d+$/.test(routeValue)
        ) {
          const productsResponse =
            await api.get("/products");

          if (!productsResponse.data?.success) {
            throw new Error(
              productsResponse.data?.message ||
                "Failed to load products."
            );
          }

          const apiProducts =
            productsResponse.data.products ||
            productsResponse.data.data ||
            [];

          if (!cancelled) {
            setAllProducts(apiProducts);
          }

          fullProduct =
            apiProducts.find(
              (item) =>
                Number(item.id) ===
                Number(routeValue)
            ) || null;
        }

        /* =================================================
           PRODUCT NOT FOUND
        ================================================= */

        if (!fullProduct) {
          throw new Error(
            "Product not found."
          );
        }

        if (cancelled) {
          return;
        }

        const numericProductId =
          Number(fullProduct.id);

        if (
          !Number.isInteger(numericProductId) ||
          numericProductId <= 0
        ) {
          throw new Error(
            "Invalid product ID."
          );
        }

        /* =================================================
           LOAD ALL PRODUCTS
           Used for related products
        ================================================= */

        try {
          const productsResponse =
            await api.get("/products");

          if (
            productsResponse.data?.success
          ) {
            const apiProducts =
              productsResponse.data.products ||
              productsResponse.data.data ||
              [];

            if (!cancelled) {
              setAllProducts(apiProducts);
            }
          }
        } catch (productsError) {
          console.warn(
            "Related products could not be loaded:",
            productsError
          );
        }

        /* =================================================
           LOAD IMAGES
        ================================================= */

        let images = [];

        if (
          Array.isArray(fullProduct.images)
        ) {
          images = fullProduct.images;
        }

        /*
         * Fallback to:
         * GET /api/products/:id/images
         */

        if (images.length === 0) {
          try {
            const imageResponse =
              await api.get(
                `/products/${numericProductId}/images`
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
            console.warn(
              "Product images could not be loaded:",
              imageError
            );
          }
        }

        const validImages = images
          .map(getImageUrl)
          .filter(
            (url) =>
              url &&
              !url.includes("example.com")
          );

        /*
         * Check direct image field as well.
         */

        const directImage =
          getImageUrl(
            fullProduct.image
          );

        if (
          directImage &&
          !directImage.includes(
            "example.com"
          ) &&
          !validImages.includes(
            directImage
          )
        ) {
          validImages.unshift(
            directImage
          );
        }

        if (!cancelled) {
          setProductImages(
            validImages
          );

          setSelectedImage(
            validImages[0] || ""
          );
        }

        /* =================================================
           LOAD VARIANTS
        ================================================= */

        let productVariants = [];

        /*
         * The backend product detail response
         * already contains variants.
         */

        if (
          Array.isArray(
            fullProduct.variants
          )
        ) {
          productVariants =
            fullProduct.variants;
        }

        /*
         * Fallback if variants are not embedded.
         */

        if (
          productVariants.length === 0
        ) {
          try {
            const variantResponse =
              await api.get(
                `/products/${numericProductId}/variants`
              );

            if (
              variantResponse.data?.success
            ) {
              productVariants =
                variantResponse.data.variants ||
                variantResponse.data.data ||
                [];
            }
          } catch (variantError) {
            console.warn(
              "Product variants could not be loaded:",
              variantError
            );
          }
        }

        /*
         * Only use active variants.
         */

        productVariants =
          productVariants.filter(
            isVariantActive
          );

        if (!cancelled) {
          setVariants(
            productVariants
          );
        }

        /* =================================================
           NORMALIZE PRODUCT
        ================================================= */

        const basePrice = Number(
          fullProduct.base_price ??
            fullProduct.basePrice ??
            fullProduct.price ??
            0
        );

        const salePrice =
          fullProduct.sale_price !==
            null &&
          fullProduct.sale_price !==
            undefined
            ? Number(
                fullProduct.sale_price
              )
            : null;

        const finalPrice =
          salePrice !== null &&
          salePrice < basePrice
            ? salePrice
            : basePrice;

        const normalizedProduct = {
          ...fullProduct,

          id: numericProductId,

          name:
            fullProduct.name ||
            fullProduct.product_name ||
            "UNTKN Product",

          slug:
            fullProduct.slug || "",

          category:
            fullProduct.category_name ||
            fullProduct.category ||
            "",

          collection:
            fullProduct.collection_name ||
            fullProduct.collection ||
            "",

          description:
            fullProduct.description ||
            "Designed for everyday movement and built with a relaxed streetwear fit. Detailed construction and premium materials make this piece part of the collection.",

          price: finalPrice,

          base_price: basePrice,

          sale_price: salePrice,

          images: validImages,

          variants: productVariants,
        };

        if (!cancelled) {
          setProduct(
            normalizedProduct
          );
        }

        /* =================================================
           DEFAULT VARIANT
        ================================================= */

        if (
          productVariants.length > 0
        ) {
          const firstAvailableVariant =
            productVariants.find(
              (variant) =>
                getVariantStock(
                  variant
                ) > 0
            ) ||
            productVariants[0];

          if (
            firstAvailableVariant &&
            !cancelled
          ) {
            const firstSize =
              getVariantSize(
                firstAvailableVariant
              );

            const firstColor =
              getVariantColor(
                firstAvailableVariant
              );

            setSelectedSize(
              String(firstSize || "")
            );

            setSelectedColor(
              String(firstColor || "")
            );

            setQuantity(1);
          }
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load product:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.message ||
            requestError.message ||
            "Unable to load product."
        );

        setProduct(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =====================================================
     SIZES
  ===================================================== */

  const sizes = useMemo(() => {
    const sizeSet = new Set();

    /*
     * Product-level sizes
     */

    if (
      Array.isArray(product?.sizes)
    ) {
      product.sizes.forEach(
        (size) => {
          const value =
            typeof size === "string"
              ? size
              : size?.name ||
                size?.size_name ||
                size?.label;

          if (value) {
            sizeSet.add(
              String(value)
            );
          }
        }
      );
    }

    /*
     * Variant sizes
     */

    variants.forEach(
      (variant) => {
        const value =
          getVariantSize(variant);

        if (value) {
          sizeSet.add(
            String(value)
          );
        }
      }
    );

    return Array.from(
      sizeSet
    );
  }, [
    product,
    variants,
  ]);

  /* =====================================================
     COLORS
  ===================================================== */

  const colors = useMemo(() => {
    const colorSet = new Set();

    /*
     * Product-level colors
     */

    if (
      Array.isArray(product?.colors)
    ) {
      product.colors.forEach(
        (color) => {
          const value =
            typeof color === "string"
              ? color
              : color?.name ||
                color?.color_name ||
                color?.label;

          if (value) {
            colorSet.add(
              String(value)
            );
          }
        }
      );
    }

    /*
     * Variant colors
     */

    variants.forEach(
      (variant) => {
        const value =
          getVariantColor(
            variant
          );

        if (value) {
          colorSet.add(
            String(value)
          );
        }
      }
    );

    return Array.from(
      colorSet
    );
  }, [
    product,
    variants,
  ]);

  /* =====================================================
     SELECTED VARIANT
  ===================================================== */

  const selectedVariant = useMemo(() => {
    if (
      variants.length === 0
    ) {
      return null;
    }

    /*
     * If the product has size/color
     * options, require both selections.
     */

    if (
      sizes.length > 0 &&
      !selectedSize
    ) {
      return null;
    }

    if (
      colors.length > 0 &&
      !selectedColor
    ) {
      return null;
    }

    return (
      variants.find(
        (variant) => {
          const variantSize =
            String(
              getVariantSize(
                variant
              )
            ).toLowerCase();

          const variantColor =
            String(
              getVariantColor(
                variant
              )
            ).toLowerCase();

          const currentSize =
            String(
              selectedSize || ""
            ).toLowerCase();

          const currentColor =
            String(
              selectedColor || ""
            ).toLowerCase();

          const sizeMatches =
            sizes.length === 0 ||
            variantSize ===
              currentSize;

          const colorMatches =
            colors.length === 0 ||
            variantColor ===
              currentColor;

          return (
            sizeMatches &&
            colorMatches
          );
        }
      ) || null
    );
  }, [
    variants,
    sizes,
    colors,
    selectedSize,
    selectedColor,
  ]);

  /* =====================================================
     STOCK
  ===================================================== */

  const stock = selectedVariant
    ? getVariantStock(
        selectedVariant
      )
    : variants.length === 0
      ? Number(
          product?.stock_quantity ??
            product?.stock ??
            product?.quantity ??
            0
        )
      : 0;

  const hasVariants =
    variants.length > 0;

  const missingSelection =
    (sizes.length > 0 &&
      !selectedSize) ||
    (colors.length > 0 &&
      !selectedColor);

  const invalidVariant =
    hasVariants &&
    !missingSelection &&
    !selectedVariant;

  const isOutOfStock =
    Boolean(
      selectedVariant
    ) &&
    stock <= 0;

  const cannotAddToCart =
    missingSelection ||
    invalidVariant ||
    isOutOfStock ||
    addingToCart;

  /* =====================================================
     PRICE
  ===================================================== */

  const currentPrice =
    selectedVariant?.price !==
      null &&
    selectedVariant?.price !==
      undefined
      ? Number(
          selectedVariant.price
        )
      : Number(
          product?.price || 0
        );

  const baseProductPrice =
    Number(
      product?.base_price || 0
    );

  const oldPrice =
    baseProductPrice >
    currentPrice
      ? baseProductPrice
      : null;

  const discount =
    oldPrice &&
    oldPrice > currentPrice
      ? Math.round(
          ((oldPrice -
            currentPrice) /
            oldPrice) *
            100
        )
      : 0;

  /* =====================================================
     WISHLIST
  ===================================================== */

  const wishlistActive =
    product
      ? isInWishlist(
          product.id
        )
      : false;

  /* =====================================================
     QUANTITY
  ===================================================== */

  const increaseQuantity = () => {
    if (
      selectedVariant
    ) {
      if (
        stock <= 0
      ) {
        return;
      }

      setQuantity(
        (current) =>
          Math.min(
            current + 1,
            stock
          )
      );

      return;
    }

    setQuantity(
      (current) =>
        current + 1
    );
  };

  const decreaseQuantity = () => {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  };

  /* =====================================================
     COLOR SELECTION
  ===================================================== */

  const handleColorChange = (
    color
  ) => {
    setSelectedColor(color);

    /*
     * If the current size does not exist
     * for the selected color, clear size.
     */

    if (
      selectedSize &&
      variants.length > 0
    ) {
      const combinationExists =
        variants.some(
          (variant) => {
            const variantColor =
              String(
                getVariantColor(
                  variant
                )
              ).toLowerCase();

            const variantSize =
              String(
                getVariantSize(
                  variant
                )
              ).toLowerCase();

            return (
              variantColor ===
                String(
                  color
                ).toLowerCase() &&
              variantSize ===
                String(
                  selectedSize
                ).toLowerCase()
            );
          }
        );

      if (!combinationExists) {
        setSelectedSize("");
      }
    }

    setQuantity(1);
  };

  /* =====================================================
     SIZE SELECTION
  ===================================================== */

  const handleSizeChange = (
    size
  ) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  /* =====================================================
     ADD TO BAG
  ===================================================== */

 const handleAddToBag =
  async () => {
    if (
      sizes.length > 0 &&
      !selectedSize
    ) {
      setActionNotification({
        type: "warning",
        message: "Please select a size.",
      });

      return false;
    }

    if (
      colors.length > 0 &&
      !selectedColor
    ) {
      setActionNotification({
        type: "warning",
        message: "Please select a color.",
      });

      return false;
    }

    if (
      hasVariants &&
      !selectedVariant
    ) {
      setActionNotification({
        type: "warning",
        message:
          "This size and color combination is unavailable.",
      });

      return false;
    }

    if (
      selectedVariant &&
      stock <= 0
    ) {
      setActionNotification({
        type: "warning",
        message:
          "This variant is out of stock.",
      });

      return false;
    }

    if (!product) {
      return false;
    }

    try {
      setAddingToCart(true);

      await addToCart(
        product,
        selectedSize,
        quantity,
        selectedVariant?.id ?? null
      );

      setBagNotification({
        name: product.name,
        size: selectedSize || "",
        color: selectedColor || "",
        image:
          selectedImage ||
          product.image ||
          "",
      });

      return true;
    } catch (addError) {
      console.error(
        "Add to cart failed:",
        addError
      );

      setActionNotification({
        type: "error",
        message:
          addError.message ||
          "Unable to add product to bag.",
      });

      return false;
    } finally {
      setAddingToCart(false);
    }
  };

const handleBuyNow = async () => {
  if (cannotAddToCart) {
    return;
  }

  try {
    const response = await api.get("/auth/me");

    if (!response.data?.success || !response.data?.user) {
      navigate("/login", {
        state: {
          redirectTo: "/checkout",
          buyNow: true,
        },
      });
      return;
    }

    const added = await handleAddToBag();

    if (added) {
      navigate("/checkout", { replace: true });
    }
  } catch (authError) {
    console.error("Buy Now authentication check failed:", authError);

    if (authError.response?.status === 401) {
      navigate("/login", {
        state: {
          redirectTo: "/checkout",
          buyNow: true,
        },
      });
      return;
    }

    setActionNotification({
      type: "error",
      message:
        authError.response?.data?.message ||
        "Unable to verify your account. Please try again.",
    });
  }
};

  /* =====================================================
     IMAGE ERROR
  ===================================================== */

  const handleImageError = (
    event
  ) => {
    event.currentTarget.style.display =
      "none";
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="product-not-found">
        <p className="eyebrow">
          UNTKN
        </p>

        <h1>
          LOADING
          <br />
          PRODUCT...
        </h1>

        <p>
          Please wait while we load
          the product details.
        </p>
      </div>
    );
  }

  /* =====================================================
     PRODUCT NOT FOUND
  ===================================================== */

  if (!product) {
    return (
      <div className="product-not-found">
        <p className="eyebrow">
          PRODUCT ERROR
        </p>

        <h1>
          PRODUCT
          <br />
          NOT FOUND.
        </h1>

        <p>
          {error ||
            "This product may have been removed or is no longer available."}
        </p>

        <Link
          to="/shop"
          className="product-not-found-button"
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  /* =====================================================
     RELATED PRODUCTS
  ===================================================== */

  const relatedProducts =
    allProducts
      .filter(
        (item) =>
          Number(item.id) !==
          Number(product.id)
      )
      .slice(0, 4);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="product-details-page">
      {bagNotification && (
        <div className="untkn-toast-stack">
          <div className="untkn-bag-toast" role="status" aria-live="polite">
            <div className="untkn-toast-topline">
              <div className="untkn-toast-success">
                <span className="untkn-toast-check">
                  <Check size={14} strokeWidth={2.6} />
                </span>
                <span>ADDED TO BAG</span>
              </div>

              <button
                type="button"
                className="untkn-toast-close"
                onClick={() => setBagNotification(null)}
                aria-label="Close notification"
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            <div className="untkn-toast-product">
              <div className="untkn-toast-product-image">
                {bagNotification.image ? (
                  <img
                    src={bagNotification.image}
                    alt={bagNotification.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>UNTKN</span>
                )}
              </div>

              <div className="untkn-toast-details">
                <strong>{bagNotification.name}</strong>
                <span>
                  {[bagNotification.color, bagNotification.size]
                    .filter(Boolean)
                    .join(" / ") || "Ready for checkout"}
                </span>
              </div>
            </div>

            <Link
              to="/cart"
              className="untkn-toast-view-bag"
              onClick={() => setBagNotification(null)}
            >
              <span>VIEW BAG</span>
              <span aria-hidden="true">→</span>
            </Link>

            <div className="untkn-toast-progress" />
          </div>
        </div>
      )}

      {actionNotification && (
        <div className="untkn-toast-stack untkn-toast-stack-action">
          <div
            className={`untkn-action-toast ${actionNotification.type}`}
            role="alert"
            aria-live="assertive"
          >
            <div className="untkn-action-icon">
              <X size={15} strokeWidth={2.4} />
            </div>

            <div className="untkn-action-content">
              <span>
                {actionNotification.type === "warning"
                  ? "PLEASE CHECK"
                  : "UNABLE TO ADD"}
              </span>
              <strong>{actionNotification.message}</strong>
            </div>

            <button
              type="button"
              className="untkn-action-close"
              onClick={() => setActionNotification(null)}
              aria-label="Close notification"
            >
              <X size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          PRODUCT
      ================================================= */}

      <section className="product-details">

        {/* =================================================
            IMAGE GALLERY
        ================================================= */}

        <div className="product-gallery">

          {/* MAIN IMAGE */}

          <div className="main-product-image">

            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                onError={
                  handleImageError
                }
              />
            ) : (
              <div className="product-image-placeholder" />
            )}

            {discount > 0 && (
              <span className="product-discount">
                {discount}% OFF
              </span>
            )}

          </div>

          {/* THUMBNAILS */}

          {productImages.length >
            0 && (
            <div className="thumbnail-row">

              {productImages.map(
                (
                  image,
                  index
                ) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={
                      selectedImage ===
                      image
                        ? "thumbnail active"
                        : "thumbnail"
                    }
                    onClick={() =>
                      setSelectedImage(
                        image
                      )
                    }
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${
                        index + 1
                      }`}
                      onError={
                        handleImageError
                      }
                    />
                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <div className="product-details-info">

          <p className="product-category">
            {product.category ||
              "UNTKN"}
          </p>

          <h1>
            {product.name}
          </h1>

          {/* PRICE */}

          <div className="details-price">

            <span>
              ₹
              {currentPrice.toLocaleString(
                "en-IN"
              )}
            </span>

            {oldPrice &&
              oldPrice >
                currentPrice && (
                <span className="details-old-price">
                  ₹
                  {oldPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}

            {discount > 0 && (
              <span className="details-discount">
                {discount}% OFF
              </span>
            )}

          </div>

          <p className="tax-note">
            Inclusive of all taxes
          </p>

          {/* =================================================
              COLOR
          ================================================= */}

          {colors.length > 0 && (
            <div className="size-section">

              <div className="size-heading">

                <span>
                  SELECT COLOR
                </span>

              </div>

              <div className="size-options">

                {colors.map(
                  (color) => {
                    const colorHasStock =
                      variants.some(
                        (variant) => {
                          const variantColor =
                            String(
                              getVariantColor(
                                variant
                              )
                            ).toLowerCase();

                          return (
                            variantColor ===
                              String(
                                color
                              ).toLowerCase() &&
                            getVariantStock(
                              variant
                            ) > 0
                          );
                        }
                      );

                    return (
                      <button
                        key={color}
                        type="button"
                        className={
                          selectedColor ===
                          color
                            ? "size-button selected"
                            : "size-button"
                        }
                        onClick={() =>
                          handleColorChange(
                            color
                          )
                        }
                        disabled={
                          !colorHasStock
                        }
                      >
                        {color}

                        {!colorHasStock && (
                          <span>
                            {" "}
                            OUT
                          </span>
                        )}
                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )}

          {/* =================================================
              SIZE
          ================================================= */}

          {sizes.length > 0 && (
            <div className="size-section">

              <div className="size-heading">

                <span>
                  SELECT SIZE
                </span>

                <button
                  type="button"
                >
                  SIZE GUIDE
                </button>

              </div>

              <div className="size-options">

                {sizes.map(
                  (size) => {
                    const sizeHasStock =
                      variants.some(
                        (variant) => {
                          const variantSize =
                            String(
                              getVariantSize(
                                variant
                              )
                            ).toLowerCase();

                          const variantColor =
                            String(
                              getVariantColor(
                                variant
                              )
                            ).toLowerCase();

                          const sizeMatches =
                            variantSize ===
                            String(
                              size
                            ).toLowerCase();

                          const colorMatches =
                            !selectedColor ||
                            variantColor ===
                              String(
                                selectedColor
                              ).toLowerCase();

                          return (
                            sizeMatches &&
                            colorMatches &&
                            getVariantStock(
                              variant
                            ) > 0
                          );
                        }
                      );

                    return (
                      <button
                        key={size}
                        type="button"
                        className={
                          selectedSize ===
                          size
                            ? "size-button selected"
                            : "size-button"
                        }
                        onClick={() =>
                          handleSizeChange(
                            size
                          )
                        }
                        disabled={
                          !sizeHasStock
                        }
                      >
                        {size}

                        {!sizeHasStock && (
                          <span>
                            {" "}
                            OUT
                          </span>
                        )}
                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )}

          {/* =================================================
              STOCK
          ================================================= */}

          {hasVariants &&
            selectedVariant && (
              <p className="tax-note">

                {isOutOfStock
                  ? "OUT OF STOCK"
                  : `${stock} ${
                      stock === 1
                        ? "ITEM"
                        : "ITEMS"
                    } AVAILABLE`}

              </p>
            )}

          {/* =================================================
              INVALID COMBINATION
          ================================================= */}

          {hasVariants &&
            !missingSelection &&
            !selectedVariant && (
              <p className="tax-note">
                THIS COMBINATION IS
                UNAVAILABLE
              </p>
            )}

          {/* =================================================
              QUANTITY
          ================================================= */}

          <div className="quantity-section">

            <span>
              QUANTITY
            </span>

            <div className="quantity-control">

              <button
                type="button"
                onClick={
                  decreaseQuantity
                }
                aria-label="Decrease quantity"
                disabled={
                  quantity <= 1
                }
              >
                <Minus
                  size={14}
                />
              </button>

              <span>
                {quantity}
              </span>

              <button
                type="button"
                onClick={
                  increaseQuantity
                }
                aria-label="Increase quantity"
                disabled={
                  Boolean(
                    selectedVariant
                  ) &&
                  quantity >=
                    stock
                }
              >
                <Plus
                  size={14}
                />
              </button>

            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="product-actions">

            <button
              type="button"
              className="add-to-bag"
              onClick={
                handleAddToBag
              }
              disabled={
                cannotAddToCart
              }
            >
              {addingToCart
                ? "ADDING..."
                : isOutOfStock
                  ? "OUT OF STOCK"
                  : "ADD TO BAG"}
            </button>

            <button
              type="button"
              className={
                wishlistActive
                  ? "wishlist-large active"
                  : "wishlist-large"
              }
              onClick={() =>
                toggleWishlist(
                  product
                )
              }
              aria-label="Wishlist"
            >
              <Heart
                size={20}
                fill={
                  wishlistActive
                    ? "currentColor"
                    : "none"
                }
              />
            </button>

          </div>

          {/* =================================================
              BUY NOW
          ================================================= */}

          <button
            type="button"
            className="buy-now"
            disabled={cannotAddToCart}
            onClick={handleBuyNow}
          >
            {addingToCart
              ? "ADDING..."
              : "BUY NOW →"}
          </button>

          {/* =================================================
              DELIVERY
          ================================================= */}

          <div className="delivery-box">

            <div className="delivery-item">

              <Truck
                size={20}
                strokeWidth={1.3}
              />

              <div>

                <strong>
                  FAST DELIVERY
                </strong>

                <p>
                  Delivery available
                  across India.
                </p>

              </div>

            </div>

            <div className="delivery-item">

              <RotateCcw
                size={20}
                strokeWidth={1.3}
              />

              <div>

                <strong>
                  EASY RETURNS
                </strong>

                <p>
                  Simple return and
                  exchange policy.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="product-description">

            <p className="eyebrow">
              PRODUCT DETAILS
            </p>

            <p>
              {product.description}
            </p>

          </div>

        </div>

      </section>

      {/* =================================================
          PRODUCT REVIEWS
      ================================================= */}

      <ProductReviews
        productId={
          product.id
        }
      />

      {/* =================================================
          RELATED PRODUCTS
      ================================================= */}

      {relatedProducts.length >
        0 && (
        <section className="related-section">

          <div className="related-header">

            <p className="eyebrow">
              YOU MAY ALSO LIKE
            </p>

            <h2>
              RELATED PRODUCTS
            </h2>

          </div>

          <div className="related-grid">

            {relatedProducts.map(
              (item) => {
                const itemImage =
                  getImageUrl(
                    item.image
                  ) ||
                  (Array.isArray(
                    item.images
                  )
                    ? getImageUrl(
                        item.images[0]
                      )
                    : "");

                return (
                  <Link
                    key={item.id}
                    to={`/product/${item.slug}`}
                    className="related-card"
                  >

                    <div className="related-image">

                      {itemImage ? (
                        <img
                          src={
                            itemImage
                          }
                          alt={
                            item.name
                          }
                          onError={
                            handleImageError
                          }
                        />
                      ) : (
                        <div className="product-image-placeholder" />
                      )}

                    </div>

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      ₹
                      {Number(
                        item.sale_price ??
                          item.base_price ??
                          item.price ??
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </Link>
                );
              }
            )}

          </div>

        </section>
      )}

    </div>
  );
} 
export default ProductDetails;