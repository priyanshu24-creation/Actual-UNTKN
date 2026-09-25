import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Home,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    subtotal,
    loading: cartLoading,
    refreshCart,
  } = useCart();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [authChecking, setAuthChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const itemCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item?.quantity || 0),
      0
    );
  }, [cartItems]);

  const safeSubtotal = Number(subtotal || 0);

  const shippingFee = 0;

  const total = Math.max(
    0,
    safeSubtotal + shippingFee
  );

  useEffect(() => {
    let mounted = true;

    const verifyAuthentication = async () => {
      try {
        await api.get("/auth/me");

        if (mounted) {
          setAuthChecking(false);
        }
      } catch (authError) {
        if (!mounted) {
          return;
        }

        if (authError?.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              redirectTo: "/checkout",
            },
          });

          return;
        }

        console.error(
          "Checkout authentication check failed:",
          authError
        );

        setError(
          authError?.response?.data?.message ||
            "Unable to verify your account. Please try again."
        );

        setAuthChecking(false);
      }
    };

    verifyAuthentication();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (authChecking || cartLoading) {
      return;
    }

    if (
      Array.isArray(cartItems) &&
      cartItems.length === 0
    ) {
      return;
    }

    const savedCheckout = sessionStorage.getItem(
      "untkn_checkout"
    );

    if (!savedCheckout) {
      return;
    }

    try {
      const parsed = JSON.parse(savedCheckout);

      const customer = parsed?.customer || {};
      const shipping = parsed?.shipping || {};

      setFormData((current) => ({
        ...current,
        firstName:
          current.firstName ||
          customer.firstName ||
          "",
        lastName:
          current.lastName ||
          customer.lastName ||
          "",
        email:
          current.email ||
          customer.email ||
          "",
        phone:
          current.phone ||
          customer.phone ||
          "",
        address:
          current.address ||
          shipping.address ||
          "",
        apartment:
          current.apartment ||
          shipping.apartment ||
          "",
        city:
          current.city ||
          shipping.city ||
          "",
        state:
          current.state ||
          shipping.state ||
          "",
        pincode:
          current.pincode ||
          shipping.pincode ||
          "",
      }));
    } catch (storageError) {
      console.error(
        "Failed to restore checkout data:",
        storageError
      );
    }
  }, [
    authChecking,
    cartLoading,
    cartItems,
  ]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    let nextValue = value;

    if (
      name === "phone" ||
      name === "pincode"
    ) {
      nextValue = value
        .replace(/\D/g, "")
        .slice(
          0,
          name === "phone" ? 10 : 6
        );
    }

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const firstName =
      formData.firstName.trim();

    const lastName =
      formData.lastName.trim();

    const email =
      formData.email.trim();

    const phone =
      formData.phone.trim();

    const address =
      formData.address.trim();

    const apartment =
      formData.apartment.trim();

    const city =
      formData.city.trim();

    const state =
      formData.state.trim();

    const pincode =
      formData.pincode.trim();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      setError(
        "Please complete all required fields before continuing."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError(
        "Please enter a valid 6-digit pincode."
      );
      return;
    }

    if (
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      setError("Your bag is empty.");
      return;
    }

    try {
      setSubmitting(true);

      await api.get("/auth/me");

      const shippingName =
        `${firstName} ${lastName}`.trim();

      const orderPayload = {
        shipping_name: shippingName,
        shipping_phone: phone,
        shipping_email: email,
        shipping_address_line1: address,
        shipping_address_line2:
          apartment || null,
        shipping_city: city,
        shipping_state: state,
        shipping_postal_code: pincode,
        shipping_country: "India",
        notes: null,
        shipping_fee: 0,
      };

      const response = await api.post(
        "/orders",
        orderPayload
      );

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message ||
            "Failed to create your order."
        );
      }

      const createdOrder =
        response?.data?.order;

      if (!createdOrder?.id) {
        throw new Error(
          "Order was created but no order ID was returned."
        );
      }

      const checkoutData = {
        customer: {
          firstName,
          lastName,
          email,
          phone,
        },

        shipping: {
          address,
          apartment,
          city,
          state,
          pincode,
          country: "India",
        },

        shippingFee: 0,

        subtotal: safeSubtotal,

        frontendTotal: total,

        order: createdOrder,
      };

      sessionStorage.setItem(
        "untkn_checkout",
        JSON.stringify(checkoutData)
      );

      try {
        await refreshCart();
      } catch (cartRefreshError) {
        console.error(
          "Cart refresh after order failed:",
          cartRefreshError
        );
      }

      navigate("/payment", {
        state: {
          order: createdOrder,
          checkout: checkoutData,
        },
      });
    } catch (requestError) {
      console.error(
        "Checkout error:",
        requestError
      );

      if (
        requestError?.response?.status ===
        401
      ) {
        navigate("/login", {
          replace: true,
          state: {
            redirectTo: "/checkout",
          },
        });

        return;
      }

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to create your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <>
        <style>{checkoutStyles}</style>

        <div className="cz-checkout-state">
          <div className="cz-state-card">
            <div className="cz-state-icon">
              <LockKeyhole size={22} />
            </div>

            <span>SECURE CHECKOUT</span>

            <h1>
              VERIFYING
              <br />
              YOUR ACCOUNT
            </h1>

            <div className="cz-loader-line" />
          </div>
        </div>
      </>
    );
  }

  if (cartLoading) {
    return (
      <>
        <style>{checkoutStyles}</style>

        <div className="cz-checkout-state">
          <div className="cz-state-card">
            <div className="cz-state-icon">
              <ShoppingBag size={22} />
            </div>

            <span>YOUR BAG</span>

            <h1>
              LOADING
              <br />
              CHECKOUT
            </h1>

            <div className="cz-loader-line" />
          </div>
        </div>
      </>
    );
  }

  if (
    !cartLoading &&
    (!Array.isArray(cartItems) ||
      cartItems.length === 0)
  ) {
    return (
      <>
        <style>{checkoutStyles}</style>

        <div className="cz-checkout-state">
          <div className="cz-empty-card">
            <div className="cz-empty-icon">
              <ShoppingBag size={28} />
            </div>

            <span>YOUR BAG IS EMPTY</span>

            <h1>
              NOTHING
              <br />
              TO CHECK OUT.
            </h1>

            <p>
              Add something you love to your bag
              before continuing.
            </p>

            <Link
              to="/shop"
              className="cz-primary-button"
            >
              SHOP PRODUCTS
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{checkoutStyles}</style>

      <div className="cz-checkout-page">

        <div className="cz-checkout-shell">

          <header className="cz-checkout-header">

            <Link
              to="/cart"
              className="cz-back-link"
            >
              <ArrowLeft size={16} />
              BACK TO BAG
            </Link>

            <div className="cz-header-main">

              <div className="cz-header-tag">
                <span className="cz-header-dot" />
                SECURE CHECKOUT
              </div>

              <h1>
                CHECK
                <em>OUT.</em>
              </h1>

              <p>
                Almost yours. Complete your
                details and you're good to go.
              </p>

            </div>

            <div className="cz-header-meta">
              <ShieldCheck size={17} />
              <span>ENCRYPTED</span>
            </div>

          </header>

          {error && (
            <div className="cz-error">
              <div className="cz-error-mark">
                !
              </div>

              <div>
                <strong>
                  CHECKOUT ISSUE
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}

          <form
            className="cz-checkout-grid"
            onSubmit={handleSubmit}
          >

            <main className="cz-main">

              <section className="cz-section">

                <div className="cz-section-head">

                  <div className="cz-section-number">
                    01
                  </div>

                  <div>
                    <span>
                      CONTACT
                    </span>

                    <h2>
                      YOUR DETAILS
                    </h2>
                  </div>

                  <User
                    className="cz-section-icon"
                    size={21}
                  />

                </div>

                <div className="cz-fields">

                  <div className="cz-field">
                    <label htmlFor="firstName">
                      FIRST NAME
                    </label>

                    <div className="cz-input-wrap">
                      <User size={16} />

                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={
                          formData.firstName
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Priyanshu"
                        autoComplete="given-name"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="cz-field">
                    <label htmlFor="lastName">
                      LAST NAME
                    </label>

                    <div className="cz-input-wrap">
                      <User size={16} />

                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={
                          formData.lastName
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Chatterjee"
                        autoComplete="family-name"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="cz-field cz-full">
                    <label htmlFor="email">
                      EMAIL ADDRESS
                    </label>

                    <div className="cz-input-wrap">
                      <Mail size={16} />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="cz-field cz-full">
                    <label htmlFor="phone">
                      PHONE NUMBER
                    </label>

                    <div className="cz-input-wrap">
                      <Phone size={16} />

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="9876543210"
                        autoComplete="tel"
                        inputMode="numeric"
                        maxLength={10}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                </div>

              </section>

              <section className="cz-section">

                <div className="cz-section-head">

                  <div className="cz-section-number">
                    02
                  </div>

                  <div>
                    <span>
                      DELIVERY
                    </span>

                    <h2>
                      SHIPPING ADDRESS
                    </h2>
                  </div>

                  <MapPin
                    className="cz-section-icon"
                    size={21}
                  />

                </div>

                <div className="cz-fields">

                  <div className="cz-field cz-full">
                    <label htmlFor="address">
                      ADDRESS
                    </label>

                    <div className="cz-input-wrap">
                      <Home size={16} />

                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={
                          formData.address
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="House / street / area"
                        autoComplete="street-address"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="cz-field cz-full">
                    <label htmlFor="apartment">
                      APARTMENT / LANDMARK
                      <small>
                        OPTIONAL
                      </small>
                    </label>

                    <div className="cz-input-wrap">
                      <MapPin size={16} />

                      <input
                        id="apartment"
                        name="apartment"
                        type="text"
                        value={
                          formData.apartment
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Apartment / landmark"
                        autoComplete="address-line2"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="cz-field">
                    <label htmlFor="city">
                      CITY
                    </label>

                    <div className="cz-input-wrap">
                      <MapPin size={16} />

                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={
                          formData.city
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Kolkata"
                        autoComplete="address-level2"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="cz-field">
                    <label htmlFor="state">
                      STATE
                    </label>

                    <div className="cz-input-wrap">
                      <MapPin size={16} />

                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={
                          formData.state
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="West Bengal"
                        autoComplete="address-level1"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="cz-field">
                    <label htmlFor="pincode">
                      PINCODE
                    </label>

                    <div className="cz-input-wrap">
                      <MapPin size={16} />

                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        value={
                          formData.pincode
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="700001"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                </div>

              </section>

              <div className="cz-no-delivery-box">
                <div className="cz-no-delivery-icon">
                  <Package size={19} />
                </div>

                <div>
                  <strong>
                    SHIPPING INCLUDED
                  </strong>

                  <p>
                    Your order is processed with
                    no additional delivery-method
                    selection or delivery charge.
                  </p>
                </div>

                <Check size={18} />
              </div>

              <div className="cz-security-strip">

                <div className="cz-security-item">
                  <div>
                    <LockKeyhole size={16} />
                  </div>

                  <span>
                    SECURE DATA
                  </span>
                </div>

                <div className="cz-security-line" />

                <div className="cz-security-item">
                  <div>
                    <ShieldCheck size={16} />
                  </div>

                  <span>
                    SAFE CHECKOUT
                  </span>
                </div>

                <div className="cz-security-line" />

                <div className="cz-security-item">
                  <div>
                    <Check size={16} />
                  </div>

                  <span>
                    ORDER CONFIRMATION
                  </span>
                </div>

              </div>

            </main>

            <aside className="cz-summary">

              <div className="cz-summary-top">

                <div>
                  <span>
                    ORDER SUMMARY
                  </span>

                  <h2>
                    YOUR BAG
                  </h2>
                </div>

                <div className="cz-item-count">
                  {itemCount}
                  <small>
                    ITEMS
                  </small>
                </div>

              </div>

              <div className="cz-summary-divider" />

              <div className="cz-summary-items">

                {cartItems.map((item) => {
                  const unitPrice = Number(
                    item?.unit_price ??
                      item?.price ??
                      0
                  );

                  const quantity = Number(
                    item?.quantity || 0
                  );

                  const itemTotal =
                    unitPrice * quantity;

                  const imageUrl =
                    item?.image_url ||
                    item?.image ||
                    "";

                  const title =
                    item?.product_name ||
                    item?.name ||
                    "UNTKN PRODUCT";

                  return (
                    <div
                      className="cz-product"
                      key={`${item?.cartItemId ?? item?.id ?? "item"}-${item?.product_id ?? ""}-${item?.variant_id ?? ""}`}
                    >

                      <div className="cz-product-image">

                        {imageUrl &&
                        !imageUrl.includes(
                          "example.com"
                        ) ? (
                          <img
                            src={imageUrl}
                            alt={title}
                          />
                        ) : (
                          <div className="cz-product-fallback">
                            <ShoppingBag size={18} />
                          </div>
                        )}

                        <span>
                          {quantity}
                        </span>

                      </div>

                      <div className="cz-product-info">

                        <h3>
                          {title}
                        </h3>

                        {item?.color && (
                          <span>
                            {item.color}
                          </span>
                        )}

                        {item?.size && (
                          <small>
                            SIZE {item.size}
                          </small>
                        )}

                      </div>

                      <strong>
                        {formatINR(itemTotal)}
                      </strong>

                    </div>
                  );
                })}

              </div>

              <div className="cz-summary-divider" />

              <div className="cz-price-list">

                <div>
                  <span>
                    SUBTOTAL
                  </span>

                  <strong>
                    {formatINR(
                      safeSubtotal
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    SHIPPING
                  </span>

                  <strong className="cz-free">
                    FREE
                  </strong>
                </div>

              </div>

              <div className="cz-total-box">

                <div>
                  <span>
                    TOTAL
                  </span>

                  <small>
                    INR
                  </small>
                </div>

                <strong>
                  {formatINR(total)}
                </strong>

              </div>

              <button
                type="submit"
                className="cz-submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "CREATING ORDER..."
                    : "CONTINUE TO PAYMENT"}
                </span>

                {submitting ? (
                  <span className="cz-button-loader" />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>

              <Link
                to="/cart"
                className="cz-edit-bag"
              >
                <ArrowLeft size={14} />
                EDIT BAG
              </Link>

              <div className="cz-trust">

                <div>
                  <LockKeyhole size={15} />
                </div>

                <p>
                  YOUR INFORMATION IS
                  <strong>
                    {" "}
                    PROTECTED
                  </strong>
                  {" "}AND SECURELY PROCESSED.
                </p>

              </div>

            </aside>

          </form>

          <footer className="cz-footer">

            <span>
              UNTKN / CHECKOUT
            </span>

            <div>
              <span>SECURE</span>
              <ChevronRight size={12} />
              <span>PRIVATE</span>
              <ChevronRight size={12} />
              <span>SIMPLE</span>
            </div>

          </footer>

        </div>

      </div>
    </>
  );
}

const checkoutStyles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

.cz-checkout-page,
.cz-checkout-state {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(0,0,0,.045),
      transparent 28%
    ),
    radial-gradient(
      circle at 100% 100%,
      rgba(0,0,0,.035),
      transparent 30%
    ),
    #f7f7f5;
  color: #111;
  font-family: "DM Sans", sans-serif;
}

.cz-checkout-shell {
  width: min(1420px, calc(100% - 48px));
  margin: 0 auto;
  padding: 34px 0 30px;
}

.cz-checkout-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 28px;
  padding: 16px 0 42px;
  border-bottom: 1px solid rgba(17,17,17,.14);
}

.cz-back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: #111;
  text-decoration: none;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .16em;
  transition: transform .2s ease;
}

.cz-back-link:hover {
  transform: translateX(-3px);
}

.cz-header-main {
  text-align: center;
}

.cz-header-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .2em;
  margin-bottom: 10px;
  opacity: .68;
}

.cz-header-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #111;
}

.cz-header-main h1 {
  margin: 0;
  font-family: "Manrope", sans-serif;
  font-size: clamp(48px, 7vw, 92px);
  line-height: .88;
  letter-spacing: -.075em;
  font-weight: 800;
}

.cz-header-main h1 em {
  font-style: normal;
  -webkit-text-stroke: 1.5px #111;
  color: transparent;
  margin-left: 4px;
}

.cz-header-main p {
  margin: 16px auto 0;
  max-width: 500px;
  font-size: 13px;
  line-height: 1.65;
  opacity: .62;
}

.cz-header-meta {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: .16em;
  font-weight: 700;
  opacity: .6;
}

.cz-checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, .72fr);
  gap: 24px;
  margin-top: 28px;
}

.cz-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cz-section {
  background: rgba(255,255,255,.8);
  border: 1px solid rgba(17,17,17,.1);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 16px 45px rgba(17,17,17,.035);
  backdrop-filter: blur(10px);
}

.cz-section-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding-bottom: 23px;
  border-bottom: 1px solid rgba(17,17,17,.09);
  margin-bottom: 24px;
}

.cz-section-number {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: #111;
  color: white;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .05em;
}

.cz-section-head span {
  display: block;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .19em;
  opacity: .5;
  margin-bottom: 4px;
}

.cz-section-head h2 {
  margin: 0;
  font-family: "Manrope", sans-serif;
  font-size: 21px;
  letter-spacing: -.04em;
}

.cz-section-icon {
  opacity: .45;
}

.cz-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 17px;
}

.cz-field {
  min-width: 0;
}

.cz-field.cz-full {
  grid-column: 1 / -1;
}

.cz-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .16em;
  opacity: .55;
}

.cz-field label small {
  font-size: 8px;
  letter-spacing: .08em;
  opacity: .7;
}

.cz-input-wrap {
  height: 55px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 16px;
  background: #fafaf8;
  border: 1px solid rgba(17,17,17,.1);
  border-radius: 14px;
  transition:
    border-color .2s ease,
    background .2s ease,
    box-shadow .2s ease;
}

.cz-input-wrap:focus-within {
  background: #fff;
  border-color: #111;
  box-shadow: 0 0 0 4px rgba(17,17,17,.055);
}

.cz-input-wrap svg {
  flex: 0 0 auto;
  opacity: .35;
}

.cz-input-wrap input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111;
  font: inherit;
  font-size: 13px;
}

