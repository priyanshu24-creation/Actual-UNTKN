import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  Edit3,
  Check,
  X,
} from "lucide-react";
import api from "../services/api";

function Account() {
  /* =========================
     PERSONAL DETAILS
  ========================= */

  const [personalDetails, setPersonalDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  /* =========================
     ADDRESS
  ========================= */

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [addressId, setAddressId] = useState(null);

  /* =========================
     STATES
  ========================= */

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loadingUser, setLoadingUser] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  /* =========================
     HELPER: SPLIT NAME
  ========================= */

  const splitName = (fullName) => {
    const cleanName = (fullName || "").trim();

    if (!cleanName) {
      return {
        firstName: "",
        lastName: "",
      };
    }

    const nameParts = cleanName.split(/\s+/);

    if (nameParts.length === 1) {
      return {
        firstName: nameParts[0],
        lastName: "",
      };
    }

    return {
      firstName: nameParts.slice(0, -1).join(" "),
      lastName: nameParts[nameParts.length - 1],
    };
  };

  /* =========================
     LOAD USER + ADDRESS
  ========================= */

  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoadingUser(true);
        setError("");
        setMessage("");

        /* -------------------------
           GET LOGGED-IN USER
        ------------------------- */

        const response = await api.get("/auth/me");

        if (
          !response.data?.success ||
          !response.data?.user
        ) {
          throw new Error(
            "Unable to load account details."
          );
        }

        const user = response.data.user;

        /* -------------------------
           SPLIT FULL NAME
        ------------------------- */

        const { firstName, lastName } =
          splitName(user.name);

        /* -------------------------
           SET USER DATA
        ------------------------- */

        setPersonalDetails({
          firstName,
          lastName,
          email: user.email || "",
          phone: user.phone || "",
          dateOfBirth: "",
        });

        /* -------------------------
           GET USER ADDRESSES
        ------------------------- */

        const addressResponse =
          await api.get("/addresses");

        if (addressResponse.data?.success) {
          const addresses =
            addressResponse.data.addresses || [];

          if (addresses.length > 0) {
            const defaultAddress =
              addresses.find(
                (item) =>
                  Boolean(item.is_default)
              ) || addresses[0];

            setAddressId(
              Number(defaultAddress.id)
            );

            setAddress({
              fullName:
                defaultAddress.full_name ||
                user.name ||
                "",

              phone:
                defaultAddress.phone ||
                user.phone ||
                "",

              addressLine1:
                defaultAddress.address_line1 ||
                "",

              addressLine2:
                defaultAddress.address_line2 ||
                "",

              city:
                defaultAddress.city ||
                "",

              state:
                defaultAddress.state ||
                "",

              pincode:
                defaultAddress.postal_code ||
                "",

              country:
                defaultAddress.country ||
                "India",
            });
          } else {
            setAddressId(null);

            setAddress({
              fullName:
                user.name || "",

              phone:
                user.phone || "",

              addressLine1: "",
              addressLine2: "",
              city: "",
              state: "",
              pincode: "",
              country: "India",
            });
          }
        }
      } catch (requestError) {
        console.error(
          "Failed to load account:",
          requestError
        );

        if (
          requestError.response?.status === 401
        ) {
          window.location.href = "/login";
          return;
        }

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load account details."
        );
      } finally {
        setLoadingUser(false);
      }
    };

    loadAccount();
  }, []);

  /* =========================
     PERSONAL CHANGE
  ========================= */

  const handlePersonalChange = (event) => {
    const { name, value } = event.target;

    setPersonalDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================
     ADDRESS CHANGE
  ========================= */

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================
     SAVE PERSONAL DETAILS
  ========================= */

  const savePersonalDetails = async () => {
    try {
      setSavingPersonal(true);
      setMessage("");
      setError("");

      const firstName =
        personalDetails.firstName.trim();

      const lastName =
        personalDetails.lastName.trim();

      const fullName = [
        firstName,
        lastName,
      ]
        .filter(Boolean)
        .join(" ");

      if (fullName.length < 2) {
        setError(
          "Please enter your name."
        );
        return;
      }

      if (
        personalDetails.email.trim() === ""
      ) {
        setError(
          "Please enter your email address."
        );
        return;
      }

      const response = await api.patch(
        "/auth/profile",
        {
          name: fullName,
          email:
            personalDetails.email.trim(),
          phone:
            personalDetails.phone.trim(),
        }
      );

      if (
        !response.data?.success ||
        !response.data?.user
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to update personal details."
        );
      }

      const updatedUser =
        response.data.user;

      /* -------------------------
         SPLIT UPDATED NAME
      ------------------------- */

      const {
        firstName: updatedFirstName,
        lastName: updatedLastName,
      } = splitName(updatedUser.name);

      /* -------------------------
         UPDATE PERSONAL STATE
      ------------------------- */

      setPersonalDetails(
        (previous) => ({
          ...previous,

          firstName:
            updatedFirstName,

          lastName:
            updatedLastName,

          email:
            updatedUser.email || "",

          phone:
            updatedUser.phone || "",

          dateOfBirth:
            previous.dateOfBirth,
        })
      );

      /* -------------------------
         UPDATE ADDRESS CONTACT
         ONLY IF EMPTY
      ------------------------- */

      setAddress((previous) => ({
        ...previous,

        fullName:
          previous.fullName ||
          updatedUser.name ||
          "",

        phone:
          previous.phone ||
          updatedUser.phone ||
          "",
      }));

      setEditingPersonal(false);

      setMessage(
        "Personal details updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (requestError) {
      console.error(
        "Failed to update personal details:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to update personal details."
      );
    } finally {
      setSavingPersonal(false);
    }
  };

  /* =========================
     SAVE ADDRESS
  ========================= */

  const saveAddress = async () => {
    try {
      setSavingAddress(true);
      setMessage("");
      setError("");

      const cleanFullName =
        address.fullName.trim();

      const cleanPhone =
        address.phone.trim();

      const cleanAddressLine1 =
        address.addressLine1.trim();

      const cleanAddressLine2 =
        address.addressLine2.trim();

      const cleanCity =
        address.city.trim();

      const cleanState =
        address.state.trim();

      const cleanPincode =
        address.pincode.trim();

      const cleanCountry =
        address.country.trim() || "India";

      /* -------------------------
         VALIDATION
      ------------------------- */

      if (!cleanFullName) {
        setError(
          "Please enter your full name."
        );
        return;
      }

      if (!cleanPhone) {
        setError(
          "Please enter your phone number."
        );
        return;
      }

      if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
        setError(
          "Phone number must contain 10 to 15 digits."
        );
        return;
      }

      if (!cleanAddressLine1) {
        setError(
          "Please enter your address."
        );
        return;
      }

      if (!cleanCity) {
        setError(
          "Please enter your city."
        );
        return;
      }

      if (!cleanState) {
        setError(
          "Please enter your state."
        );
        return;
      }

      if (!/^[0-9]{6}$/.test(cleanPincode)) {
        setError(
          "PIN code must contain exactly 6 digits."
        );
        return;
      }

      /* -------------------------
         PREPARE API DATA
      ------------------------- */

      const addressData = {
        full_name: cleanFullName,
        phone: cleanPhone,
        address_line1: cleanAddressLine1,
        address_line2:
          cleanAddressLine2 || null,
        city: cleanCity,
        state: cleanState,
        postal_code: cleanPincode,
        country: cleanCountry,
        is_default: true,
      };

      let response;

      /* -------------------------
         UPDATE EXISTING ADDRESS
      ------------------------- */

      if (addressId) {
        response = await api.put(
          `/addresses/${addressId}`,
          addressData
        );
      }

      /* -------------------------
         CREATE NEW ADDRESS
      ------------------------- */

      else {
        response = await api.post(
          "/addresses",
          addressData
        );
      }

      if (
        !response.data?.success ||
        !response.data?.address
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to save address."
        );
      }

      const savedAddress =
        response.data.address;

      /* -------------------------
         STORE ADDRESS ID
      ------------------------- */

      setAddressId(
        Number(savedAddress.id)
      );

      /* -------------------------
         UPDATE ADDRESS STATE
      ------------------------- */

      setAddress({
        fullName:
          savedAddress.full_name || "",

        phone:
          savedAddress.phone || "",

        addressLine1:
          savedAddress.address_line1 || "",

        addressLine2:
          savedAddress.address_line2 || "",

        city:
          savedAddress.city || "",

        state:
          savedAddress.state || "",

        pincode:
          savedAddress.postal_code || "",

        country:
          savedAddress.country || "India",
      });

      setEditingAddress(false);

      setMessage(
        "Address updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (requestError) {
      console.error(
        "Failed to save address:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to save address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (logoutError) {
      console.error(
        "Logout error:",
        logoutError
      );
    } finally {
      window.location.href = "/login";
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loadingUser) {
    return (
      <div className="account-page">
        <section className="account-header">
          <div>
            <p className="account-eyebrow">
              MY ACCOUNT
            </p>

            <h1>
              PERSONAL DETAILS
            </h1>
          </div>

          <p className="account-header-description">
            Loading your account details...
          </p>
        </section>

        <section className="account-content">
          <main className="account-main">
            <section className="account-card">
              <div className="account-value">
                Loading account...
              </div>
            </section>
          </main>
        </section>
      </div>
    );
  }

  /* =========================
     MAIN UI
  ========================= */

  return (
    <div className="account-page">
      {/* =========================
          PAGE HEADER
      ========================= */}

      <section className="account-header">
        <div>
          <p className="account-eyebrow">
            MY ACCOUNT
          </p>

          <h1>
            PERSONAL DETAILS
          </h1>
        </div>

        <p className="account-header-description">
          Manage your personal information,
          delivery address and account details.
        </p>
      </section>

      {/* =========================
          SUCCESS MESSAGE
      ========================= */}

      {message && (
  <div className="account-toast account-toast-success">
    <div className="account-toast-icon">
      <Check size={18} strokeWidth={2} />
    </div>

    <div className="account-toast-content">
      <strong>SUCCESS</strong>
      <span>{message}</span>
    </div>

    <button
      type="button"
      className="account-toast-close"
      onClick={() => setMessage("")}
      aria-label="Close notification"
    >
      <X size={17} />
    </button>
  </div>
)}

{error && (
  <div className="account-toast account-toast-error">
    <div className="account-toast-icon">
      <X size={18} strokeWidth={2} />
    </div>

    <div className="account-toast-content">
      <strong>ERROR</strong>
      <span>{error}</span>
    </div>

    <button
      type="button"
      className="account-toast-close"
      onClick={() => setError("")}
      aria-label="Close notification"
    >
      <X size={17} />
    </button>
  </div>
)}

      {/* =========================
          ACCOUNT LAYOUT
      ========================= */}

      <section className="account-content">
        {/* =========================
            SIDEBAR
        ========================= */}

        <aside className="account-sidebar">
          <div className="account-user">
            <div className="account-user-icon">
              <User
                size={24}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <strong>
                {personalDetails.firstName}{" "}
                {personalDetails.lastName}
              </strong>

              <span>
                {personalDetails.email}
              </span>
            </div>
          </div>

          <nav className="account-navigation">
            <Link
              to="/account"
              className="account-nav-item active"
            >
              <User size={17} />
              Personal Details
            </Link>

            <Link
              to="/orders"
              className="account-nav-item"
            >
              <Package size={17} />
              My Orders
            </Link>

            <Link
              to="/wishlist"
              className="account-nav-item"
            >
              <Heart size={17} />
              Wishlist
            </Link>
          </nav>

          <button
            type="button"
            className="account-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            LOG OUT
          </button>
        </aside>

        {/* =========================
            MAIN CONTENT
        ========================= */}

        <main className="account-main">
          {/* =========================
              PERSONAL DETAILS CARD
          ========================= */}

          <section className="account-card">
            <div className="account-card-header">
              <div>
                <p className="account-card-number">
                  01 / PROFILE
                </p>

                <h2>
                  Personal Details
                </h2>

                <p>
                  Update your basic account
                  information.
                </p>
              </div>

              {!editingPersonal && (
                <button
                  type="button"
                  className="account-edit-button"
                  onClick={() => {
                    setEditingPersonal(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  <Edit3 size={15} />
                  EDIT
                </button>
              )}
            </div>

            <div className="account-form">
              {/* FIRST NAME */}

              <div className="account-field">
                <label htmlFor="firstName">
                  FIRST NAME
                </label>

                {editingPersonal ? (
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={
                      personalDetails.firstName
                    }
                    onChange={
                      handlePersonalChange
                    }
                    placeholder="First name"
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.firstName ||
                      "—"}
                  </div>
                )}
              </div>

              {/* LAST NAME */}

              <div className="account-field">
                <label htmlFor="lastName">
                  LAST NAME
                </label>

                {editingPersonal ? (
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={
                      personalDetails.lastName
                    }
                    onChange={
                      handlePersonalChange
                    }
                    placeholder="Last name"
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.lastName ||
                      "—"}
                  </div>
                )}
              </div>

              {/* EMAIL */}

              <div className="account-field">
                <label htmlFor="email">
                  EMAIL ADDRESS
                </label>

                {editingPersonal ? (
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={
                      personalDetails.email
                    }
                    onChange={
                      handlePersonalChange
                    }
                    placeholder="Email address"
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.email ||
                      "—"}
                  </div>
                )}
              </div>

              {/* PHONE */}

              <div className="account-field">
                <label htmlFor="phone">
                  PHONE NUMBER
                </label>

                {editingPersonal ? (
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={
                      personalDetails.phone
                    }
                    onChange={
                      handlePersonalChange
                    }
                    placeholder="+91"
                    maxLength={15}
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.phone ||
                      "—"}
                  </div>
                )}
              </div>

              {/* DATE OF BIRTH */}

              <div className="account-field full-width">
                <label htmlFor="dateOfBirth">
                  DATE OF BIRTH
                </label>

                {editingPersonal ? (
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={
                      personalDetails.dateOfBirth
                    }
                    onChange={
                      handlePersonalChange
                    }
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.dateOfBirth ||
                      "Not added"}
                  </div>
                )}
              </div>
            </div>

            {/* PERSONAL ACTIONS */}

            {editingPersonal && (
              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-cancel-button"
                  disabled={savingPersonal}
                  onClick={() => {
                    setEditingPersonal(false);
                    setMessage("");
                    setError("");
                  }}
                >
                  <X size={15} />
                  CANCEL
                </button>

                <button
                  type="button"
                  className="account-save-button"
                  onClick={
                    savePersonalDetails
                  }
                  disabled={savingPersonal}
                >
                  <Check size={15} />

                  {savingPersonal
                    ? "SAVING..."
                    : "SAVE CHANGES"}
                </button>
              </div>
            )}
          </section>

          {/* =========================
              ADDRESS CARD
          ========================= */}

          <section className="account-card">
            <div className="account-card-header">
              <div>
                <p className="account-card-number">
                  02 / DELIVERY
                </p>

                <h2>
                  Delivery Address
                </h2>

                <p>
                  Add or update the address used
                  for your orders.
                </p>
              </div>

              {!editingAddress && (
                <button
                  type="button"
                  className="account-edit-button"
                  onClick={() => {
                    setEditingAddress(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  <Edit3 size={15} />
                  EDIT
                </button>
              )}
            </div>

            <div className="account-form">
              {/* FULL NAME */}

              <div className="account-field">
                <label htmlFor="fullName">
                  FULL NAME
                </label>

                {editingAddress ? (
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={
                      address.fullName
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Full name"
                  />
                ) : (
                  <div className="account-value">
                    {address.fullName ||
                      "—"}
                  </div>
                )}
              </div>

              {/* PHONE */}

              <div className="account-field">
                <label htmlFor="addressPhone">
                  PHONE NUMBER
                </label>

                {editingAddress ? (
                  <input
                    id="addressPhone"
                    type="tel"
                    name="phone"
                    value={
                      address.phone
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="+91"
                    maxLength={15}
                  />
                ) : (
                  <div className="account-value">
                    {address.phone ||
                      "—"}
                  </div>
                )}
              </div>

              {/* ADDRESS LINE 1 */}

              <div className="account-field full-width">
                <label htmlFor="addressLine1">
                  ADDRESS LINE 1
                </label>

                {editingAddress ? (
                  <input
                    id="addressLine1"
                    type="text"
                    name="addressLine1"
                    value={
                      address.addressLine1
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="House / Flat / Building / Street"
                  />
                ) : (
                  <div className="account-value">
                    {address.addressLine1 ||
                      "Not added"}
                  </div>
                )}
              </div>

              {/* ADDRESS LINE 2 */}

              <div className="account-field full-width">
                <label htmlFor="addressLine2">
                  ADDRESS LINE 2
                </label>

                {editingAddress ? (
                  <input
                    id="addressLine2"
                    type="text"
                    name="addressLine2"
                    value={
                      address.addressLine2
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Apartment, landmark, area"
                  />
                ) : (
                  <div className="account-value">
                    {address.addressLine2 ||
                      "Not added"}
                  </div>
                )}
              </div>

              {/* CITY */}

              <div className="account-field">
                <label htmlFor="city">
                  CITY
                </label>

                {editingAddress ? (
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={
                      handleAddressChange
                    }
                    placeholder="City"
                  />
                ) : (
                  <div className="account-value">
                    {address.city ||
                      "Not added"}
                  </div>
                )}
              </div>

              {/* STATE */}

              <div className="account-field">
                <label htmlFor="state">
                  STATE
                </label>

                {editingAddress ? (
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={
                      handleAddressChange
                    }
                    placeholder="State"
                  />
                ) : (
                  <div className="account-value">
                    {address.state ||
                      "Not added"}
                  </div>
                )}
              </div>

              {/* PINCODE */}

              <div className="account-field">
                <label htmlFor="pincode">
                  PIN CODE
                </label>

                {editingAddress ? (
                  <input
                    id="pincode"
                    type="text"
                    name="pincode"
                    value={
                      address.pincode
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="PIN Code"
                    maxLength={6}
                    inputMode="numeric"
                  />
                ) : (
                  <div className="account-value">
                    {address.pincode ||
                      "Not added"}
                  </div>
                )}
              </div>

              {/* COUNTRY */}

              <div className="account-field">
                <label htmlFor="country">
                  COUNTRY
                </label>

                {editingAddress ? (
                  <select
                    id="country"
                    name="country"
                    value={
                      address.country
                    }
                    onChange={
                      handleAddressChange
                    }
                  >
                    <option value="India">
                      India
                    </option>

                    <option value="United States">
                      United States
                    </option>

                    <option value="United Kingdom">
                      United Kingdom
                    </option>

                    <option value="Canada">
                      Canada
                    </option>

                    <option value="Australia">
                      Australia
                    </option>
                  </select>
                ) : (
                  <div className="account-value">
                    {address.country ||
                      "India"}
                  </div>
                )}
              </div>
            </div>

            {/* ADDRESS ACTIONS */}

            {editingAddress && (
              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-cancel-button"
                  disabled={savingAddress}
                  onClick={() => {
                    setEditingAddress(false);
                    setMessage("");
                    setError("");
                  }}
                >
                  <X size={15} />
                  CANCEL
                </button>

                <button
                  type="button"
                  className="account-save-button"
                  onClick={saveAddress}
                  disabled={savingAddress}
                >
                  <Check size={15} />

                  {savingAddress
                    ? "SAVING..."
                    : addressId
                    ? "SAVE ADDRESS"
                    : "ADD ADDRESS"}
                </button>
              </div>
            )}
          </section>

          {/* =========================
              ADDRESS PREVIEW
          ========================= */}

          <section className="address-preview">
            <div className="address-preview-icon">
              <MapPin
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="address-preview-label">
                DEFAULT DELIVERY ADDRESS
              </p>

              <h3>
                {address.fullName}
              </h3>

              {address.addressLine1 ||
              address.city ||
              address.state ||
              address.pincode ? (
                <p className="address-preview-text">
                  {address.addressLine1}

                  {address.addressLine2 &&
                    `, ${address.addressLine2}`}

                  <br />

                  {address.city &&
                    `${address.city}, `}

                  {address.state &&
                    `${address.state} `}

                  {address.pincode &&
                    `- ${address.pincode}`}

                  <br />

                  {address.country}
                </p>
              ) : (
                <p className="address-preview-text">
                  No delivery address added yet.
                </p>
              )}

              {address.phone && (
                <p className="address-preview-phone">
                  {address.phone}
                </p>
              )}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}

export default Account;