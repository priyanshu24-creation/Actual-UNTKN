import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Package,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import api from "../../services/api.js";

function AdminEditProduct() {
  const { id } = useParams();

  // ==========================================
  // PRODUCT STATE
  // ==========================================

  const [product, setProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    collection: "",
    price: "",
    oldPrice: "",
    description: "",
  });

  // ==========================================
  // OPTIONS
  // ==========================================

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  // ==========================================
  // VARIANTS
  // ==========================================

  const [variants, setVariants] = useState([]);

  const [variantForm, setVariantForm] = useState({
    size_id: "",
    color_id: "",
    sku: "",
    price: "",
    stock_quantity: "",
    active: true,
  });

  const [editingVariantId, setEditingVariantId] = useState(null);

  const [variantSaving, setVariantSaving] = useState(false);

  // ==========================================
  // IMAGES
  // ==========================================

  const [images, setImages] = useState([]);

  // ==========================================
  // UI STATE
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [variantError, setVariantError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // LOAD OPTIONS
  // ==========================================

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);

        const [
          categoriesResponse,
          collectionsResponse,
          sizesResponse,
          colorsResponse,
        ] = await Promise.all([
          api.get("/categories"),
          api.get("/collections"),
          api.get("/sizes"),
          api.get("/colors"),
        ]);

        const categoryData = categoriesResponse.data;
        const collectionData = collectionsResponse.data;
        const sizeData = sizesResponse.data;
        const colorData = colorsResponse.data;

        const loadedCategories =
          categoryData?.categories ||
          categoryData?.data?.categories ||
          categoryData?.data ||
          [];

        const loadedCollections =
          collectionData?.collections ||
          collectionData?.data?.collections ||
          collectionData?.data ||
          [];

        const loadedSizes =
          sizeData?.sizes ||
          sizeData?.data?.sizes ||
          sizeData?.data ||
          [];

        const loadedColors =
          colorData?.colors ||
          colorData?.data?.colors ||
          colorData?.data ||
          [];

        setCategories(
          Array.isArray(loadedCategories)
            ? loadedCategories
            : []
        );

        setCollections(
          Array.isArray(loadedCollections)
            ? loadedCollections
            : []
        );

        setSizes(
          Array.isArray(loadedSizes)
            ? loadedSizes
            : []
        );

        setColors(
          Array.isArray(loadedColors)
            ? loadedColors
            : []
        );
      } catch (requestError) {
        console.error(
          "Failed to load product options:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Failed to load categories, collections, sizes and colors."
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // ==========================================
  // LOAD PRODUCT
  // ==========================================

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const numericId = Number(id);

        if (
          !Number.isInteger(numericId) ||
          numericId <= 0
        ) {
          throw new Error("Invalid product ID.");
        }

        // --------------------------------------
        // LOAD PRODUCT LIST
        // --------------------------------------

        const productsResponse = await api.get(
          "/products",
          {
            params: {
              page: 1,
              limit: 100,
            },
          }
        );

        if (!productsResponse.data?.success) {
          throw new Error(
            productsResponse.data?.message ||
              "Failed to load products."
          );
        }

        const products =
          productsResponse.data.products ||
          productsResponse.data.data ||
          [];

        const basicProduct = products.find(
          (item) => Number(item.id) === numericId
        );

        if (!basicProduct) {
          throw new Error("Product not found.");
        }

        // --------------------------------------
        // LOAD FULL PRODUCT
        // --------------------------------------

        let fullProduct = basicProduct;

        if (basicProduct.slug) {
          try {
            const productResponse = await api.get(
              `/products/${basicProduct.slug}`
            );

            if (productResponse.data?.success) {
              fullProduct =
                productResponse.data.product ||
                productResponse.data.data ||
                basicProduct;
            }
          } catch (detailError) {
            console.warn(
              "Product detail request failed:",
              detailError
            );
          }
        }

        // --------------------------------------
        // LOAD IMAGES
        // --------------------------------------

        let productImages = [];

        if (Array.isArray(fullProduct.images)) {
          productImages = fullProduct.images;
        }

        if (productImages.length === 0) {
          try {
            const imageResponse = await api.get(
              `/products/${numericId}/images`
            );

            if (imageResponse.data?.success) {
              productImages =
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

        const normalizedImages = productImages
          .map((image) => {
            if (typeof image === "string") {
              return {
                id: null,
                preview: image,
                existing: true,
                file: null,
              };
            }

            return {
              id: image.id || null,
              preview:
                image.image_url ||
                image.image ||
                image.url ||
                "",
              existing: true,
              file: null,
            };
          })
          .filter(
            (image) =>
              image.preview &&
              !image.preview.includes("example.com")
          );

        // --------------------------------------
        // LOAD VARIANTS
        // --------------------------------------

        let productVariants = [];

        try {
          const variantResponse = await api.get(
            `/products/${numericId}/variants`
          );

          if (variantResponse.data?.success) {
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

        // --------------------------------------
        // NORMALIZE VARIANTS
        // --------------------------------------

        const normalizedVariants = Array.isArray(
          productVariants
        )
          ? productVariants.map((variant) => ({
              ...variant,

              id: Number(variant.id),

              size_id: variant.size_id
                ? Number(variant.size_id)
                : null,

              color_id: variant.color_id
                ? Number(variant.color_id)
                : null,

              price: Number(
                variant.price || 0
              ),

              stock_quantity: Number(
                variant.stock_quantity || 0
              ),

              active:
                variant.active !== false,
            }))
          : [];

        setVariants(normalizedVariants);

        // --------------------------------------
        // CALCULATE STOCK
        // --------------------------------------

        const totalStock =
          normalizedVariants.reduce(
            (total, variant) => {
              if (variant.active !== false) {
                return (
                  total +
                  Number(
                    variant.stock_quantity || 0
                  )
                );
              }

              return total;
            },
            0
          );

        // --------------------------------------
        // PRICES
        // --------------------------------------

        const basePrice = Number(
          fullProduct.base_price ??
            fullProduct.basePrice ??
            fullProduct.oldPrice ??
            0
        );

        const salePrice =
          fullProduct.sale_price !== null &&
          fullProduct.sale_price !== undefined
            ? Number(fullProduct.sale_price)
            : basePrice;

        // --------------------------------------
        // CATEGORY
        // --------------------------------------

        const categoryId =
          fullProduct.category_id ??
          fullProduct.category?.id ??
          "";

        // --------------------------------------
        // COLLECTION
        // --------------------------------------

        const collectionId =
          fullProduct.collection_id ??
          fullProduct.collection?.id ??
          "";

        // --------------------------------------
        // PRODUCT
        // --------------------------------------

        const normalizedProduct = {
          ...fullProduct,

          id: numericId,

          name: fullProduct.name || "",

          categoryId,

          collectionId,

          basePrice,

          salePrice,

          description:
            fullProduct.description || "",

          stock: totalStock,

          variants: normalizedVariants,

          images: normalizedImages,
        };

        setProduct(normalizedProduct);

        // --------------------------------------
        // FORM
        // --------------------------------------

        setFormData({
          name: normalizedProduct.name,

          category: String(categoryId || ""),

          collection: String(
            collectionId || ""
          ),

          price: salePrice,

          oldPrice: basePrice,

          description:
            normalizedProduct.description,
        });

        setImages(normalizedImages);
      } catch (requestError) {
        console.error(
          "Failed to load product:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load product."
        );

        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // ==========================================
  // TOTAL STOCK
  // ==========================================

  const totalStock = useMemo(() => {
    return variants.reduce(
      (total, variant) => {
        if (variant.active !== false) {
          return (
            total +
            Number(
              variant.stock_quantity || 0
            )
          );
        }

        return total;
      },
      0
    );
  }, [variants]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================
  // VARIANT FORM CHANGE
  // ==========================================

  const handleVariantChange = (event) => {
    const { name, value } = event.target;

    setVariantForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================
  // RESET VARIANT FORM
  // ==========================================

  const resetVariantForm = () => {
    setVariantForm({
      size_id: "",
      color_id: "",
      sku: "",
      price: formData.price || "",
      stock_quantity: "",
      active: true,
    });

    setEditingVariantId(null);
    setVariantError("");
  };

  // ==========================================
  // GENERATE SKU
  // ==========================================

  const generateSku = () => {
    const size = sizes.find(
      (item) =>
        Number(item.id) ===
        Number(variantForm.size_id)
    );

    const color = colors.find(
      (item) =>
        Number(item.id) ===
        Number(variantForm.color_id)
    );

    const productPart = formData.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const sizePart =
      size?.name
        ?.toUpperCase()
        .replace(/[^A-Z0-9]+/g, "") ||
      "SIZE";

    const colorPart =
      color?.name
        ?.toUpperCase()
        .replace(/[^A-Z0-9]+/g, "") ||
      "COLOR";

    const randomPart = Date.now()
      .toString()
      .slice(-6);

    return `${productPart}-${sizePart}-${colorPart}-${randomPart}`;
  };

  // ==========================================
  // START EDIT VARIANT
  // ==========================================

  const startEditVariant = (variant) => {
    setEditingVariantId(Number(variant.id));

    setVariantForm({
      size_id: variant.size_id
        ? String(variant.size_id)
        : "",

      color_id: variant.color_id
        ? String(variant.color_id)
        : "",

      sku: variant.sku || "",

      price: variant.price ?? "",

      stock_quantity:
        variant.stock_quantity ?? "",

      active: variant.active !== false,
    });

    setVariantError("");

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // ==========================================
  // SAVE VARIANT
  // ==========================================

  const handleVariantSubmit = async () => {
    if (variantSaving) return;

    setVariantError("");
    setSuccessMessage("");

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!variantForm.size_id) {
      setVariantError(
        "Please select a size."
      );
      return;
    }

    if (
      !variantForm.price ||
      Number(variantForm.price) < 0
    ) {
      setVariantError(
        "Please enter a valid variant price."
      );
      return;
    }

    if (
      variantForm.stock_quantity === "" ||
      Number(variantForm.stock_quantity) < 0
    ) {
      setVariantError(
        "Please enter a valid stock quantity."
      );
      return;
    }

    try {
      setVariantSaving(true);

      let sku = variantForm.sku.trim();

      if (!sku) {
        sku = generateSku();
      }

      const payload = {
        sku,

        size_id: Number(
          variantForm.size_id
        ),

        color_id: variantForm.color_id
          ? Number(variantForm.color_id)
          : null,

        price: Number(
          variantForm.price
        ),

        stock_quantity: Number(
          variantForm.stock_quantity
        ),

        active: Boolean(
          variantForm.active
        ),
      };

      // --------------------------------------
      // UPDATE EXISTING VARIANT
      // --------------------------------------

      if (editingVariantId) {
        const response = await api.put(
          `/products/${Number(
            id
          )}/variants/${Number(
            editingVariantId
          )}`,
          payload
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to update variant."
          );
        }

        const updatedVariant =
          response.data.variant ||
          response.data.data;

        setVariants((current) =>
          current.map((variant) => {
            if (
              Number(variant.id) !==
              Number(editingVariantId)
            ) {
              return variant;
            }

            return {
              ...variant,

              ...payload,

              id: Number(
                editingVariantId
              ),

              size_id: payload.size_id,

              color_id: payload.color_id,

              price: payload.price,

              stock_quantity:
                payload.stock_quantity,

              active: payload.active,

              ...(updatedVariant || {}),
            };
          })
        );

        setSuccessMessage(
          "Variant updated successfully."
        );
      }

      // --------------------------------------
      // CREATE NEW VARIANT
      // --------------------------------------

      else {
        const response = await api.post(
          `/products/${Number(
            id
          )}/variants`,
          payload
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to create variant."
          );
        }

        const createdVariant =
          response.data.variant ||
          response.data.data;

        if (!createdVariant?.id) {
          throw new Error(
            "Variant was created but no variant ID was returned."
          );
        }

        setVariants((current) => [
          ...current,
          {
            ...createdVariant,

            id: Number(
              createdVariant.id
            ),

            size_id: Number(
              createdVariant.size_id ??
                payload.size_id
            ),

            color_id:
              createdVariant.color_id
                ? Number(
                    createdVariant.color_id
                  )
                : payload.color_id,

            price: Number(
              createdVariant.price ??
                payload.price
            ),

            stock_quantity: Number(
              createdVariant.stock_quantity ??
                payload.stock_quantity
            ),

            active:
              createdVariant.active !==
              undefined
                ? Boolean(
                    createdVariant.active
                  )
                : payload.active,
          },
        ]);

        setSuccessMessage(
          "Variant added successfully."
        );
      }

      resetVariantForm();
    } catch (requestError) {
      console.error(
        "VARIANT SAVE ERROR:",
        requestError
      );

      setVariantError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to save variant."
      );
    } finally {
      setVariantSaving(false);
    }
  };

  // ==========================================
  // DELETE VARIANT
  // ==========================================

  const handleDeleteVariant = async (
    variant
  ) => {
    const confirmed = window.confirm(
      `Delete variant "${
        variant.sku || `#${variant.id}`
      }"?`
    );

    if (!confirmed) return;

    try {
      setVariantError("");
      setSuccessMessage("");

      const response = await api.delete(
        `/products/${Number(
          id
        )}/variants/${Number(
          variant.id
        )}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to delete variant."
        );
      }

      setVariants((current) =>
        current.filter(
          (item) =>
            Number(item.id) !==
            Number(variant.id)
        )
      );

      if (
        Number(editingVariantId) ===
        Number(variant.id)
      ) {
        resetVariantForm();
      }

      setSuccessMessage(
        "Variant deleted successfully."
      );
    } catch (requestError) {
      console.error(
        "DELETE VARIANT ERROR:",
        requestError
      );

      setVariantError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to delete variant."
      );
    }
  };

  // ==========================================
  // TOGGLE VARIANT ACTIVE
  // ==========================================

  const handleToggleVariant = async (
    variant
  ) => {
    try {
      setVariantError("");
      setSuccessMessage("");

      const payload = {
        sku: variant.sku,

        size_id: variant.size_id
          ? Number(variant.size_id)
          : null,

        color_id: variant.color_id
          ? Number(variant.color_id)
          : null,

        price: Number(
          variant.price
        ),

        stock_quantity: Number(
          variant.stock_quantity
        ),

        active: !variant.active,
      };

      const response = await api.put(
        `/products/${Number(
          id
        )}/variants/${Number(
          variant.id
        )}`,
        payload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update variant status."
        );
      }

      setVariants((current) =>
        current.map((item) =>
          Number(item.id) ===
          Number(variant.id)
            ? {
                ...item,
                active:
                  payload.active,
              }
            : item
        )
      );

      setSuccessMessage(
        payload.active
          ? "Variant activated."
          : "Variant deactivated."
      );
    } catch (requestError) {
      console.error(
        "TOGGLE VARIANT ERROR:",
        requestError
      );

      setVariantError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to update variant status."
      );
    }
  };

  // ==========================================
  // IMAGE CHANGE
  // ==========================================

  const handleImageChange = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    const newImages = files.map(
      (file) => ({
        id: null,
        file,
        preview:
          URL.createObjectURL(file),
        existing: false,
      })
    );

    setImages((current) => [
      ...current,
      ...newImages,
    ]);

    event.target.value = "";
  };

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  const removeImage = async (index) => {
    if (saving) {
        return;
    }

    const image = images[index];

    if (!image) {
        return;
    }

    setError("");
    setSuccessMessage("");

    // ==========================================
    // NEW IMAGE - ONLY REMOVE FROM LOCAL STATE
    // ==========================================

    if (!image.existing) {
        if (image.preview) {
            URL.revokeObjectURL(
                image.preview
            );
        }

        setImages((current) =>
            current.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );

        setSuccessMessage(
            "New image removed."
        );

        return;
    }

    // ==========================================
    // EXISTING DATABASE IMAGE
    // ==========================================

    if (!image.id) {
        setError(
            "This image does not have a valid database ID."
        );

        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to permanently delete this image?"
    );

    if (!confirmed) {
        return;
    }

    try {
        setSaving(true);

        const productId =
            Number(id);

        const imageId =
            Number(image.id);

        if (
            !Number.isInteger(
                productId
            ) ||
            productId <= 0
        ) {
            throw new Error(
                "Invalid product ID."
            );
        }

        if (
            !Number.isInteger(
                imageId
            ) ||
            imageId <= 0
        ) {
            throw new Error(
                "Invalid image ID."
            );
        }

        const response =
            await api.delete(
                `/products/${productId}/images/${imageId}`
            );

        if (
            !response.data?.success
        ) {
            throw new Error(
                response.data?.message ||
                    "Failed to delete image."
            );
        }

        setImages((current) =>
            current.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );

        setProduct((current) =>
            current
                ? {
                      ...current,
                      images:
                          current.images?.filter(
                              (item) =>
                                  Number(
                                      item.id
                                  ) !==
                                  imageId
                          ) || []
                  }
                : current
        );

        setSuccessMessage(
            "Product image deleted successfully."
        );
    } catch (requestError) {
        console.error(
            "DELETE PRODUCT IMAGE ERROR:",
            requestError
        );

        setError(
            requestError?.response?.data
                ?.message ||
                requestError?.message ||
                "Failed to delete product image."
        );
    } finally {
        setSaving(false);
    }
};

  // ==========================================
  // SLUG
  // ==========================================

  const createSlug = (name) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccessMessage("");

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!formData.name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!formData.category) {
      setError(
        "Please select a category."
      );
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setError(
        "Please enter a valid sale price."
      );
      return;
    }

    if (
      formData.oldPrice === "" ||
      Number(formData.oldPrice) < 0
    ) {
      setError(
        "Please enter a valid original price."
      );
      return;
    }

    if (
      Number(formData.price) >
      Number(formData.oldPrice)
    ) {
      setError(
        "Sale price cannot be greater than original price."
      );
      return;
    }

    try {
      setSaving(true);

      // --------------------------------------
      // UPDATE PRODUCT
      // --------------------------------------

      const updatePayload = {
        name: formData.name.trim(),

        slug: createSlug(
          formData.name
        ),

        category_id: formData.category
          ? Number(formData.category)
          : null,

        collection_id:
          formData.collection
            ? Number(formData.collection)
            : null,

        description:
          formData.description.trim() ||
          null,

        base_price: Number(
          formData.oldPrice
        ),

        sale_price: Number(
          formData.price
        ),

        currency:
          product?.currency || "INR",
      };

      const response = await api.put(
        `/products/${Number(id)}`,
        updatePayload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update product."
        );
      }

      // --------------------------------------
      // UPLOAD NEW IMAGES
      // --------------------------------------

      const newImages = images.filter(
        (image) =>
          !image.existing &&
          image.file
      );

      for (const image of newImages) {
        const imageFormData =
          new FormData();

        imageFormData.append(
          "image",
          image.file
        );

        await api.post(
          `/products/${Number(
            id
          )}/images`,
          imageFormData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      // ==========================================
// REFRESH PRODUCT IMAGES FROM DATABASE
// ==========================================

const refreshedImagesResponse =
    await api.get(
        `/products/${Number(id)}/images`
    );

if (
    refreshedImagesResponse.data?.success
) {
    const refreshedImages =
        refreshedImagesResponse.data.images ||
        [];

    const normalizedImages =
        refreshedImages
            .map((image) => ({
                id:
                    Number(image.id),
                preview:
                    image.image_url ||
                    "",
                existing: true,
                file: null,
            }))
            .filter(
                (image) =>
                    image.preview &&
                    !image.preview.includes(
                        "example.com"
                    )
            );

    setImages(
        normalizedImages
    );

    setProduct((current) =>
        current
            ? {
                  ...current,
                  images:
                      refreshedImages
              }
            : current
    );
}

      // --------------------------------------
      // UPDATE LOCAL PRODUCT
      // --------------------------------------

      setProduct((current) =>
        current
          ? {
              ...current,

              name:
                formData.name.trim(),

              categoryId:
                formData.category,

              collectionId:
                formData.collection,

              basePrice: Number(
                formData.oldPrice
              ),

              salePrice: Number(
                formData.price
              ),

              description:
                formData.description,
            }
          : current
      );

      // --------------------------------------
      // CLEAN PREVIEWS
      // --------------------------------------

      newImages.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(
            image.preview
          );
        }
      });

      setSuccessMessage(
        "Product updated successfully."
      );
    } catch (requestError) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <section className="admin-product-not-found">
        <Package
          size={38}
          strokeWidth={1.3}
        />

        <p className="admin-page-eyebrow">
          CATALOGUE
        </p>

        <h1>Loading Product</h1>

        <p>
          Fetching product information from
          the database.
        </p>
      </section>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!product) {
    return (
      <section className="admin-product-not-found">
        <p className="admin-page-eyebrow">
          CATALOGUE
        </p>

        <h1>Product Not Found</h1>

        <p>
          {error ||
            "The product you're trying to edit does not exist."}
        </p>

        <Link
          to="/admin/products"
          className="admin-primary-button"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>
      </section>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="admin-add-product-page">

      {/* HEADER */}

      <div className="admin-add-product-header">
        <div>
          <Link
            to="/admin/products"
            className="admin-back-link"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>

          <p className="admin-page-eyebrow">
            CATALOGUE
          </p>

          <h1>Edit Product</h1>

          <p>
            Update product information and
            inventory.
          </p>
        </div>
      </div>

      {/* PRODUCT ERROR */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border:
              "1px solid #e5caca",
            background: "#fff7f7",
            color: "#a33",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border:
              "1px solid #cfe4d2",
            background: "#f5fbf6",
            color: "#286b35",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* ======================================
          ONLY ONE FORM
      ====================================== */}

      <form
        className="admin-product-form"
        onSubmit={handleSubmit}
      >

        {/* ======================================
            LEFT COLUMN
        ====================================== */}

        <div className="admin-product-form-main">

          {/* PRODUCT INFORMATION */}

          <div className="admin-form-panel">
            <div className="admin-form-panel-header">
              <h2>
                Product Information
              </h2>

              <p>
                Update the basic product
                information.
              </p>
            </div>

            <div className="admin-form-body">

              <div className="admin-form-group">
                <label htmlFor="name">
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-grid">

                {/* CATEGORY */}

                <div className="admin-form-group">
                  <label htmlFor="category">
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={handleChange}
                    required
                    disabled={
                      loadingOptions
                    }
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {categories.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* COLLECTION */}

                <div className="admin-form-group">
                  <label htmlFor="collection">
                    Collection
                  </label>

                  <select
                    id="collection"
                    name="collection"
                    value={
                      formData.collection
                    }
                    onChange={handleChange}
                    disabled={
                      loadingOptions
                    }
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading collections..."
                        : "Select collection"}
                    </option>

                    {collections.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="admin-form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  placeholder="Product description..."
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>

          {/* PRICING */}

          <div className="admin-form-panel">

            <div className="admin-form-panel-header">
              <h2>
                Pricing & Inventory
              </h2>

              <p>
                Update pricing and manage
                variant inventory.
              </p>
            </div>

            <div className="admin-form-body">

              <div className="admin-form-grid">

                {/* ORIGINAL PRICE */}

                <div className="admin-form-group">

                  <label htmlFor="oldPrice">
                    Original Price
                  </label>

                  <div className="admin-input-prefix">

                    <span>₹</span>

                    <input
                      id="oldPrice"
                      name="oldPrice"
                      type="number"
                      min="0"
                      value={
                        formData.oldPrice
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                </div>

                {/* SALE PRICE */}

                <div className="admin-form-group">

                  <label htmlFor="price">
                    Sale Price
                  </label>

                  <div className="admin-input-prefix">

                    <span>₹</span>

                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      value={
                        formData.price
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                </div>

              </div>

              {/* TOTAL STOCK */}

              <div className="admin-form-group">

                <label>
                  Total Stock
                </label>

                <input
                  type="number"
                  value={totalStock}
                  disabled
                  readOnly
                />

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    opacity: 0.6,
                  }}
                >
                  Total stock is calculated
                  from active variants.
                </small>

              </div>

            </div>

          </div>

          {/* ====================================
              VARIANTS & INVENTORY
          ==================================== */}

          <div className="admin-form-panel">

            <div className="admin-form-panel-header">

              <h2>
                Variants & Inventory
              </h2>

              <p>
                Manage sizes, colors, SKU,
                prices and stock.
              </p>

            </div>

            <div className="admin-form-body">

              {/* VARIANT ERROR */}

              {variantError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    border:
                      "1px solid #e5caca",
                    background: "#fff7f7",
                    color: "#a33",
                  }}
                >
                  {variantError}
                </div>
              )}

              {/* =================================
                  VARIANT FORM
                  IMPORTANT:
                  This is a DIV, NOT A FORM.
              ================================= */}

              <div
                style={{
                  border:
                    "1px solid #e5e5e5",
                  padding: "18px",
                  marginBottom: "24px",
                  background: "#fafafa",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >

                  <strong>
                    {editingVariantId
                      ? "Edit Variant"
                      : "Add Variant"}
                  </strong>

                  {editingVariantId && (
                    <button
                      type="button"
                      onClick={
                        resetVariantForm
                      }
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        cursor: "pointer",
                        opacity: 0.7,
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}

                </div>

                {/* SIZE + COLOR */}

                <div className="admin-form-grid">

                  {/* SIZE */}

                  <div className="admin-form-group">

                    <label>
                      Size
                    </label>

                    <select
                      name="size_id"
                      value={
                        variantForm.size_id
                      }
                      onChange={
                        handleVariantChange
                      }
                      disabled={
                        loadingOptions
                      }
                    >

                      <option value="">
                        {loadingOptions
                          ? "Loading sizes..."
                          : "Select size"}
                      </option>

                      {sizes.map(
                        (size) => (
                          <option
                            key={size.id}
                            value={size.id}
                          >
                            {size.name}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* COLOR */}

                  <div className="admin-form-group">

                    <label>
                      Color
                    </label>

                    <select
                      name="color_id"
                      value={
                        variantForm.color_id
                      }
                      onChange={
                        handleVariantChange
                      }
                      disabled={
                        loadingOptions
                      }
                    >

                      <option value="">
                        No color
                      </option>

                      {colors.map(
                        (color) => (
                          <option
                            key={color.id}
                            value={color.id}
                          >
                            {color.name}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* SKU + PRICE */}

                <div className="admin-form-grid">

                  {/* SKU */}

                  <div className="admin-form-group">

                    <label>
                      SKU
                    </label>

                    <input
                      name="sku"
                      type="text"
                      placeholder="Leave empty to generate"
                      value={
                        variantForm.sku
                      }
                      onChange={
                        handleVariantChange
                      }
                    />

                  </div>

                  {/* VARIANT PRICE */}

                  <div className="admin-form-group">

                    <label>
                      Variant Price
                    </label>

                    <div className="admin-input-prefix">

                      <span>
                        ₹
                      </span>

                      <input
                        name="price"
                        type="number"
                        min="0"
                        value={
                          variantForm.price
                        }
                        onChange={
                          handleVariantChange
                        }
                      />

                    </div>

                  </div>

                </div>

                {/* STOCK + STATUS */}

                <div className="admin-form-grid">

                  {/* STOCK */}

                  <div className="admin-form-group">

                    <label>
                      Stock Quantity
                    </label>

                    <input
                      name="stock_quantity"
                      type="number"
                      min="0"
                      value={
                        variantForm.stock_quantity
                      }
                      onChange={
                        handleVariantChange
                      }
                    />

                  </div>

                  {/* ACTIVE */}

                  <div className="admin-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="active"
                      value={
                        variantForm.active
                          ? "true"
                          : "false"
                      }
                      onChange={(event) =>
                        setVariantForm(
                          (current) => ({
                            ...current,
                            active:
                              event.target
                                .value ===
                              "true",
                          })
                        )
                      }
                    >

                      <option value="true">
                        Active
                      </option>

                      <option value="false">
                        Inactive
                      </option>

                    </select>

                  </div>

                </div>

                {/* VARIANT BUTTONS */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "6px",
                  }}
                >

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={
                      handleVariantSubmit
                    }
                    disabled={
                      variantSaving
                    }
                  >

                    {editingVariantId ? (
                      <Pencil size={16} />
                    ) : (
                      <Plus size={17} />
                    )}

                    {variantSaving
                      ? "Saving..."
                      : editingVariantId
                      ? "Update Variant"
                      : "Add Variant"}

                  </button>

                  {editingVariantId && (
                    <button
                      type="button"
                      onClick={
                        resetVariantForm
                      }
                      className="admin-cancel-product-button"
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </div>

              {/* =================================
                  VARIANT LIST
              ================================= */}

              {variants.length === 0 ? (

                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 15px",
                    border:
                      "1px dashed #ddd",
                  }}
                >

                  <Package
                    size={32}
                    strokeWidth={1.3}
                  />

                  <p
                    style={{
                      marginBottom: "4px",
                      fontWeight: 600,
                    }}
                  >
                    No variants
                  </p>

                  <span
                    style={{
                      opacity: 0.6,
                    }}
                  >
                    Add a size variant above.
                  </span>

                </div>

              ) : (

                <div
                  style={{
                    overflowX: "auto",
                  }}
                >

                  <table className="admin-products-table">

                    <thead>

                      <tr>

                        <th>
                          SKU
                        </th>

                        <th>
                          SIZE
                        </th>

                        <th>
                          COLOR
                        </th>

                        <th>
                          PRICE
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

                      {variants.map(
                        (variant) => (

                          <tr
                            key={
                              variant.id
                            }
                          >

                            <td>

                              <strong>
                                {
                                  variant.sku ||
                                  `#${variant.id}`
                                }
                              </strong>

                            </td>

                            <td>

                              {variant.size_name ||
                                sizes.find(
                                  (item) =>
                                    Number(
                                      item.id
                                    ) ===
                                    Number(
                                      variant.size_id
                                    )
                                )?.name ||
                                "—"}

                            </td>

                            <td>

                              {variant.color_name ||
                                colors.find(
                                  (item) =>
                                    Number(
                                      item.id
                                    ) ===
                                    Number(
                                      variant.color_id
                                    )
                                )?.name ||
                                "—"}

                            </td>

                            <td>

                              ₹
                              {Number(
                                variant.price ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </td>

                            <td>

                              <strong>
                                {
                                  variant.stock_quantity
                                }
                              </strong>

                            </td>

                            <td>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleVariant(
                                    variant
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #ddd",
                                  background:
                                    variant.active
                                      ? "#f3faf4"
                                      : "#fafafa",
                                  color:
                                    variant.active
                                      ? "#28733a"
                                      : "#777",
                                  padding:
                                    "5px 9px",
                                  fontSize:
                                    "11px",
                                  cursor:
                                    "pointer",
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                {variant.active
                                  ? "Active"
                                  : "Inactive"}
                              </button>

                            </td>

                            <td>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: "7px",
                                }}
                              >

                                {/* EDIT */}

                                <button
                                  type="button"
                                  className="admin-action-button"
                                  onClick={() =>
                                    startEditVariant(
                                      variant
                                    )
                                  }
                                  aria-label="Edit variant"
                                >

                                  <Pencil
                                    size={15}
                                    strokeWidth={1.6}
                                  />

                                </button>

                                {/* DELETE */}

                                <button
                                  type="button"
                                  className="admin-action-button delete"
                                  onClick={() =>
                                    handleDeleteVariant(
                                      variant
                                    )
                                  }
                                  aria-label="Delete variant"
                                >

                                  <Trash2
                                    size={15}
                                    strokeWidth={1.6}
                                  />

                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* ======================================
            RIGHT COLUMN
        ====================================== */}

        <div className="admin-product-form-side">

          {/* PRODUCT IMAGES */}

          <div className="admin-form-panel">

            <div className="admin-form-panel-header">

              <h2>
                Product Images
              </h2>

              <p>
                Manage product images.
              </p>

            </div>

            <div className="admin-form-body">

              <label className="admin-image-upload">

                <Upload
                  size={25}
                  strokeWidth={1.4}
                />

                <strong>
                  Add More Images
                </strong>

                <span>
                  PNG, JPG or WEBP
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={
                    handleImageChange
                  }
                />

              </label>

              {images.length > 0 && (
                <div className="admin-image-preview-grid">

                  {images.map(
                    (image, index) => (

                      <div
                        className="admin-image-preview"
                        key={`${image.preview}-${index}`}
                      >

                        <img
                          src={
                            image.preview
                          }
                          alt={`${formData.name} ${
                            index + 1
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              index
                            )
                          }
                          aria-label="Remove image"
                        >

                          <X size={14} />

                        </button>

                      </div>

                    )
                  )}

                </div>
              )}

            </div>

          </div>

          {/* SAVE PRODUCT */}

          <div className="admin-form-panel admin-publish-panel">

            <div className="admin-form-panel-header">

              <h2>
                Save Changes
              </h2>

              <p>
                Update this product in your
                catalogue.
              </p>

            </div>

            <div className="admin-form-body">

              <button
                type="submit"
                className="admin-save-product-button"
                disabled={
                  saving ||
                  loadingOptions
                }
              >

                <Save size={17} />

                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}

              </button>

              <Link
                to="/admin/products"
                className="admin-cancel-product-button"
              >
                Cancel
              </Link>

            </div>

          </div>

        </div>

      </form>
    </section>
  );
}

export default AdminEditProduct;