.cz-input-wrap input::placeholder {
  color: #111;
  opacity: .3;
}

.cz-input-wrap input:disabled {
  cursor: not-allowed;
  opacity: .5;
}

.cz-no-delivery-box {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 18px;
  background: #111;
  color: #fff;
}

.cz-no-delivery-icon {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.cz-no-delivery-box strong {
  display: block;
  font-size: 10px;
  letter-spacing: .15em;
  margin-bottom: 4px;
}

.cz-no-delivery-box p {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  opacity: .63;
}

.cz-no-delivery-box > svg {
  opacity: .75;
}

.cz-security-strip {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 15px;
  padding: 17px 18px;
  border: 1px solid rgba(17,17,17,.08);
  background: rgba(255,255,255,.55);
  border-radius: 18px;
}

.cz-security-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cz-security-item > div {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #eee;
  display: grid;
  place-items: center;
}

.cz-security-item span {
  font-size: 8px;
  letter-spacing: .12em;
  font-weight: 800;
  opacity: .57;
}

.cz-security-line {
  height: 28px;
  width: 1px;
  background: rgba(17,17,17,.1);
}

.cz-summary {
  position: sticky;
  top: 18px;
  height: fit-content;
  background: #111;
  color: #fff;
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 28px 80px rgba(17,17,17,.17);
  overflow: hidden;
}

.cz-summary::before {
  content: "";
  position: absolute;
  width: 200px;
  height: 200px;
  top: -100px;
  right: -100px;
  border-radius: 50%;
  background: rgba(255,255,255,.055);
}

.cz-summary-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.cz-summary-top > div:first-child span {
  display: block;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .18em;
  opacity: .42;
  margin-bottom: 5px;
}

.cz-summary-top h2 {
  margin: 0;
  font-family: "Manrope", sans-serif;
  font-size: 24px;
  letter-spacing: -.045em;
}

.cz-item-count {
  min-width: 52px;
  height: 52px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 15px;
  display: grid;
  place-items: center;
  align-content: center;
  font-size: 14px;
  font-weight: 800;
}

.cz-item-count small {
  font-size: 7px;
  letter-spacing: .12em;
  opacity: .42;
}

.cz-summary-divider {
  height: 1px;
  background: rgba(255,255,255,.1);
  margin: 24px 0;
}

.cz-summary-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cz-product {
  display: grid;
  grid-template-columns: 62px 1fr auto;
  align-items: center;
  gap: 12px;
}

.cz-product-image {
  position: relative;
  width: 62px;
  height: 74px;
  border-radius: 13px;
  overflow: hidden;
  background: #202020;
}

.cz-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cz-product-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: .45;
}

