import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ImagePlus,
  X,
} from "lucide-react";

function AdminLookbook() {
  const [looks, setLooks] = useState([
    {
      id: 1,
      title: "MISERY WORLD",
      description: "Heavyweight pieces. Made in short runs.",
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85",
      displayOrder: 1,
      isActive: true,
    },
    {
      id: 2,
      title: "KARMA",
      description: "Graphic pieces for the unexpected.",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
      displayOrder: 2,
      isActive: true,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    displayOrder: 1,
    isActive: true,
  });

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

    const imageUrl = URL.createObjectURL(file);

    setFormData((current) => ({
      ...current,
      image: imageUrl,
    }));
  };

  const handleAddLook = (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a look title.");
      return;
    }

    if (!formData.image) {
      alert("Please upload a look image.");
      return;
    }

    const newLook = {
      id: Date.now(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      image: formData.image,
      displayOrder: Number(formData.displayOrder),
      isActive: formData.isActive,
    };

    setLooks((current) =>
      [...current, newLook].sort(
        (a, b) => a.displayOrder - b.displayOrder
      )
    );

    setFormData({
      title: "",
      description: "",
      image: "",
      displayOrder: looks.length + 1,
      isActive: true,
    });

    setShowForm(false);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this look?"
    );

    if (!confirmed) return;

    setLooks((current) =>
      current.filter((look) => look.id !== id)
    );
  };

  const handleToggle = (id) => {
    setLooks((current) =>
      current.map((look) =>
        look.id === id
          ? {
              ...look,
              isActive: !look.isActive,
            }
          : look
      )
    );
  };

  return (
    <section className="admin-lookbook-page">
      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">CONTENT MANAGEMENT</p>

          <h1>Lookbook</h1>

          <p>
            Manage the looks and photos displayed on the
            customer website.
          </p>
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
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Look preview"
                  />
                ) : (
                  <div className="admin-lookbook-upload-empty">
                    <ImagePlus size={30} />

                    <span>
                      Upload lookbook photo
                    </span>
                  </div>
                )}

                <label className="admin-upload-button">
                  <ImagePlus size={16} />
                  {formData.image
                    ? "CHANGE PHOTO"
                    : "UPLOAD PHOTO"}

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
                  <label htmlFor="title">
                    LOOK TITLE
                  </label>

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
                  <label htmlFor="description">
                    DESCRIPTION
                  </label>

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
                  <label htmlFor="displayOrder">
                    DISPLAY ORDER
                  </label>

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

                    <span>
                      Display this look in the customer
                      Lookbook section.
                    </span>
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

              <button
                type="submit"
                className="admin-primary-button"
              >
                <Plus size={16} />
                ADD LOOK
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOOKBOOK LIST */}
      <div className="admin-lookbook-list">
        {looks.length === 0 ? (
          <div className="admin-lookbook-empty">
            <ImagePlus size={35} />

            <h2>No looks added yet</h2>

            <p>
              Add your first lookbook photo to display it
              on the website.
            </p>

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
              className={`admin-lookbook-card ${
                !look.isActive ? "inactive" : ""
              }`}
              key={look.id}
            >
              {/* IMAGE */}
              <div className="admin-lookbook-card-image">
                <img
                  src={look.image}
                  alt={look.title}
                />

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

                    <p>
                      {look.description ||
                        "No description added."}
                    </p>
                  </div>

                  <span
                    className={`admin-lookbook-status ${
                      look.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {look.isActive
                      ? "VISIBLE"
                      : "HIDDEN"}
                  </span>
                </div>

                <div className="admin-lookbook-card-actions">
                  <button
                    type="button"
                    className="admin-lookbook-action"
                    onClick={() =>
                      handleToggle(look.id)
                    }
                  >
                    {look.isActive ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}

                    {look.isActive
                      ? "HIDE"
                      : "SHOW"}
                  </button>

                  <button
                    type="button"
                    className="admin-lookbook-action"
                  >
                    <Pencil size={15} />
                    EDIT
                  </button>

                  <button
                    type="button"
                    className="admin-lookbook-action danger"
                    onClick={() =>
                      handleDelete(look.id)
                    }
                  >
                    <Trash2 size={15} />
                    DELETE
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default AdminLookbook;