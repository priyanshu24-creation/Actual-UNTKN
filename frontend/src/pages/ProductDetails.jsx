import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
  Check,
  Heart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../services/api";
import ProductReviews from "../components/ProductReviews";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

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

const getVariantSize = (variant) => {
  if (!variant) {
    return "";
  }

  if (variant.size_name) {
    return String(variant.size_name);
  }

  if (typeof variant.size === "object" && variant.size !== null) {
    return String(
      variant.size.name ||
        variant.size.size_name ||
        variant.size.label ||
        ""
    );
  }

  return String(variant.size || variant.size_label || "");
};

const getVariantColor = (variant) => {
  if (!variant) {
    return "";
  }

  if (variant.color_name) {
    return String(variant.color_name);
  }

  if (typeof variant.color === "object" && variant.color !== null) {
    return String(
      variant.color.name ||
        variant.color.color_name ||
        variant.color.label ||
        ""
    );
  }

  return String(variant.color || variant.color_label || "");
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
  return !(
    variant?.active === false ||
    variant?.active === 0 ||
    variant?.is_active === false ||
    variant?.is_active === 0
  );
};

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

  const galleryTouchStartX = useRef(null);
  const galleryTouchStartY = useRef(null);

  const [addingToCart, setAddingToCart] = useState(false);
  const [bagNotification, setBagNotification] = useState(null);
  const [actionNotification, setActionNotification] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const routeValue = String(id || "").trim();

        if (!routeValue) {
          throw new Error("Product ID or slug is missing.");
        }

        let fullProduct = null;
        let initialProducts = [];

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
          if (slugError.response?.status !== 404) {
            console.warn("Product detail request failed:", slugError);
          }
        }

        if (!fullProduct && /^\d+$/.test(routeValue)) {
          const productsResponse = await api.get("/products");

          if (!productsResponse.data?.success) {
            throw new Error(
              productsResponse.data?.message ||
                "Failed to load products."
            );
          }

          initialProducts =
            productsResponse.data.products ||
            productsResponse.data.data ||
            [];

          fullProduct =
            initialProducts.find(
              (item) => Number(item.id) === Number(routeValue)
            ) || null;
        }

        if (!fullProduct) {
          throw new Error("Product not found.");
        }

        const numericProductId = Number(fullProduct.id);

        if (
          !Number.isInteger(numericProductId) ||
          numericProductId <= 0
        ) {
          throw new Error("Invalid product ID.");
        }

        const embeddedImages = Array.isArray(fullProduct.images)
          ? fullProduct.images
          : [];

        const directImage = getImageUrl(fullProduct.image);

        const initialImageUrls = embeddedImages
          .map(getImageUrl)
          .filter(
            (url) =>
              url &&
              !url.includes("example.com")
          );

        if (
          directImage &&
          !directImage.includes("example.com") &&
          !initialImageUrls.includes(directImage)
        ) {
          initialImageUrls.unshift(directImage);
        }

        if (!cancelled && initialImageUrls.length > 0) {
          setProductImages(initialImageUrls);
          setSelectedImage(initialImageUrls[0]);
        }

        const imagesPromise =
          initialImageUrls.length > 0
            ? Promise.resolve(initialImageUrls)
            : api
                .get(`/products/${numericProductId}/images`)
                .then((response) => {
                  if (!response.data?.success) {
                    return [];
                  }

                  return (
                    response.data.images ||
                    response.data.data ||
                    []
                  )
                    .map(getImageUrl)
                    .filter(
                      (url) =>
                        url &&
                        !url.includes("example.com")
                    );
                })
                .catch((imageError) => {
                  console.warn(
                    "Product images could not be loaded:",
                    imageError
                  );
                  return [];
                });

        const variantsPromise = Array.isArray(fullProduct.variants)
          ? Promise.resolve(fullProduct.variants)
          : api
              .get(`/products/${numericProductId}/variants`)
              .then((response) => {
                if (!response.data?.success) {
                  return [];
                }

                return (
                  response.data.variants ||
                  response.data.data ||
                  []
                );
              })
              .catch((variantError) => {
                console.warn(
                  "Product variants could not be loaded:",
                  variantError
                );
                return [];
              });

        const productsPromise =
          initialProducts.length > 0
            ? Promise.resolve(initialProducts)
            : api
                .get("/products")
                .then((response) => {
                  if (!response.data?.success) {
                    return [];
                  }

                  return (
                    response.data.products ||
                    response.data.data ||
                    []
                  );
                })
                .catch((productsError) => {
                  console.warn(
                    "Related products could not be loaded:",
                    productsError
                  );
                  return [];
                });

        const [loadedImages, loadedVariants, loadedProducts] =
          await Promise.all([
            imagesPromise,
            variantsPromise,
            productsPromise,
          ]);

        if (cancelled) {
          return;
        }

        const validImages = loadedImages.filter(Boolean);

        if (validImages.length > 0) {
          setProductImages(validImages);
          setSelectedImage((current) =>
            current && validImages.includes(current)
              ? current
              : validImages[0]
          );
        } else {
          setProductImages([]);
          setSelectedImage("");
        }

        const productVariants = loadedVariants.filter(
          isVariantActive
        );

        setVariants(productVariants);
        setAllProducts(loadedProducts);

        const basePrice = Number(
          fullProduct.base_price ??
            fullProduct.basePrice ??
            fullProduct.price ??
            0
        );

        const salePrice =
          fullProduct.sale_price !== null &&
          fullProduct.sale_price !== undefined
            ? Number(fullProduct.sale_price)
            : null;

        const finalPrice =
          salePrice !== null && salePrice < basePrice
            ? salePrice
            : basePrice;

        const normalizedProduct = {
          ...fullProduct,
          id: numericProductId,
          name:
            fullProduct.name ||
            fullProduct.product_name ||
            "UNTKN Product",
          slug: fullProduct.slug || "",
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

        setProduct(normalizedProduct);

        if (productVariants.length > 0) {
          const firstAvailableVariant =
            productVariants.find(
              (variant) => getVariantStock(variant) > 0
            ) || productVariants[0];

          if (firstAvailableVariant) {
            setSelectedSize(
              String(getVariantSize(firstAvailableVariant) || "")
            );
            setSelectedColor(
              String(getVariantColor(firstAvailableVariant) || "")
            );
            setQuantity(1);
          }
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load product:", requestError);

        setError(
          requestError.response?.data?.message ||
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

  

  const sizes = useMemo(() => {
    const sizeSet = new Set();

    

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

  

  const colors = useMemo(() => {
    const colorSet = new Set();

    

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

  

  const selectedVariant = useMemo(() => {
    if (
      variants.length === 0
    ) {
      return null;
    }

    

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

  

  const wishlistActive =
    product
      ? isInWishlist(
          product.id
        )
      : false;

  

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

  

  const handleColorChange = (
    color
  ) => {
    setSelectedColor(color);

    

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

  

  const handleSizeChange = (
    size
  ) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  

  const isAuthenticationError = (requestError) => {
    const status = requestError?.response?.status;

    if (status === 401 || status === 403) {
      return true;
    }

    const message = String(
      requestError?.response?.data?.message ||
        requestError?.message ||
        ""
    ).toLowerCase();

    return (
      message.includes("authentication required") ||
      message.includes("authentication is required") ||
      message.includes("login required") ||
      message.includes("log in required") ||
      message.includes("not authenticated") ||
      message.includes("unauthorized") ||
      message.includes("token is required") ||
      message.includes("token required")
    );
  };

  const redirectToLoginForBuyNow = () => {
    navigate("/login", {
      replace: false,
      state: {
        redirectTo: "/checkout",
        buyNow: true,
      },
    });
  };

  const handleAddToBag = async (redirectOnAuthentication = false) => {
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

      if (
        redirectOnAuthentication &&
        isAuthenticationError(addError)
      ) {
        redirectToLoginForBuyNow();
        return false;
      }

      setActionNotification({
        type: "error",
        message:
          addError.response?.data?.message ||
          addError.message ||
          "Unable to add product to bag.",
      });

      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (
      cannotAddToCart ||
      addingToCart ||
      !product
    ) {
      return;
    }

    setActionNotification(null);

    try {
      const response = await api.get("/auth/me", {
        validateStatus: (status) =>
          status >= 200 && status < 500,
      });

      const authenticated =
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.success === true &&
        !!response.data?.user;

      if (!authenticated) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          redirectToLoginForBuyNow();
          return;
        }

        setActionNotification({
          type: "error",
          message:
            response.data?.message ||
            "Unable to verify your account. Please try again.",
        });

        return;
      }

      const added = await handleAddToBag(true);

      if (added) {
        navigate("/checkout", {
          replace: true,
        });
      }
    } catch (authError) {
      console.error(
        "Buy Now authentication check failed:",
        authError
      );

      if (isAuthenticationError(authError)) {
        redirectToLoginForBuyNow();
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


  

  const handleImageError = (
    event
  ) => {
    event.currentTarget.style.display =
      "none";
  };

  

  const getCurrentImageIndex = () => {
    const index = productImages.indexOf(
      selectedImage
    );

    return index >= 0 ? index : 0;
  };

  const showNextImage = () => {
    if (productImages.length <= 1) {
      return;
    }

    const currentIndex = getCurrentImageIndex();
    const nextIndex =
      (currentIndex + 1) % productImages.length;

    setSelectedImage(productImages[nextIndex]);
  };

  const showPreviousImage = () => {
    if (productImages.length <= 1) {
      return;
    }

    const currentIndex = getCurrentImageIndex();
    const previousIndex =
      (currentIndex - 1 + productImages.length) %
      productImages.length;

    setSelectedImage(productImages[previousIndex]);
  };

  const handleGalleryTouchStart = (event) => {
    const touch = event.touches?.[0];

    if (!touch) {
      return;
    }

    galleryTouchStartX.current = touch.clientX;
    galleryTouchStartY.current = touch.clientY;
  };

  const handleGalleryTouchEnd = (event) => {
    if (galleryTouchStartX.current === null) {
      return;
    }

    const touch = event.changedTouches?.[0];

    if (!touch) {
      galleryTouchStartX.current = null;
      galleryTouchStartY.current = null;
      return;
    }

    const deltaX =
      touch.clientX - galleryTouchStartX.current;
    const deltaY =
      touch.clientY - galleryTouchStartY.current;

    galleryTouchStartX.current = null;
    galleryTouchStartY.current = null;

    if (
      Math.abs(deltaX) <= Math.abs(deltaY) ||
      Math.abs(deltaX) < 45
    ) {
      return;
    }

    if (deltaX < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
  };

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

  

  const relatedProducts =
    allProducts
      .filter(
        (item) =>
          Number(item.id) !==
          Number(product.id)
      )
      .slice(0, 4);

  

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
                    loading="lazy"
                    decoding="async"
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


      <section className="product-details">


        <div className="product-gallery">


          <div
            className="main-product-image"
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >

            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable="false"
                onError={handleImageError}
              />
            ) : (
              <div className="product-image-placeholder" />
            )}

            {discount > 0 && (
              <span className="product-discount">
                {discount}% OFF
              </span>
            )}

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-gallery-arrow product-gallery-prev"
                  onClick={showPreviousImage}
                  aria-label="Previous product image"
                >
                  <ChevronLeft
                    size={20}
                    strokeWidth={1.5}
                  />
                </button>

                <button
                  type="button"
                  className="product-gallery-arrow product-gallery-next"
                  onClick={showNextImage}
                  aria-label="Next product image"
                >
                  <ChevronRight
                    size={20}
                    strokeWidth={1.5}
                  />
                </button>

                <div
                  className="product-image-dots"
                  aria-label="Product image navigation"
                >
                  {productImages.map((image, index) => (
                    <button
                      key={`dot-${index}`}
                      type="button"
                      className={
                        selectedImage === image
                          ? "product-image-dot active"
                          : "product-image-dot"
                      }
                      onClick={() => setSelectedImage(image)}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>

                <span className="product-image-counter">
                  {getCurrentImageIndex() + 1}
                  {" / "}
                  {productImages.length}
                </span>
              </>
            )}

          </div>


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
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      onError={handleImageError}
                    />
                  </button>
                )
              )}

            </div>
          )}

        </div>


        <div className="product-details-info">

          <p className="product-category">
            {product.category ||
              "UNTKN"}
          </p>

          <h1>
            {product.name}
          </h1>


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


          {hasVariants &&
            !missingSelection &&
            !selectedVariant && (
              <p className="tax-note">
                THIS COMBINATION IS
                UNAVAILABLE
              </p>
            )}


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


      <ProductReviews
        productId={
          product.id
        }
      />


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
                    to={`/product/${item.slug || item.id}`}
                    className="related-card"
                  >

                    <div className="related-image">

                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
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