.cz-product-image > span {
  position: absolute;
  right: 5px;
  bottom: 5px;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 99px;
  display: grid;
  place-items: center;
  background: #fff;
  color: #111;
  font-size: 9px;
  font-weight: 800;
}

.cz-product-info {
  min-width: 0;
}

.cz-product-info h3 {
  margin: 0 0 5px;
  font-family: "Manrope", sans-serif;
  font-size: 11px;
  line-height: 1.35;
  letter-spacing: -.01em;
}

.cz-product-info span,
.cz-product-info small {
  display: block;
  font-size: 9px;
  opacity: .42;
  margin-bottom: 3px;
}

.cz-product-info small {
  letter-spacing: .1em;
}

.cz-product > strong {
  font-size: 11px;
  white-space: nowrap;
}

.cz-price-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.cz-price-list > div {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: center;
}

.cz-price-list span {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .14em;
  opacity: .45;
}

.cz-price-list strong {
  font-size: 12px;
}

.cz-price-list .cz-free {
  opacity: .72;
  letter-spacing: .08em;
}

.cz-total-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 19px 0 21px;
  margin-top: 6px;
  border-top: 1px solid rgba(255,255,255,.11);
  border-bottom: 1px solid rgba(255,255,255,.11);
}

.cz-total-box div span {
  display: block;
  font-size: 10px;
  letter-spacing: .16em;
  font-weight: 800;
}

