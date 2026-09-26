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
  const emptyAddress = {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  };

  const [personalDetails, setPersonalDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  const [address, setAddress] = useState(emptyAddress);
  const [savedAddress, setSavedAddress] = useState(emptyAddress);
  const [addressId, setAddressId] = useState(null);

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loadingUser, setLoadingUser] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

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

  const normalizeAddress = (item) => {
    return {
      fullName: item?.full_name || "",
      phone: item?.phone || "",
      addressLine1: item?.address_line1 || "",
      addressLine2: item?.address_line2 || "",
      city: item?.city || "",
      state: item?.state || "",
      pincode: item?.postal_code || "",
      country: item?.country || "India",
    };
  };

  const showMessage = (text) => {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const showError = (text) => {
    setError(text);
    setMessage("");

    window.setTimeout(() => {
      setError("");
    }, 5000);
  };

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      try {
        setLoadingUser(true);
        setError("");
        setMessage("");

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

        /*
         * IMPORTANT:
         *
         * Only an authenticated ADMIN should be
         * redirected to the admin panel.
         *
         * Do NOT use:
         *
         * user.role !== "customer"
         *
         * because that would redirect normal users
         * if the API does not return the role exactly
         * as "customer".
         */

        const userRole = String(
          user?.role || ""
        )
          .trim()
          .toLowerCase();

        if (userRole === "admin") {
          window.location.replace("/admin");
          return;
        }

        const {
          firstName,
          lastName,
        } = splitName(user.name);

        if (cancelled) {
          return;
        }

        /*
         * If the user has no information saved,
         * these values remain empty.
         *
         * The user can then fill them using EDIT.
         */
        setPersonalDetails({
          firstName,
          lastName,
          email: user.email || "",
          phone: user.phone || "",
          dateOfBirth: "",
        });

        const fallbackAddress = {
          ...emptyAddress,
          fullName: user.name || "",
          phone: user.phone || "",
        };

        setAddress(fallbackAddress);
        setSavedAddress(fallbackAddress);

        /*
         * Load the user's own saved address.
         *
         * The backend should use the authenticated
         * user's ID when handling /addresses.
         */
        try {
          const addressResponse =
            await api.get("/addresses");

          if (
            cancelled ||
            !addressResponse.data?.success
          ) {
            return;
          }

          const addresses =
            addressResponse.data.addresses || [];

          if (addresses.length > 0) {
            const defaultAddress =
              addresses.find(
                (item) =>
                  Boolean(item.is_default)
              ) || addresses[0];

            const normalizedAddress =
              normalizeAddress(defaultAddress);

            setAddressId(
              Number(defaultAddress.id)
            );

            setAddress(normalizedAddress);
            setSavedAddress(
              normalizedAddress
            );
          } else {
            setAddressId(null);
            setAddress(fallbackAddress);
            setSavedAddress(
              fallbackAddress
            );
          }
        } catch (addressError) {
          console.warn(
            "Delivery address service unavailable:",
            addressError
          );

          if (!cancelled) {
            setAddressId(null);
            setAddress(fallbackAddress);
            setSavedAddress(
              fallbackAddress
            );
          }
        }
      } catch (requestError) {
        console.error(
          "Failed to load account:",
          requestError
        );

        if (
          requestError.response?.status ===
          401
        ) {
          window.location.href = "/login";
          return;
        }

        showError(
          requestError.response?.data?.message ||
            "We couldn't load your account details. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePersonalChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setPersonalDetails((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleAddressChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const startAddressEdit = () => {
    setEditingAddress(true);
    setError("");
    setMessage("");

    if (!addressId) {
      setAddress((previous) => ({
        ...previous,
        fullName:
          previous.fullName ||
          `${personalDetails.firstName} ${personalDetails.lastName}`.trim(),
        phone:
          previous.phone ||
          personalDetails.phone ||
          "",
      }));
    }
  };

  const cancelAddressEdit = () => {
    setEditingAddress(false);
    setError("");
    setMessage("");
    setAddress(savedAddress);
  };

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
        showError(
          "Please enter your name."
        );
        return;
      }

      if (
        !personalDetails.email.trim()
      ) {
        showError(
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

      const {
        firstName: updatedFirstName,
        lastName: updatedLastName,
      } = splitName(updatedUser.name);

      setPersonalDetails((previous) => ({
        ...previous,
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email:
          updatedUser.email || "",
        phone:
          updatedUser.phone || "",
      }));

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

      showMessage(
        "Personal details updated successfully."
      );
    } catch (requestError) {
      console.error(
        "Failed to update personal details:",
        requestError
      );

      showError(
        requestError.response?.data?.message ||
          "We couldn't update your personal details. Please try again."
      );
    } finally {
      setSavingPersonal(false);
    }
  };

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
        address.country.trim() ||
        "India";

      if (!cleanFullName) {
        showError(
          "Please enter your full name."
        );
        return;
      }

      if (!cleanPhone) {
        showError(
          "Please enter your phone number."
        );
        return;
      }

      if (
        !/^[0-9]{10,15}$/.test(
          cleanPhone
        )
      ) {
        showError(
          "Phone number must contain 10 to 15 digits."
        );
        return;
      }

      if (!cleanAddressLine1) {
        showError(
          "Please enter your address."
        );
        return;
      }

      if (!cleanCity) {
        showError(
          "Please enter your city."
        );
        return;
      }

      if (!cleanState) {
        showError(
          "Please enter your state."
        );
        return;
      }

      if (
        !/^[0-9]{6}$/.test(
          cleanPincode
        )
      ) {
        showError(
          "PIN code must contain exactly 6 digits."
        );
        return;
      }

      const addressData = {
        full_name: cleanFullName,
        phone: cleanPhone,
        address_line1:
          cleanAddressLine1,
        address_line2:
          cleanAddressLine2 || null,
        city: cleanCity,
        state: cleanState,
        postal_code:
          cleanPincode,
        country:
          cleanCountry,
        is_default: true,
      };

      const isUpdating =
        Boolean(addressId);

      let response;

      if (isUpdating) {
        response = await api.put(
          `/addresses/${addressId}`,
          addressData
        );
      } else {
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

      const savedAddressFromApi =
        response.data.address;

      const normalizedAddress =
        normalizeAddress(
          savedAddressFromApi
        );

      setAddressId(
        Number(
          savedAddressFromApi.id
        )
      );

      setAddress(
        normalizedAddress
      );

      setSavedAddress(
        normalizedAddress
      );

      setEditingAddress(false);

      showMessage(
        isUpdating
          ? "Address updated successfully."
          : "Address added successfully."
      );
    } catch (requestError) {
      console.error(
        "Failed to save address:",
        requestError
      );

      showError(
        requestError.response?.data?.message ||
          "We couldn't save your delivery address. Please try again."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (logoutError) {
      console.error(
        "Logout error:",
        logoutError
      );
    } finally {
      window.location.href =
        "/login";
    }
  };

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
            Loading your account
            details...
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
          Manage your personal
          information, delivery address
          and account details.
        </p>
      </section>

      {message && (
        <div
          className="account-toast account-toast-success"
          role="status"
          aria-live="polite"
        >
          <div className="account-toast-icon">
            <Check
              size={18}
              strokeWidth={2}
            />
          </div>

          <div className="account-toast-content">
            <strong>
              ALL SET
            </strong>

            <span>
              {message}
            </span>
          </div>

          <button
            type="button"
            className="account-toast-close"
            onClick={() =>
              setMessage("")
            }
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div
          className="account-toast account-toast-error"
          role="alert"
          aria-live="assertive"
        >
          <div className="account-toast-icon">
            <X
              size={18}
              strokeWidth={2}
            />
          </div>

          <div className="account-toast-content">
            <strong>
              SOMETHING WENT WRONG
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            className="account-toast-close"
            onClick={() =>
              setError("")
            }
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="account-content">
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

        <main className="account-main">
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
                    setEditingPersonal(
                      true
                    );
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
                    disabled={
                      savingPersonal
                    }
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.firstName ||
                      "—"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingPersonal
                    }
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.lastName ||
                      "—"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingPersonal
                    }
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.email ||
                      "—"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingPersonal
                    }
                  />
                ) : (
                  <div className="account-value">
                    {personalDetails.phone ||
                      "—"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingPersonal
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

            {editingPersonal && (
              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-cancel-button"
                  disabled={
                    savingPersonal
                  }
                  onClick={() => {
                    setEditingPersonal(
                      false
                    );
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
                  disabled={
                    savingPersonal
                  }
                >
                  <Check size={15} />

                  {savingPersonal
                    ? "SAVING..."
                    : "SAVE CHANGES"}
                </button>
              </div>
            )}
          </section>

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
                  Add or update the address
                  used for your orders.
                </p>
              </div>

              {!editingAddress && (
                <button
                  type="button"
                  className="account-edit-button"
                  onClick={
                    startAddressEdit
                  }
                >
                  <Edit3 size={15} />

                  {addressId
                    ? "EDIT"
                    : "ADD ADDRESS"}
                </button>
              )}
            </div>

            <div className="account-form">
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
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.fullName ||
                      "—"}
                  </div>
                )}
              </div>

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
                    placeholder="10 digit phone number"
                    maxLength={15}
                    inputMode="numeric"
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.phone ||
                      "—"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.addressLine1 ||
                      "Not added"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.addressLine2 ||
                      "Not added"}
                  </div>
                )}
              </div>

              <div className="account-field">
                <label htmlFor="city">
                  CITY
                </label>

                {editingAddress ? (
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={
                      address.city
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="City"
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.city ||
                      "Not added"}
                  </div>
                )}
              </div>

              <div className="account-field">
                <label htmlFor="state">
                  STATE
                </label>

                {editingAddress ? (
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={
                      address.state
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="State"
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.state ||
                      "Not added"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingAddress
                    }
                  />
                ) : (
                  <div className="account-value">
                    {address.pincode ||
                      "Not added"}
                  </div>
                )}
              </div>

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
                    disabled={
                      savingAddress
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

            {editingAddress && (
              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-cancel-button"
                  disabled={
                    savingAddress
                  }
                  onClick={
                    cancelAddressEdit
                  }
                >
                  <X size={15} />
                  CANCEL
                </button>

                <button
                  type="button"
                  className="account-save-button"
                  onClick={
                    saveAddress
                  }
                  disabled={
                    savingAddress
                  }
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
                {address.fullName ||
                  "No address added"}
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
                  No delivery address
                  added yet.
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