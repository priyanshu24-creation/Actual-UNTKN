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
    ImagePlus
} from "lucide-react";
import api from "../../services/api.js";

function slugify(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getBackendUrl() {
    const apiUrl =
        import.meta.env.VITE_API_URL ||
        "/api";

    return String(apiUrl)
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/api$/, "");
}

function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return "";
    }

    const value = String(imageUrl).trim();

    if (!value) {
        return "";
    }

    if (value.startsWith("blob:")) {
        return "";
    }

    if (
        value.startsWith("data:image/") ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value;
    }

    const backendUrl = getBackendUrl();

    const cleanPath = value.startsWith("/")
        ? value
        : `/${value}`;

    return `${backendUrl}${cleanPath}`;
}

function getCollectionImage(collection) {
    return getImageUrl(
        collection?.image_url ||
        collection?.image ||
        collection?.imageUrl ||
        ""
    );
}

function AdminCollections() {
    const [collections, setCollections] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [existingImageUrl, setExistingImageUrl] = useState("");
    const [removeExistingImage, setRemoveExistingImage] = useState(false);

    const [brokenImages, setBrokenImages] = useState({});

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        is_active: true
    });

    const loadCollections = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/collections");

            const data = response?.data || {};

            const loadedCollections =
                data.collections ||
                data.data?.collections ||
                data.data ||
                [];

            if (!Array.isArray(loadedCollections)) {
                throw new Error(
                    "Invalid collections response from server."
                );
            }

            const collectionsWithProducts =
                await Promise.all(
                    loadedCollections.map(
                        async (collection) => {
                            try {
                                const productsResponse =
                                    await api.get(
                                        "/products",
                                        {
                                            params: {
                                                collection:
                                                    collection.slug
                                            }
                                        }
                                    );

                                const productsData =
                                    productsResponse?.data ||
                                    {};

                                const products =
                                    productsData.products ||
                                    productsData.data
                                        ?.products ||
                                    productsData.data ||
                                    [];

                                return {
                                    ...collection,
                                    products: Array.isArray(
                                        products
                                    )
                                        ? products.length
                                        : Number(
                                            productsData.count ||
                                            0
                                        )
                                };
                            } catch (productError) {
                                console.error(
                                    `Failed to load products for collection ${collection.id}:`,
                                    productError
                                );

                                return {
                                    ...collection,
                                    products: 0
                                };
                            }
                        }
                    )
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

    const filteredCollections = useMemo(() => {
        const query = search.toLowerCase().trim();

        return collections.filter((collection) => {
            const name =
                collection.name?.toLowerCase() || "";

            const slug =
                collection.slug?.toLowerCase() || "";

            const description =
                collection.description?.toLowerCase() ||
                "";

            const matchesSearch =
                !query ||
                name.includes(query) ||
                slug.includes(query) ||
                description.includes(query);

            const active =
                Boolean(collection.is_active);

            const status = active
                ? "Active"
                : "Draft";

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
        statusFilter
    ]);

    const resetForm = () => {
        if (
            imagePreview &&
            imagePreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagePreview);
        }

        setFormData({
            name: "",
            slug: "",
            description: "",
            is_active: true
        });

        setImageFile(null);
        setImagePreview("");
        setExistingImageUrl("");
        setRemoveExistingImage(false);
    };

    const openCreateForm = () => {
        setEditingCollection(null);
        resetForm();
        setError("");
        setShowForm(true);
    };

    const openEditForm = (collection) => {
        if (
            imagePreview &&
            imagePreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagePreview);
        }

        setEditingCollection(collection);

        const existingImage =
            collection?.image_url || "";

        setFormData({
            name: collection?.name || "",
            slug: collection?.slug || "",
            description:
                collection?.description || "",
            is_active:
                Boolean(collection?.is_active)
        });

        setImageFile(null);
        setRemoveExistingImage(false);

        if (
            existingImage &&
            !existingImage.startsWith("blob:")
        ) {
            const imageUrl =
                getImageUrl(existingImage);

            setExistingImageUrl(existingImage);
            setImagePreview(imageUrl);
        } else {
            setExistingImageUrl("");
            setImagePreview("");
        }

        setError("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) {
            return;
        }

        setShowForm(false);
        setEditingCollection(null);
        resetForm();
    };

    const handleFormChange = (event) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    };

    const handleNameChange = (event) => {
        const value = event.target.value;

        setFormData((current) => ({
            ...current,
            name: value,
            slug: editingCollection
                ? current.slug
                : slugify(value)
        }));
    };

    const handleImageChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Please select a JPG, PNG or WebP image."
            );

            event.target.value = "";
            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setError(
                "Collection image must be smaller than 5 MB."
            );

            event.target.value = "";
            return;
        }

        if (
            imagePreview &&
            imagePreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagePreview);
        }

        const previewUrl =
            URL.createObjectURL(file);

        setImageFile(file);
        setImagePreview(previewUrl);
        setRemoveExistingImage(false);
        setError("");

        event.target.value = "";
    };

    const handleRemoveImage = () => {
        if (
            imagePreview &&
            imagePreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(null);
        setImagePreview("");

        if (existingImageUrl) {
            setRemoveExistingImage(true);
        } else {
            setRemoveExistingImage(false);
        }

        setError("");
    };

    const handleImageError = (collectionId) => {
        setBrokenImages((current) => ({
            ...current,
            [collectionId]: true
        }));
    };

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

            const cleanDescription =
                formData.description.trim();

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

            const payload = new FormData();

            payload.append(
                "name",
                cleanName
            );

            payload.append(
                "slug",
                cleanSlug
            );

            payload.append(
                "description",
                cleanDescription
            );

            payload.append(
                "is_active",
                String(
                    Boolean(
                        formData.is_active
                    )
                )
            );

            if (!editingCollection) {
                if (!imageFile) {
                    throw new Error(
                        "Please upload a collection image."
                    );
                }

                payload.append(
                    "image",
                    imageFile
                );

                await api.post(
                    "/collections",
                    payload,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );
            } else {
                if (imageFile) {
                    payload.append(
                        "image",
                        imageFile
                    );
                }

                payload.append(
                    "remove_image",
                    removeExistingImage
                        ? "true"
                        : "false"
                );

                await api.put(
                    `/collections/${editingCollection.id}`,
                    payload,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );
            }

            if (
                imagePreview &&
                imagePreview.startsWith("blob:")
            ) {
                URL.revokeObjectURL(imagePreview);
            }

            setShowForm(false);
            setEditingCollection(null);
            resetForm();

            setBrokenImages({});

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

    const handleToggleStatus = async (
        collection
    ) => {
        try {
            setError("");

            await api.put(
                `/collections/${collection.id}`,
                {
                    is_active:
                        !Boolean(
                            collection.is_active
                        )
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

    const activeCollections =
        collections.filter(
            (collection) =>
                Boolean(
                    collection.is_active
                )
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

    return (
        <section className="admin-page admin-collections-page">
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

            {error && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "14px 16px",
                        border: "1px solid #e5caca",
                        background: "#fff7f7",
                        color: "#a33"
                    }}
                >
                    {error}
                </div>
            )}

            {showForm && (
                <div
                    style={{
                        marginBottom: "30px",
                        border: "1px solid #ddd",
                        background: "#fff",
                        padding: "24px"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "flex-start",
                            marginBottom: "24px"
                        }}
                    >
                        <div>
                            <p className="admin-eyebrow">
                                COLLECTION
                            </p>

                            <h2
                                style={{
                                    marginTop: "6px"
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
                                background:
                                    "transparent",
                                cursor:
                                    "pointer"
                            }}
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(2, minmax(0, 1fr))",
                                gap: "20px"
                            }}
                        >
                            <div className="admin-form-group">
                                <label htmlFor="collection-name">
                                    Collection Name
                                </label>

                                <input
                                    id="collection-name"
                                    name="name"
                                    type="text"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleNameChange
                                    }
                                    placeholder="e.g. Summer Collection"
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="collection-slug">
                                    Slug
                                </label>

                                <input
                                    id="collection-slug"
                                    name="slug"
                                    type="text"
                                    value={
                                        formData.slug
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="summer-collection"
                                    required
                                />
                            </div>
                        </div>

                        <div
                            className="admin-form-group"
                            style={{
                                marginTop: "20px"
                            }}
                        >
                            <label>
                                Collection Image
                            </label>

                            <div
                                style={{
                                    marginTop: "10px",
                                    display: "flex",
                                    flexWrap:
                                        "wrap",
                                    gap: "16px",
                                    alignItems:
                                        "flex-start"
                                }}
                            >
                                <div
                                    style={{
                                        width: "220px",
                                        height: "160px",
                                        border:
                                            "1px solid #ddd",
                                        background:
                                            "#f5f5f5",
                                        overflow:
                                            "hidden",
                                        position:
                                            "relative",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center"
                                    }}
                                >
                                    {imagePreview ? (
                                        <img
                                            src={
                                                imagePreview
                                            }
                                            alt={
                                                formData.name ||
                                                "Collection preview"
                                            }
                                            style={{
                                                width:
                                                    "100%",
                                                height:
                                                    "100%",
                                                objectFit:
                                                    "cover",
                                                display:
                                                    "block"
                                            }}
                                            onError={() => {
                                                setImagePreview(
                                                    ""
                                                );
                                                setError(
                                                    "The collection image could not be loaded."
                                                );
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "center",
                                                gap:
                                                    "8px",
                                                color:
                                                    "#777",
                                                fontSize:
                                                    "11px",
                                                letterSpacing:
                                                    "0.08em"
                                            }}
                                        >
                                            <ImagePlus
                                                size={28}
                                            />

                                            <span>
                                                NO IMAGE
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        flexDirection:
                                            "column",
                                        gap: "10px"
                                    }}
                                >
                                    <label
                                        className="admin-primary-button"
                                        style={{
                                            cursor:
                                                "pointer",
                                            display:
                                                "inline-flex",
                                            width:
                                                "fit-content"
                                        }}
                                    >
                                        <ImagePlus
                                            size={16}
                                            strokeWidth={
                                                1.5
                                            }
                                        />

                                        {imagePreview
                                            ? "CHANGE IMAGE"
                                            : "UPLOAD IMAGE"}

                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            hidden
                                            onChange={
                                                handleImageChange
                                            }
                                        />
                                    </label>

                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={
                                                handleRemoveImage
                                            }
                                            disabled={
                                                saving
                                            }
                                            style={{
                                                padding:
                                                    "11px 16px",
                                                border:
                                                    "1px solid #ddd",
                                                background:
                                                    "#fff",
                                                cursor:
                                                    "pointer",
                                                fontSize:
                                                    "10px",
                                                letterSpacing:
                                                    "0.08em"
                                            }}
                                        >
                                            REMOVE IMAGE
                                        </button>
                                    )}

                                    <small
                                        style={{
                                            maxWidth:
                                                "220px",
                                            color:
                                                "#777",
                                            lineHeight:
                                                "1.5"
                                        }}
                                    >
                                        JPG, PNG or WebP.
                                        Maximum file size:
                                        5 MB.
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div
                            className="admin-form-group"
                            style={{
                                marginTop: "20px"
                            }}
                        >
                            <label htmlFor="collection-description">
                                Description
                            </label>

                            <textarea
                                id="collection-description"
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={
                                    handleFormChange
                                }
                                placeholder="Describe this collection..."
                                rows={4}
                            />
                        </div>

                        <div
                            style={{
                                marginTop: "20px",
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: "10px"
                            }}
                        >
                            <input
                                id="collection-active"
                                name="is_active"
                                type="checkbox"
                                checked={Boolean(
                                    formData.is_active
                                )}
                                onChange={
                                    handleFormChange
                                }
                            />

                            <label htmlFor="collection-active">
                                Active collection
                            </label>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "flex-end",
                                gap: "10px",
                                marginTop: "24px"
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
                        Fetching collection data from the
                        server.
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

                            const collectionImage =
                                getCollectionImage(
                                    collection
                                );

                            const imageBroken =
                                Boolean(
                                    brokenImages[
                                        collection.id
                                    ]
                                );

                            return (
                                <article
                                    className="admin-collection-card"
                                    key={
                                        collection.id
                                    }
                                >
                                    <div
                                        className="admin-collection-card-image"
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "220px",
                                            background:
                                                "#f3f3f3",
                                            overflow:
                                                "hidden"
                                        }}
                                    >
                                        {collectionImage &&
                                        !imageBroken ? (
                                            <img
                                                src={
                                                    collectionImage
                                                }
                                                alt={
                                                    collection.name
                                                }
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "100%",
                                                    objectFit:
                                                        "cover",
                                                    display:
                                                        "block"
                                                }}
                                                onError={() =>
                                                    handleImageError(
                                                        collection.id
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "100%",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    flexDirection:
                                                        "column",
                                                    gap:
                                                        "8px",
                                                    color:
                                                        "#888"
                                                }}
                                            >
                                                <ImagePlus
                                                    size={
                                                        28
                                                    }
                                                    strokeWidth={
                                                        1.2
                                                    }
                                                />

                                                <span
                                                    style={{
                                                        fontSize:
                                                            "10px",
                                                        letterSpacing:
                                                            "0.1em"
                                                    }}
                                                >
                                                    NO IMAGE
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="admin-collection-card-top">
                                        <div className="admin-collection-icon">
                                            <Layers
                                                size={22}
                                                strokeWidth={
                                                    1.4
                                                }
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

                                    <div className="admin-collection-card-content">
                                        <h2>
                                            {
                                                collection.name
                                            }
                                        </h2>

                                        <p className="admin-collection-slug">
                                            /
                                            {
                                                collection.slug
                                            }
                                        </p>

                                        <p className="admin-collection-description">
                                            {collection.description ||
                                                "No description provided."}
                                        </p>
                                    </div>

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
                                                size={
                                                    15
                                                }
                                                strokeWidth={
                                                    1.5
                                                }
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
                                                size={
                                                    15
                                                }
                                                strokeWidth={
                                                    1.5
                                                }
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
                                                size={
                                                    15
                                                }
                                                strokeWidth={
                                                    1.5
                                                }
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
                        Try changing your search or
                        status filter.
                    </p>
                </div>
            )}
        </section>
    );
}

export default AdminCollections;