.cz-total-box div small {
  font-size: 7px;
  letter-spacing: .12em;
  opacity: .4;
}

.cz-total-box > strong {
  font-family: "Manrope", sans-serif;
  font-size: 28px;
  line-height: 1;
  letter-spacing: -.045em;
}

.cz-submit {
  width: 100%;
  height: 58px;
  margin-top: 18px;
  border: 0;
  border-radius: 15px;
  background: #fff;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 0 18px 0 20px;
  cursor: pointer;
  font: inherit;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .12em;
  transition:
    transform .2s ease,
    box-shadow .2s ease,
    opacity .2s ease;
}

.cz-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(255,255,255,.11);
}

.cz-submit:disabled {
  cursor: not-allowed;
  opacity: .52;
}

.cz-button-loader {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(17,17,17,.2);
  border-top-color: #111;
  border-radius: 50%;
  animation: czSpin .75s linear infinite;
}

.cz-edit-bag {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 13px;
  color: #fff;
  text-decoration: none;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .13em;
  opacity: .45;
  transition: opacity .2s ease;
}

.cz-edit-bag:hover {
  opacity: .8;
}

.cz-trust {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,.1);
}

.cz-trust > div {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 9px;
  background: rgba(255,255,255,.07);
  display: grid;
  place-items: center;
}

