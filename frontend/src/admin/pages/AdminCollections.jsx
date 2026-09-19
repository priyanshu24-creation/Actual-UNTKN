import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Layers,
  Package,
  X,
  Save,
} from "lucide-react";

import api from "../../services/api.js";

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminCollections() {
  // =====================================================
  // STATE
  // =====================================================

  const [collections, setCollections] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
  });

  // =====================================================
  // LOAD COLLECTIONS
  // =====================================================

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/collections");

      const data = response.data;

      const loadedCollections =
        data?.collections ||
        data?.data?.collections ||
        data?.data ||
        [];

      if (!Array.isArray(loadedCollections)) {
        throw new Error(
          "Invalid collections response from server."
        );
      }

      // -------------------------------------------------
      // Load product counts for every collection
      // -------------------------------------------------

      const collectionsWithProducts =
        await Promise.all(
          loadedCollections.map(async (collection) => {
            try {
              const productsResponse =
                await api.get("/products", {
                  params: {
                    collection: collection.slug,
                  },
                });

              const productsData =
                productsResponse.data;

              const products =
                productsData?.products ||
                productsData?.data?.products ||
                productsData?.data ||
                [];

              return {
                ...collection,
                products: Array.isArray(products)
                  ? products.length
                  : Number(
                      productsData?.count || 0
                    ),
              };
            } catch (productError) {
              console.error(
                `Failed to load products for collection ${collection.id}:`,
                productError
              );

              return {
                ...collection,
                products: 0,
              };
            }
          })
        );

      setCollections(collectionsWithProducts);
    } catch (requestError) {
      console.error(
        "Failed to load collections:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load collections."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredCollections = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    return collections.filter((collection) => {
      const name =
        collection.name?.toLowerCase() || "";

      const slug =
        collection.slug?.toLowerCase() || "";

      const description =
        collection.description?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query);

      const active =
        Boolean(collection.is_active);

      const status =
        active ? "Active" : "Draft";

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    collections,
    search,
    statusFilter,
  ]);

  // =====================================================
  // FORM
  // =====================================================

  const openCreateForm = () => {
    setEditingCollection(null);

    setFormData({
      name: "",
      slug: "",
      description: "",
      is_active: true,
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (collection) => {
    setEditingCollection(collection);

    setFormData({
      name: collection.name || "",
      slug: collection.slug || "",
      description:
        collection.description || "",
      is_active:
        Boolean(collection.is_active),
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCollection(null);

    setFormData({
      name: "",
      slug: "",
      description: "",
      is_active: true,
    });
  };

  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleNameChange = (event) => {
    const value = event.target.value;

    setFormData((current) => ({
      ...current,
      name: value,
      slug: editingCollection
        ? current.slug
        : slugify(value),
    }));
  };

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const cleanName =
        formData.name.trim();

      const cleanSlug =
        formData.slug.trim() ||
        slugify(cleanName);

      if (!cleanName) {
        throw new Error(
          "Collection name is required."
        );
      }

      if (!cleanSlug) {
        throw new Error(
          "Collection slug is required."
        );
      }

      const payload = {
        name: cleanName,
        slug: cleanSlug,
        description:
          formData.description.trim() ||
          null,
        is_active:
          Boolean(formData.is_active),
      };

      if (editingCollection) {
        await api.put(
          `/collections/${editingCollection.id}`,
          payload
        );
      } else {
        await api.post(
          "/collections",
          payload
        );
      }

      closeForm();

      await loadCollections();
    } catch (requestError) {
      console.error(
        "Collection save error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to save collection."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE STATUS
  // =====================================================

  const handleToggleStatus = async (
    collection
  ) => {
    try {
      setError("");

      await api.put(
        `/collections/${collection.id}`,
        {
          is_active:
            !Boolean(collection.is_active),
        }
      );

      await loadCollections();
    } catch (requestError) {
      console.error(
        "Collection status update error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to update collection status."
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    collection
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${collection.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/collections/${collection.id}`
      );

      await loadCollections();
    } catch (requestError) {
      console.error(
        "Collection delete error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to delete collection."
      );
    }
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const activeCollections =
    collections.filter(
      (collection) =>
        Boolean(collection.is_active)
    ).length;

  const assignedProducts =
    collections.reduce(
      (total, collection) =>
        total +
        Number(
          collection.products || 0
        ),
      0
    );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="admin-page admin-collections-page">

      {/* PAGE HEADER */}

      <div className="admin-page-header">

        <div>
          <p className="admin-eyebrow">
            STORE MANAGEMENT
          </p>

          <h1 className="admin-page-title">
            Collections
          </h1>

          <p className="admin-page-description">
            Organize products into collections and
            manage their visibility in the store.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openCreateForm}
          disabled={saving}
        >
          <Plus
            size={17}
            strokeWidth={1.5}
          />
          ADD COLLECTION
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border: "1px solid #e5caca",
            background: "#fff7f7",
            color: "#a33",
          }}
        >
          {error}
        </div>
      )}

      {/* CREATE / EDIT FORM */}

      {showForm && (
        <div
          style={{
            marginBottom: "30px",
            border: "1px solid #ddd",
            background: "#fff",
            padding: "24px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
            }}
          >

            <div>
              <p className="admin-eyebrow">
                COLLECTION
              </p>

              <h2
                style={{
                  marginTop: "6px",
                }}
              >
                {editingCollection
                  ? "Edit Collection"
                  : "Add Collection"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
              aria-label="Close form"
            >
              <X size={20} />
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "20px",
              }}
            >

              {/* NAME */}

              <div className="admin-form-group">

                <label htmlFor="collection-name">
                  Collection Name
                </label>

                <input
                  id="collection-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Summer Collection"
                  required
                />

              </div>

              {/* SLUG */}

              <div className="admin-form-group">

                <label htmlFor="collection-slug">
                  Slug
                </label>

                <input
                  id="collection-slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleFormChange}
                  placeholder="summer-collection"
                  required
                />

              </div>

            </div>

            {/* DESCRIPTION */}

            <div
              className="admin-form-group"
              style={{
                marginTop: "20px",
              }}
            >

              <label htmlFor="collection-description">
                Description
              </label>

              <textarea
                id="collection-description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe this collection..."
                rows={4}
              />

            </div>

            {/* ACTIVE */}

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >

              <input
                id="collection-active"
                name="is_active"
                type="checkbox"
                checked={
                  Boolean(
                    formData.is_active
                  )
                }
                onChange={handleFormChange}
              />

              <label htmlFor="collection-active">
                Active collection
              </label>

            </div>

            {/* ACTIONS */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
              }}
            >

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                CANCEL
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                <Save
                  size={16}
                  strokeWidth={1.5}
                />

                {saving
                  ? "SAVING..."
                  : editingCollection
                    ? "SAVE CHANGES"
                    : "CREATE COLLECTION"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* SUMMARY */}

      <div className="admin-collection-summary">

        <div className="admin-collection-summary-card">

          <div className="admin-collection-summary-icon">
            <Layers
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>
              Total Collections
            </span>

            <strong>
              {collections.length}
            </strong>
          </div>

        </div>

        <div className="admin-collection-summary-card">

          <div className="admin-collection-summary-icon">
            <Eye
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>
              Active
            </span>

            <strong>
              {activeCollections}
            </strong>
          </div>

        </div>

        <div className="admin-collection-summary-card">

          <div className="admin-collection-summary-icon">
            <Package
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <span>
              Assigned Products
            </span>

            <strong>
              {assignedProducts}
            </strong>
          </div>

        </div>

      </div>

      {/* TOOLBAR */}

      <div className="admin-toolbar admin-collections-toolbar">

        <div className="admin-search-box">

          <Search
            size={18}
            strokeWidth={1.5}
          />

          <input
            type="text"
            placeholder="Search collections..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

        <div className="admin-filter-group">

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            aria-label="Filter collections by status"
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Draft">
              Draft
            </option>
          </select>

        </div>

        <div className="admin-result-count">
          {filteredCollections.length} collection
          {filteredCollections.length !== 1
            ? "s"
            : ""}
        </div>

      </div>

      {/* COLLECTION GRID */}

      {loading ? (

        <div className="admin-empty-state">

          <Layers
            size={34}
            strokeWidth={1.2}
          />

          <h3>
            Loading collections
          </h3>

          <p>
            Fetching collection data from the server.
          </p>

        </div>

      ) : filteredCollections.length > 0 ? (

        <div className="admin-collection-grid">

          {filteredCollections.map(
            (collection) => {

              const active =
                Boolean(
                  collection.is_active
                );

              return (
                <article
                  className="admin-collection-card"
                  key={collection.id}
                >

                  {/* CARD TOP */}

                  <div className="admin-collection-card-top">

                    <div className="admin-collection-icon">
                      <Layers
                        size={22}
                        strokeWidth={1.4}
                      />
                    </div>

                    <span
                      className={`admin-status-badge ${
                        active
                          ? "delivered"
                          : "processing"
                      }`}
                    >
                      {active
                        ? "Active"
                        : "Draft"}
                    </span>

                  </div>

                  {/* CARD CONTENT */}

                  <div className="admin-collection-card-content">

                    <h2>
                      {collection.name}
                    </h2>

                    <p className="admin-collection-slug">
                      /{collection.slug}
                    </p>

                    <p className="admin-collection-description">
                      {collection.description ||
                        "No description provided."}
                    </p>

                  </div>

                  {/* CARD META */}

                  <div className="admin-collection-meta">

                    <div>
                      <span>
                        PRODUCTS
                      </span>

                      <strong>
                        {Number(
                          collection.products ||
                            0
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        CREATED
                      </span>

                      <strong>
                        {formatDate(
                          collection.created_at
                        )}
                      </strong>
                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="admin-collection-actions">

                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          collection
                        )
                      }
                    >
                      <Pencil
                        size={15}
                        strokeWidth={1.5}
                      />
                      EDIT
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(
                          collection
                        )
                      }
                    >
                      <Eye
                        size={15}
                        strokeWidth={1.5}
                      />

                      {active
                        ? "HIDE"
                        : "ACTIVATE"}
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        handleDelete(
                          collection
                        )
                      }
                      aria-label={`Delete ${collection.name}`}
                    >
                      <Trash2
                        size={15}
                        strokeWidth={1.5}
                      />
                    </button>

                  </div>

                </article>
              );
            }
          )}

        </div>

      ) : (

        <div className="admin-empty-state">

          <Layers
            size={34}
            strokeWidth={1.2}
          />

          <h3>
            No collections found
          </h3>

          <p>
            Try changing your search or status filter.
          </p>

        </div>

      )}

    </section>
  );
}

export default AdminCollections;