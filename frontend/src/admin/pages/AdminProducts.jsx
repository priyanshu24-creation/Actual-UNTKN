import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api.js";

function AdminProducts() {
  const [productList, setProductList] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const data = response.data;

      const products =
        data?.products ||
        data?.data?.products ||
        data?.data ||
        [];

      setProductList(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error("Failed to load products:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load products."
      );

      setProductList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories = useMemo(() => {
    const names = productList
      .map((product) => {
        if (typeof product.category === "object") {
          return product.category?.name;
        }

        return (
          product.category ||
          product.category_name ||
          product.categoryName
        );
      })
      .filter(Boolean);

    return ["All", ...new Set(names)];
  }, [productList]);

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return productList.filter((product) => {
      const name = String(product.name || "").toLowerCase();

      const slug = String(product.slug || "").toLowerCase();

      const sku = String(
        product.sku ||
          product.product_sku ||
          ""
      ).toLowerCase();

      const categoryName = getCategory(product).toLowerCase();

      const collectionName = getCollection(product).toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        slug.includes(searchValue) ||
        sku.includes(searchValue) ||
        categoryName.includes(searchValue) ||
        collectionName.includes(searchValue);

      const matchesCategory =
        category === "All" ||
        categoryName === category.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [productList, search, category]);

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const handleDelete = async (id) => {
    const product = productList.find(
      (item) => item.id === id
    );

    if (!product) return;

    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

      await api.delete(`/products/${id}`);

      setProductList((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Failed to delete product:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  function getCategory(product) {
    if (typeof product.category === "object") {
      return product.category?.name || "Uncategorized";
    }

    return (
      product.category ||
      product.category_name ||
      product.categoryName ||
      "Uncategorized"
    );
  }

  function getCollection(product) {
    if (typeof product.collection === "object") {
      return product.collection?.name || "";
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
      typeof product.image === "string"
    ) {
      return product.image;
    }

    if (
      product.primary_image &&
      typeof product.primary_image === "string"
    ) {
      return product.primary_image;
    }

    if (
      product.primaryImage &&
      typeof product.primaryImage === "string"
    ) {
      return product.primaryImage;
    }

    if (
      product.image_url &&
      typeof product.image_url === "string"
    ) {
      return product.image_url;
    }

    if (
      product.imageUrl &&
      typeof product.imageUrl === "string"
    ) {
      return product.imageUrl;
    }

    if (Array.isArray(product.images)) {
      const firstImage = product.images.find(
        (item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item?.image_url ||
            item?.imageUrl ||
            item?.url
          );
        }
      );

      if (typeof firstImage === "string") {
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
    if (Array.isArray(product.sizes)) {
      return product.sizes;
    }

    if (Array.isArray(product.variants)) {
      return [
        ...new Set(
          product.variants
            .map((variant) => {
              if (typeof variant.size === "object") {
                return variant.size?.name;
              }

              return (
                variant.size ||
                variant.size_name ||
                variant.sizeName
              );
            })
            .filter(Boolean)
        ),
      ];
    }

    return [];
  }

  function getStock(product) {
    if (Array.isArray(product.variants)) {
      return product.variants.reduce(
        (total, variant) =>
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
      product.is_active === false ||
      product.is_active === 0
    ) {
      return "Inactive";
    }

    if (
      product.published === false ||
      product.published === 0
    ) {
      return "Draft";
    }

    return "Active";
  }

  function formatPrice(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "0";
    }

    return number.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    fetchProducts();
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="admin-products-page">

      {/* PAGE HEADER */}

      <div className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">
            CATALOGUE
          </p>

          <h1>Products</h1>

          <p>
            Manage your products, pricing and inventory.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="admin-action-button"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh products"
          >
            <RefreshCw
              size={17}
              strokeWidth={1.6}
            />
          </button>

          <Link
            to="/admin/products/add"
            className="admin-primary-button"
          >
            <Plus
              size={18}
              strokeWidth={1.7}
            />

            Add Product
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}

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
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="admin-product-filter"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          {categories.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            padding: "14px 16px",
            marginBottom: "20px",
            border: "1px solid #e5caca",
            background: "#fff7f7",
            color: "#a33",
          }}
        >
          {error}
        </div>
      )}

      {/* PRODUCT PANEL */}

      <div className="admin-products-panel">

        <div className="admin-panel-heading">
          <div>
            <h2>All Products</h2>

            <span>
              {loading
                ? "Loading..."
                : `${filteredProducts.length} products`}
            </span>
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="admin-products-empty">
            <Package
              size={38}
              strokeWidth={1.3}
            />

            <h3>Loading products...</h3>

            <p>
              Fetching products from the database.
            </p>
          </div>

        ) : filteredProducts.length === 0 ? (

          /* EMPTY */

          <div className="admin-products-empty">
            <Package
              size={38}
              strokeWidth={1.3}
            />

            <h3>No products found</h3>

            <p>
              {productList.length === 0
                ? "No products are available in your database."
                : "Try changing your search or category filter."}
            </p>
          </div>

        ) : (

          /* TABLE */

          <div className="admin-products-table-wrapper">

            <table className="admin-products-table">

              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>COLLECTION</th>
                  <th>PRICE</th>
                  <th>SALE PRICE</th>
                  <th>SIZES</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.map((product) => {
                  const image = getImage(product);
                  const sizes = getSizes(product);
                  const stock = getStock(product);
                  const status = getStatus(product);

                  return (
                    <tr key={product.id}>

                      {/* PRODUCT */}

                      <td>
                        <div className="admin-product-info">

                          <div className="admin-product-image">

                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <Package
                                size={24}
                                strokeWidth={1.3}
                              />
                            )}

                          </div>

                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            <span>
                              ID: #{product.id}
                            </span>

                            {product.slug && (
                              <span>
                                {product.slug}
                              </span>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        <span className="admin-category-badge">
                          {getCategory(product)}
                        </span>
                      </td>

                      {/* COLLECTION */}

                      <td>
                        {getCollection(product) || "—"}
                      </td>

                      {/* PRICE */}

                      <td>
                        ₹
                        {formatPrice(
                          getOldPrice(product)
                        )}
                      </td>

                      {/* SALE PRICE */}

                      <td>
                        <strong>
                          ₹
                          {formatPrice(
                            getPrice(product)
                          )}
                        </strong>
                      </td>

                      {/* SIZES */}

                      <td>
                        {sizes.length > 0 ? (
                          <div className="admin-size-list">

                            {sizes.map(
                              (size, index) => {
                                const sizeValue =
                                  typeof size === "object"
                                    ? size?.name ||
                                      size?.size ||
                                      size?.value
                                    : size;

                                return (
                                  <span
                                    key={`${sizeValue}-${index}`}
                                  >
                                    {sizeValue}
                                  </span>
                                );
                              }
                            )}

                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* STOCK */}

                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              stock <= 5
                                ? "#a33"
                                : "inherit",
                          }}
                        >
                          {stock}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span>
                          {status}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="admin-product-actions">

                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="admin-action-button"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil
                              size={16}
                              strokeWidth={1.6}
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
                              size={16}
                              strokeWidth={1.6}
                            />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </section>
  );
}

export default AdminProducts;