.cz-trust p {
  margin: 0;
  font-size: 8px;
  line-height: 1.5;
  letter-spacing: .08em;
  opacity: .38;
}

.cz-trust strong {
  color: #fff;
  opacity: 1;
}

.cz-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-top: 25px;
  font-size: 8px;
  letter-spacing: .15em;
  font-weight: 800;
  opacity: .34;
}

.cz-footer > div {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cz-error {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 17px;
  margin-top: 20px;
  border: 1px solid rgba(140,0,0,.16);
  background: #fff7f7;
  border-radius: 15px;
  color: #511;
}

.cz-error-mark {
  width: 23px;
  height: 23px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #111;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
}

.cz-error strong {
  display: block;
  font-size: 9px;
  letter-spacing: .14em;
  margin-bottom: 3px;
}

.cz-error p {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
}

.cz-checkout-state {
  display: grid;
  place-items: center;
  padding: 30px;
}

.cz-state-card,
.cz-empty-card {
  width: min(560px, 100%);
  padding: 42px;
  background: #fff;
  border: 1px solid rgba(17,17,17,.09);
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 25px 80px rgba(17,17,17,.07);
}

.cz-state-icon,
.cz-empty-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 20px;
  border-radius: 17px;
  background: #111;
  color: #fff;
  display: grid;
  place-items: center;
}

.cz-state-card > span,
.cz-empty-card > span {
  display: block;
  font-size: 9px;
  letter-spacing: .18em;
  font-weight: 900;
  opacity: .46;
}

.cz-state-card h1,
.cz-empty-card h1 {
  margin: 12px 0 18px;
  font-family: "Manrope", sans-serif;
  font-size: clamp(36px, 7vw, 65px);
  line-height: .92;
  letter-spacing: -.07em;
}

.cz-empty-card p {
  margin: 0 auto 25px;
  max-width: 370px;
  font-size: 13px;
  line-height: 1.6;
  opacity: .56;
}

.cz-primary-button {
  width: fit-content;
  margin: 0 auto;
  padding: 14px 18px;
  border-radius: 12px;
  background: #111;
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .13em;
}

.cz-loader-line {
  width: 120px;
  height: 2px;
  margin: 18px auto 0;
  overflow: hidden;
  background: #eee;
  position: relative;
}

.cz-loader-line::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: #111;
  animation: czLoading 1.1s ease-in-out infinite;
}

@keyframes czLoading {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(350%);
  }
}

@keyframes czSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .cz-checkout-grid {
    grid-template-columns: 1fr;
  }

  .cz-summary {
    position: static;
  }

  .cz-checkout-header {
    grid-template-columns: auto 1fr auto;
  }
}

