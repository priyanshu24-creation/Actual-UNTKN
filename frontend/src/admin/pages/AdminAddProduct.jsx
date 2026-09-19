import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
} from "lucide-react";

import api from "../../services/api.js";

function AdminAddProduct() {
  const navigate = useNavigate();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    collection: "",
    price: "",
    oldPrice: "",
    description: "",
    stock: "",
  });

  const [images, setImages] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  // ==========================================
  // DATABASE OPTIONS
  // ==========================================

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // ==========================================
  // LOAD CATEGORIES, COLLECTIONS AND SIZES
  // ==========================================

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const [
          categoriesResponse,
          collectionsResponse,
          sizesResponse,
        ] = await Promise.all([
          api.get("/categories"),
          api.get("/collections"),
          api.get("/sizes"),
        ]);

        const categoryData = categoriesResponse.data;
        const collectionData = collectionsResponse.data;
        const sizeData = sizesResponse.data;

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
      } catch (err) {
        console.error(
          "Failed to load product options:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to load categories, collections and sizes."
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

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
  // SIZE SELECTION
  // ==========================================

  const toggleSize = (size) => {
    setSelectedSizes((current) => {
      if (current.includes(size)) {
        return current.filter(
          (item) => item !== size
        );
      }

      return [...current, size];
    });
  };

  // ==========================================
  // IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((current) => [
      ...current,
      ...newImages,
    ]);

    event.target.value = "";
  };

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  const removeImage = (index) => {
    setImages((current) => {
      const imageToRemove = current[index];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(
          imageToRemove.preview
        );
      }

      return current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      );
    });
  };

  // ==========================================
  // CREATE SLUG
  // ==========================================

  const createSlug = (name) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // ==========================================
  // FIND DATABASE OPTION
  // ==========================================

  const findOption = (items, value) => {
    return items.find(
      (item) =>
        String(item.id) === String(value) ||
        item.name === value
    );
  };

  // ==========================================
  // CREATE SKU
  // ==========================================

  const createSku = (productName, size) => {
    const base = productName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `${base}-${size}-${Date.now()}`;
  };

  // ==========================================
  // SUBMIT PRODUCT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    if (!formData.price) {
      setError("Sale price is required.");
      return;
    }

    if (!formData.oldPrice) {
      setError("Original price is required.");
      return;
    }

    if (!formData.stock) {
      setError("Stock quantity is required.");
      return;
    }

    if (selectedSizes.length === 0) {
      setError(
        "Please select at least one size."
      );
      return;
    }

    try {
      setSaving(true);

      // ------------------------------------------
      // FIND CATEGORY
      // ------------------------------------------

      const category = findOption(
        categories,
        formData.category
      );

      if (!category) {
        throw new Error(
          "Selected category was not found."
        );
      }

      // ------------------------------------------
      // FIND COLLECTION
      // ------------------------------------------

      let collection = null;

      if (formData.collection) {
        collection = findOption(
          collections,
          formData.collection
        );

        if (!collection) {
          throw new Error(
            "Selected collection was not found."
          );
        }
      }

      // ------------------------------------------
      // CREATE PRODUCT
      // ------------------------------------------

      const productPayload = {
        name: formData.name.trim(),

        slug: createSlug(
          formData.name
        ),

        category_id: Number(category.id),

        collection_id: collection
          ? Number(collection.id)
          : null,

        description:
          formData.description.trim() || null,

        base_price: Number(
          formData.oldPrice
        ),

        sale_price: Number(
          formData.price
        ),

        currency: "INR",

        published: true,

        featured: false,
      };

      const productResponse =
        await api.post(
          "/products",
          productPayload
        );

      const productData =
        productResponse.data;

      const createdProduct =
        productData?.product ||
        productData?.data?.product ||
        productData?.data;

      const productId =
        createdProduct?.id ||
        productData?.product_id ||
        productData?.data?.product_id;

      if (!productId) {
        throw new Error(
          "Product was created but no product ID was returned."
        );
      }

      // ------------------------------------------
      // CREATE VARIANTS
      // ------------------------------------------

      const totalStock = Number(
        formData.stock
      );

      const stockPerSize = Math.floor(
        totalStock /
          selectedSizes.length
      );

      let remainingStock =
        totalStock;

      for (
        let index = 0;
        index < selectedSizes.length;
        index++
      ) {
        const sizeName =
          selectedSizes[index];

        // Find real size from database
        const sizeRecord =
          sizes.find(
            (item) =>
              String(item.name)
                .trim()
                .toUpperCase() ===
              String(sizeName)
                .trim()
                .toUpperCase()
          );

        if (!sizeRecord) {
          throw new Error(
            `Size "${sizeName}" was not found in the database.`
          );
        }

        const stock =
          index ===
          selectedSizes.length - 1
            ? remainingStock
            : stockPerSize;

        remainingStock -= stock;

        await api.post(
          `/products/${productId}/variants`,
          {
            sku: createSku(
              formData.name,
              sizeName
            ),

            size_id: Number(
              sizeRecord.id
            ),

            color_id: null,

            price: Number(
              formData.price
            ),

            stock_quantity: stock,

            active: true,
          }
        );
      }

      // ------------------------------------------
      // UPLOAD PRODUCT IMAGES
      // ------------------------------------------

      for (
        let index = 0;
        index < images.length;
        index++
      ) {
        const image = images[index];

        const imageFormData =
          new FormData();

        imageFormData.append(
          "image",
          image.file
        );

        await api.post(
          `/products/${productId}/images`,
          imageFormData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      // ------------------------------------------
      // CLEAN PREVIEWS
      // ------------------------------------------

      images.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(
            image.preview
          );
        }
      });

      // ------------------------------------------
      // SUCCESS
      // ------------------------------------------

      alert(
        "Product created successfully."
      );

      navigate("/admin/products");

    } catch (err) {
      console.error(
        "CREATE PRODUCT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  };

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

          <h1>Add Product</h1>

          <p>
            Create a new product for your store.
          </p>

        </div>

      </div>

      {/* ERROR */}

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

      <form
        className="admin-product-form"
        onSubmit={handleSubmit}
      >

        {/* LEFT COLUMN */}

        <div className="admin-product-form-main">

          {/* PRODUCT INFORMATION */}

          <div className="admin-form-panel">

            <div className="admin-form-panel-header">

              <h2>
                Product Information
              </h2>

              <p>
                Basic information about the product.
              </p>

            </div>

            <div className="admin-form-body">

              {/* NAME */}

              <div className="admin-form-group">

                <label htmlFor="name">
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Karma"
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
                    onChange={
                      handleChange
                    }
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
                    onChange={
                      handleChange
                    }
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
                  placeholder="Write a description for this product..."
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

          </div>

          {/* PRICING & INVENTORY */}

          <div className="admin-form-panel">

            <div className="admin-form-panel-header">

              <h2>
                Pricing & Inventory
              </h2>

              <p>
                Set the price and available inventory.
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
                      placeholder="799"
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
                      placeholder="549"
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

              {/* STOCK */}

              <div className="admin-form-group">

                <label htmlFor="stock">
                  Total Stock
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="1"
                  placeholder="50"
                  value={
                    formData.stock
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              {/* SIZES */}

              <div className="admin-form-group">

                <label>
                  Available Sizes
                </label>

                <div className="admin-size-selector">

                  {availableSizes.map(
                    (size) => (
                      <button
                        key={size}
                        type="button"
                        className={
                          selectedSizes.includes(
                            size
                          )
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleSize(
                            size
                          )
                        }
                      >
                        {size}
                      </button>
                    )
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN */}

        <div className="admin-product-form-side">

          {/* IMAGES */}

          <div className="admin-form-panel">

            <div className="admin-form-panel-header">

              <h2>
                Product Images
              </h2>

              <p>
                Upload product images.
              </p>

            </div>

            <div className="admin-form-body">

              <label className="admin-image-upload">

                <Upload
                  size={25}
                  strokeWidth={1.4}
                />

                <strong>
                  Upload Images
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
                          alt={`Product preview ${
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

          {/* PUBLISH */}

          <div className="admin-form-panel admin-publish-panel">

            <div className="admin-form-panel-header">

              <h2>
                Publish Product
              </h2>

              <p>
                Save this product to your catalogue.
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
                  ? "Saving Product..."
                  : "Save Product"}
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

export default AdminAddProduct;