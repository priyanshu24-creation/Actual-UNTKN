import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

const DEFAULT_DELIVERY_METHODS = [
  {
    id: "standard",
    name: "STANDARD DELIVERY",
    description: "5–7 BUSINESS DAYS",
    price: 99,
  },
  {
    id: "express",
    name: "EXPRESS DELIVERY",
    description: "2–3 BUSINESS DAYS",
    price: 199,
  },
];

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    subtotal,
    loading: cartLoading,
    refreshCart,
  } = useCart();

  const [deliveryMethods, setDeliveryMethods] = useState(
    DEFAULT_DELIVERY_METHODS
  );

  const [deliveryMethod, setDeliveryMethod] =
    useState("standard");

  const [deliveryLoading, setDeliveryLoading] =
    useState(false);

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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);


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

        if (authError.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              redirectTo: "/checkout",
            },
          });
          return;
        }

        console.error("Checkout authentication check failed:", authError);
        setError(
          authError.response?.data?.message ||
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
    let mounted = true;

    const loadDeliveryMethods = async () => {
      try {
        setDeliveryLoading(true);

        const response = await api.get(
          "/delivery-methods"
        );

        const methods = Array.isArray(
          response.data?.deliveryMethods
        )
          ? response.data.deliveryMethods
          : [];

        if (!mounted) {
          return;
        }

        if (methods.length > 0) {
          setDeliveryMethods(methods);

          setDeliveryMethod((current) => {
            const exists = methods.some(
              (method) => method.id === current
            );

            return exists ? current : methods[0].id;
          });
        } else {
          setDeliveryMethods(
            DEFAULT_DELIVERY_METHODS
          );

          setDeliveryMethod("standard");
        }
      } catch (requestError) {
        console.error(
          "Delivery methods error:",
          requestError
        );

        if (!mounted) {
          return;
        }

        setDeliveryMethods(
          DEFAULT_DELIVERY_METHODS
        );

        setDeliveryMethod("standard");
      } finally {
        if (mounted) {
          setDeliveryLoading(false);
        }
      }
    };

    loadDeliveryMethods();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDeliveryMethod =
    deliveryMethods.find(
      (method) =>
        method.id === deliveryMethod
    ) ||
    deliveryMethods[0] ||
    DEFAULT_DELIVERY_METHODS[0];

  const shipping = Number(
    selectedDeliveryMethod?.price || 0
  );

  const total =
    Number(subtotal || 0) +
    Number(shipping || 0);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleDeliveryChange = (methodId) => {
    setDeliveryMethod(methodId);

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
        "Please complete all required shipping information."
      );

      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError(
        "Please enter a valid 6-digit pincode."
      );

      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit phone number."
      );

      return;
    }

    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      setError("Your bag is empty.");

      return;
    }

    if (!selectedDeliveryMethod) {
      setError(
        "Please select a delivery method."
      );

      return;
    }

    try {
      setSubmitting(true);

      try {
        await api.get("/auth/me");
      } catch (authError) {
        if (authError.response?.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              redirectTo: "/checkout",
            },
          });
          return;
        }

        throw authError;
      }

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
        delivery_method:
          selectedDeliveryMethod.id,
        notes: `Delivery method: ${selectedDeliveryMethod.id}`,
      };

      const response = await api.post(
        "/orders",
        orderPayload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to create order."
        );
      }

      const createdOrder =
        response.data?.order;

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

        deliveryMethod:
          selectedDeliveryMethod.id,

        deliveryMethodName:
          selectedDeliveryMethod.name,

        shippingFee:
          Number(shipping),

        subtotal:
          Number(subtotal || 0),

        frontendTotal:
          Number(total),

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

      const message =
        requestError?.response?.data
          ?.message ||
        requestError?.message ||
        "Unable to create your order.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <div
        className="checkout-page"
        style={{
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        VERIFYING ACCOUNT...
      </div>
    );
  }

  if (
    !cartLoading &&
    cartItems.length === 0
  ) {
    return (
      <div className="checkout-empty">
        <p className="eyebrow">
          YOUR BAG IS EMPTY
        </p>

        <h1>
          NOTHING
          <br />
          TO CHECK OUT.
        </h1>

        <p>
          Add something to your bag before
          continuing to checkout.
        </p>

        <Link to="/shop">
          SHOP PRODUCTS →
        </Link>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div
        className="checkout-page"
        style={{
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        LOADING CHECKOUT...
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <section className="checkout-header">
        <Link
          to="/cart"
          className="checkout-back"
        >
          <ChevronLeft
            size={17}
            strokeWidth={1.5}
          />

          BACK TO BAG
        </Link>

        <div>
          <p className="eyebrow">
            SECURE CHECKOUT
          </p>

          <h1>
            CHECKOUT
          </h1>
        </div>
      </section>

      {error && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 16px",
            border: "1px solid #000",
            background: "#fff",
            color: "#000",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          {error}
        </div>
      )}

      <form
        className="checkout-layout"
        onSubmit={handleSubmit}
      >
        <main className="checkout-main">
          <section className="checkout-section">
            <div className="checkout-section-header">
              <div>
                <span>
                  01
                </span>

                <div>
                  <p className="eyebrow">
                    CONTACT
                  </p>

                  <h2>
                    YOUR DETAILS
                  </h2>
                </div>
              </div>
            </div>

            <div className="checkout-fields">
              <div className="checkout-field">
                <label htmlFor="firstName">
                  FIRST NAME
                </label>

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
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="lastName">
                  LAST NAME
                </label>

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
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field full">
                <label htmlFor="email">
                  EMAIL ADDRESS
                </label>

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
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field full">
                <label htmlFor="phone">
                  PHONE NUMBER
                </label>

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
                  placeholder="Enter your 10-digit phone number"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-header">
              <div>
                <span>
                  02
                </span>

                <div>
                  <p className="eyebrow">
                    DELIVERY
                  </p>

                  <h2>
                    SHIPPING ADDRESS
                  </h2>
                </div>
              </div>

              <MapPin
                size={20}
                strokeWidth={1.2}
              />
            </div>

            <div className="checkout-fields">
              <div className="checkout-field full">
                <label htmlFor="address">
                  ADDRESS
                </label>

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
                  required
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field full">
                <label htmlFor="apartment">
                  APARTMENT / LANDMARK
                </label>

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
                  placeholder="Apartment / landmark (optional)"
                  autoComplete="address-line2"
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="city">
                  CITY
                </label>

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
                  placeholder="City"
                  autoComplete="address-level2"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="state">
                  STATE
                </label>

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
                  placeholder="State"
                  autoComplete="address-level1"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="pincode">
                  PINCODE
                </label>

                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  value={
                    formData.pincode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="6-digit pincode"
                  autoComplete="postal-code"
                  maxLength={6}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <section className="checkout-delivery">
              <div className="checkout-section-heading">
                <p className="eyebrow">
                  DELIVERY
                </p>

                <h2>
                  DELIVERY METHOD
                </h2>
              </div>

              {deliveryLoading ? (
                <div
                  style={{
                    padding: "20px 0",
                    fontSize: "13px",
                  }}
                >
                  LOADING DELIVERY OPTIONS...
                </div>
              ) : (
                <div className="delivery-methods">
                  {deliveryMethods.map(
                    (method) => {
                      const selected =
                        deliveryMethod ===
                        method.id;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          className={`delivery-method ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleDeliveryChange(
                              method.id
                            )
                          }
                          disabled={submitting}
                        >
                          <div className="delivery-radio">
                            {selected && (
                              <span />
                            )}
                          </div>

                          <div className="delivery-info">
                            <strong>
                              {method.name}
                            </strong>

                            <span>
                              {method.description}
                            </span>
                          </div>

                          <strong className="delivery-price">
                            {Number(
                              method.price || 0
                            ) === 0
                              ? "FREE"
                              : `₹${Number(
                                  method.price || 0
                                ).toLocaleString(
                                  "en-IN"
                                )}`}
                          </strong>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </section>

          <div className="checkout-security">
            <ShieldCheck
              size={18}
              strokeWidth={1.3}
            />

            <div>
              <strong>
                SECURE CHECKOUT
              </strong>

              <p>
                Your information is protected
                and securely processed.
              </p>
            </div>
          </div>
        </main>

        <aside className="checkout-summary">
          <div className="checkout-summary-header">
            <p className="eyebrow">
              YOUR BAG
            </p>

            <span>
              {cartItems.reduce(
                (count, item) =>
                  count +
                  Number(
                    item.quantity || 0
                  ),
                0
              )}{" "}
              ITEMS
            </span>
          </div>

          <div className="checkout-items">
            {cartItems.map((item) => {
              const unitPrice =
                Number(
                  item.unit_price ??
                    item.price ??
                    0
                );

              const itemTotal =
                unitPrice *
                Number(
                  item.quantity || 0
                );

              const imageUrl =
                item.image_url ||
                item.image ||
                "";

              return (
                <div
                  className="checkout-item"
                  key={`${item.cartItemId}-${item.product_id}-${item.variant_id}`}
                >
                  <div className="checkout-item-image">
                    {imageUrl &&
                    !imageUrl.includes(
                      "example.com"
                    ) ? (
                      <img
                        src={imageUrl}
                        alt={
                          item.product_name ||
                          item.name ||
                          "UNTKN Product"
                        }
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "10px",
                          textAlign:
                            "center",
                          padding: "5px",
                        }}
                      >
                        {item.product_name ||
                          item.name ||
                          "UNTKN"}
                      </div>
                    )}

                    <span>
                      {item.quantity}
                    </span>
                  </div>

                  <div className="checkout-item-info">
                    <h3>
                      {item.product_name ||
                        item.name}
                    </h3>

                    {item.color && (
                      <p>
                        {item.color}
                      </p>
                    )}

                    <span>
                      SIZE{" "}
                      {item.size || "-"}
                    </span>
                  </div>

                  <strong>
                    ₹
                    {itemTotal.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              );
            })}
          </div>

          <div className="checkout-totals">
            <div>
              <span>
                SUBTOTAL
              </span>

              <strong>
                ₹
                {Number(
                  subtotal || 0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                SHIPPING
              </span>

              <strong>
                {shipping === 0
                  ? "FREE"
                  : `₹${shipping.toLocaleString(
                      "en-IN"
                    )}`}
              </strong>
            </div>

            <div className="checkout-total-divider" />

            <div className="checkout-total">
              <span>
                TOTAL
              </span>

              <strong>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            className="checkout-submit"
            disabled={submitting}
          >
            {submitting
              ? "CREATING ORDER..."
              : "CONTINUE TO PAYMENT →"}
          </button>

          <p className="checkout-note">
            By continuing, you agree to our
            terms and conditions.
          </p>
        </aside>
      </form>
    </div>
  );
}

export default Checkout;