@media (max-width: 760px) {
  .cz-checkout-shell {
    width: min(100% - 24px, 1420px);
    padding-top: 18px;
  }

  .cz-checkout-header {
    grid-template-columns: 1fr auto;
    align-items: start;
    padding-bottom: 30px;
  }

  .cz-header-main {
    grid-column: 1 / -1;
    grid-row: 2;
    text-align: left;
    margin-top: 8px;
  }

  .cz-header-main p {
    margin-left: 0;
  }

  .cz-header-meta {
    justify-self: end;
  }

  .cz-fields {
    grid-template-columns: 1fr;
  }

  .cz-field.cz-full {
    grid-column: auto;
  }

  .cz-section {
    padding: 19px;
    border-radius: 19px;
  }

  .cz-section-head {
    margin-bottom: 19px;
    padding-bottom: 18px;
  }

  .cz-security-strip {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .cz-security-line {
    width: 100%;
    height: 1px;
  }

  .cz-security-item {
    justify-content: flex-start;
  }

  .cz-summary {
    padding: 20px;
    border-radius: 22px;
  }

  .cz-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .cz-checkout-shell {
    width: calc(100% - 16px);
  }

  .cz-header-main h1 {
    font-size: 54px;
  }

  .cz-section-head h2 {
    font-size: 18px;
  }

  .cz-product {
    grid-template-columns: 54px 1fr auto;
  }

  .cz-product-image {
    width: 54px;
    height: 66px;
  }

  .cz-total-box > strong {
    font-size: 23px;
  }
}
`;

export default Checkout;