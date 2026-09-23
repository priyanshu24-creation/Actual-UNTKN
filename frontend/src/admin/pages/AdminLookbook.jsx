import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, X } from "lucide-react";
import api from "../../services/api.js";

function AdminLookbook() {
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    link_url: "",
    displayOrder: 1,
    isActive: true,
    imageFile: null,
    imagePreview: "",
  });

  // Fetch admin lookbook items
  useEffect(() => {
    const fetchLooks = async () => {
      try {
        const response = await api.get("/lookbook/admin");
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch lookbook items");
        }
        const formatted = response.data.looks.map((l) => ({
          id: l.id,
          title: l.title,
          subtitle: l.subtitle,
          description: l.description,
          image: l.image_url,
          displayOrder: Number(l.display_order),
          isActive: Boolean(l.is_active),
        }));
        setLooks(formatted.sort((a, b) => a.displayOrder - b.displayOrder));
        setError("");
      } catch (err) {
        console.error("Admin Lookbook fetch error:", err);
        setError("Unable to load Lookbook items.");
        setLooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLooks();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFormData((current) => ({
      ...current,
      imageFile: file,
      imagePreview: preview,
    }));
  };

  const handleAddLook = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a look title.");
      return;
    }
    if (!formData.imageFile) {
      alert("Please upload a look image.");
      return;
    }
    const payload = new FormData();
    payload.append("title", formData.title.trim());
    if (formData.subtitle) payload.append("subtitle", formData.subtitle.trim());
    if (formData.description) payload.append("description", formData.description.trim());
    if (formData.link_url) payload.append("link_url", formData.link_url.trim());
    payload.append("display_order", formData.displayOrder);
    payload.append("is_active", formData.isActive);
    payload.append("image", formData.imageFile);
    try {
      const response = await api.post("/lookbook/admin", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Create failed");
      }
      const newLook = {
        id: response.data.look.id,
        title: response.data.look.title,
        subtitle: response.data.look.subtitle,
        description: response.data.look.description,
        image: response.data.look.image_url,
        displayOrder: Number(response.data.look.display_order),
        isActive: Boolean(response.data.look.is_active),
      };
      setLooks((current) =>
        [...current, newLook].sort((a, b) => a.displayOrder - b.displayOrder)
      );
      // Reset form
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        link_url: "",
        displayOrder: looks.length + 2,
        isActive: true,
        imageFile: null,
        imagePreview: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Create lookbook error:", err);
      alert(err.message || "Failed to create lookbook item");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this look?");
    if (!confirmed) return;
    try {
      const response = await api.delete(`/lookbook/admin/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Delete failed");
      }
      setLooks((current) => current.filter((look) => look.id !== id));
    } catch (err) {
      console.error("Delete lookbook error:", err);
      alert(err.message || "Failed to delete lookbook item");
    }
  };

  const handleToggle = async (id) => {
    try {
      const response = await api.patch(`/lookbook/admin/${id}/toggle`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Toggle failed");
      }
      setLooks((current) =>
        current.map((look) =>
          look.id === id ? { ...look, isActive: response.data.isActive } : look
        )
      );
    } catch (err) {
      console.error("Toggle lookbook error:", err);
      alert(err.message || "Failed to toggle visibility");
    }
  };

  if (loading) {
    return (
      <div className="admin-lookbook-page">
        <section className="admin-page-header">
          <div>
            <p className="admin-eyebrow">CONTENT MANAGEMENT</p>
            <h1>Lookbook</h1>
            <p>Manage the looks and photos displayed on the customer website.</p>
          </div>
        </section>
        <section
          className="lookbook-grid"
          style={{
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Loading Lookbook...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-lookbook-page">
      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">CONTENT MANAGEMENT</p>
          <h1>Lookbook</h1>
          <p>Manage the looks and photos displayed on the customer website.</p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={17} strokeWidth={1.6} />
          <span>ADD NEW LOOK</span>
        </button>
      </div>

      {/* ADD LOOK FORM */}
      {showForm && (
        <div className="admin-lookbook-form-panel">
          <div className="admin-lookbook-form-header">
            <div>
              <p className="admin-eyebrow">NEW LOOK</p>
              <h2>Add Lookbook Photo</h2>
            </div>
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddLook}>
            <div className="admin-lookbook-form-grid">
              {/* IMAGE */}
              <div className="admin-lookbook-upload">
                {formData.imagePreview ? (
                  <img src={formData.imagePreview} alt="Look preview" />
                ) : (
                  <div className="admin-lookbook-upload-empty">
                    <ImagePlus size={30} />
                    <span>Upload lookbook photo</span>
                  </div>
                )}

                <label className="admin-upload-button">
                  <ImagePlus size={16} />
                  {formData.imagePreview ? "CHANGE PHOTO" : "UPLOAD PHOTO"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              </div>

              {/* FIELDS */}
              <div className="admin-lookbook-fields">
                <div className="admin-settings-field full">
                  <label htmlFor="title">LOOK TITLE</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="MISERY WORLD"
                  />
                </div>

                <div className="admin-settings-field full">
                  <label htmlFor="subtitle">SUBTITLE</label>
                  <input
                    id="subtitle"
                    name="subtitle"
                    type="text"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="CAMPAIGN 01"
                  />
                </div>

                <div className="admin-settings-field full">
                  <label htmlFor="description">DESCRIPTION</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Heavyweight pieces. Made in short runs."
                    rows={4}
                  />
                </div>

                <div className="admin-settings-field">
                  <label htmlFor="link_url">LINK URL</label>
                  <input
                    id="link_url"
                    name="link_url"
                    type="text"
                    value={formData.link_url}
                    onChange={handleChange}
                    placeholder="/shop"
                  />
                </div>

                <div className="admin-settings-field">
                  <label htmlFor="displayOrder">DISPLAY ORDER</label>
                  <input
                    id="displayOrder"
                    name="displayOrder"
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={handleChange}
                  />
                </div>

                <label className="admin-settings-toggle">
                  <div>
                    <strong>Show on website</strong>
                    <span>Display this look in the customer Lookbook section.</span>
                  </div>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="admin-lookbook-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowForm(false)}
              >
                CANCEL
              </button>

              <button type="submit" className="admin-primary-button">
                <Plus size={16} />
                ADD LOOK
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOOKBOOK LIST */}
      <div className="admin-lookbook-list">
        {error && (
          <div
            style={{
              padding: "12px 20px",
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}
        {looks.length === 0 ? (
          <div className="admin-lookbook-empty">
            <ImagePlus size={35} />
            <h2>No looks added yet</h2>
            <p>Add your first lookbook photo to display it on the website.</p>
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              ADD FIRST LOOK
            </button>
          </div>
        ) : (
          looks.map((look) => (
            <article
              className={`admin-lookbook-card ${!look.isActive ? "inactive" : ""}`}
              key={look.id}
            >
              {/* IMAGE */}
              <div className="admin-lookbook-card-image">
                <img src={look.image} alt={look.title} />
                {!look.isActive && (
                  <div className="admin-lookbook-hidden">
                    <EyeOff size={18} />
                    HIDDEN
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="admin-lookbook-card-content">
                <div className="admin-lookbook-card-top">
                  <div>
                    <span className="admin-lookbook-order">
                      LOOK {String(look.displayOrder).padStart(2, "0")}
                    </span>
                    <h2>{look.title}</h2>
                    <p>{look.description || "No description added."}</p>
                  </div>

                  <span
                    className={`admin-lookbook-status ${
                      look.isActive ? "active" : "inactive"
                    }`}
                  >
                    {look.isActive ? "VISIBLE" : "HIDDEN"}
                  </span>
                </div>

                <div className="admin-lookbook-card-actions">
                  <button
                    type="button"
                    className="admin-lookbook-action"
                    onClick={() => handleToggle(look.id)}
                  >
                    {look.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    {look.isActive ? "HIDE" : "SHOW"}
                  </button>

                  <button type="button" className="admin-lookbook-action">
                    <Pencil size={15} /> EDIT
                  </button>

                  <button
                    type="button"
                    className="admin-lookbook-action danger"
                    onClick={() => handleDelete(look.id)}
                  >
                    <Trash2 size={15} /> DELETE
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminLookbook;