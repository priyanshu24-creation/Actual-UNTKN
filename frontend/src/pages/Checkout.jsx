import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    subtotal,
    loading: cartLoading,
    refreshCart,
  } = useCart();

  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [deliveryMethod, setDeliveryMethod] =
    useState("");

  const [deliveryLoading, setDeliveryLoading] =
    useState(true);

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

  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showOffers, setShowOffers] = useState(false);


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

        setDeliveryMethods([]);
        setDeliveryMethod("");

        const response = await api.get(
          "/delivery-methods",
          {
            params: {
              _delivery_config: Date.now(),
            },
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
            },
          }
        );

        const rawMethods = Array.isArray(
          response.data?.deliveryMethods
        )
          ? response.data.deliveryMethods
          : Array.isArray(response.data?.methods)
          ? response.data.methods
          : [];

        const methods = rawMethods
          .filter((method) => {
            if (!method || method.id === undefined || method.id === null) {
              return false;
            }

            if (
              Object.prototype.hasOwnProperty.call(
                method,
                "isActive"
              )
            ) {
              return (
                method.isActive === true ||
                method.isActive === 1 ||
                method.isActive === "1" ||
                method.isActive === "true"
              );
            }

            if (
              Object.prototype.hasOwnProperty.call(
                method,
                "is_active"
              )
            ) {
              return (
                method.is_active === true ||
                method.is_active === 1 ||
                method.is_active === "1" ||
                method.is_active === "true"
              );
            }

            if (
              Object.prototype.hasOwnProperty.call(
                method,
                "enabled"
              )
            ) {
              return (
                method.enabled === true ||
                method.enabled === 1 ||
                method.enabled === "1" ||
                method.enabled === "true"
              );
            }

            return false;
          })
          .map((method) => ({
            id: String(method.id),
            name: method.name,
            description: method.description || "",
            price: Number(method.price ?? 0),
          }));

        if (!mounted) {
          return;
        }

        setDeliveryMethods(methods);

        setDeliveryMethod((current) => {
          const currentId = String(current || "");

          const exists = methods.some(
            (method) => method.id === currentId
          );

          return exists ? currentId : methods[0]?.id || "";
        });
      } catch (requestError) {
        console.error(
          "Delivery methods error:",
          requestError
        );

        if (!mounted) {
          return;
        }

        setDeliveryMethods([]);
        setDeliveryMethod("");
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

  useEffect(() => {
    const savedCode =
      sessionStorage.getItem("untkn_coupon_code");

    if (savedCode) {
      setCouponCode(savedCode);
    }

    let mounted = true;

    const loadAvailableCoupons = async () => {
      try {
        const response = await api.get("/coupons/active");

        if (!mounted) {
          return;
        }

        setAvailableCoupons(
          Array.isArray(response.data?.coupons)
            ? response.data.coupons
            : []
        );
      } catch (requestError) {
        console.error(
          "Available coupons error:",
          requestError
        );
      }
    };

    loadAvailableCoupons();

    return () => {
      mounted = false;
    };
  }, []);

  const buildCouponItems = () =>
    cartItems.map((item) => ({
      product_id: item.product_id,
      category_id: item.category_id ?? null,
      collection_id: item.collection_id ?? null,
      quantity: Number(item.quantity || 0),
      unit_price: Number(
        item.unit_price ?? item.price ?? 0
      )
    }));

  const applyCoupon = async (code = couponCode) => {
    const cleanCode = String(code || "").trim().toUpperCase();

    if (!cleanCode) {
      setCouponError("Enter a coupon code.");
      return false;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await api.post(
        "/coupons/validate",
        {
          code: cleanCode,
          subtotal: Number(subtotal || 0),
          items: buildCouponItems()
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to apply coupon."
        );
      }

      const coupon = response.data.coupon;

      setCouponCode(cleanCode);
      setCouponData(coupon);

      sessionStorage.setItem(
        "untkn_coupon_code",
        cleanCode
      );

      sessionStorage.setItem(
        "untkn_coupon_data",
        JSON.stringify(coupon)
      );

      return true;
    } catch (requestError) {
      console.error(
        "Coupon validation error:",
        requestError
      );

      setCouponData(null);
      sessionStorage.removeItem(
        "untkn_coupon_code"
      );
      sessionStorage.removeItem(
        "untkn_coupon_data"
      );

      setCouponError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Invalid coupon code."
      );

      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
    sessionStorage.removeItem(
      "untkn_coupon_code"
    );
    sessionStorage.removeItem(
      "untkn_coupon_data"
    );
  };

  const selectedDeliveryMethod =
    deliveryMethods.find(
      (method) =>
        String(method.id) === String(deliveryMethod)
    ) || null;

  const shipping = Number(
    selectedDeliveryMethod?.price || 0
  );

  const couponDiscount = Math.min(
    Number(couponData?.discount || 0),
    Number(subtotal || 0)
  );

  const total =
    Math.max(
      0,
      Number(subtotal || 0) +
        Number(shipping || 0) -
        couponDiscount
    );

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
    const methodExists = deliveryMethods.some(
      (method) => method.id === methodId
    );

    if (!methodExists) {
      return;
    }

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

      let finalCouponCode = "";

      if (couponCode.trim()) {
        const couponApplied = await applyCoupon(
          couponCode
        );

        if (!couponApplied) {
          return;
        }

        finalCouponCode =
          couponCode.trim().toUpperCase();
      }

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
        coupon_code:
          finalCouponCode || null,
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

        couponCode:
          finalCouponCode || null,

        couponDiscount:
          Number(couponDiscount || 0),

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
              ) : deliveryMethods.length === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    borderTop: "1px solid #e5e5e5",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  NO DELIVERY METHODS ARE CURRENTLY AVAILABLE.
                  PLEASE TRY AGAIN LATER.
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

          <div
            style={{
              marginTop: "22px",
              marginBottom: "18px",
              border: "1px solid #e5e5e5",
              background: "#fafafa",
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div>
                <p
                  className="eyebrow"
                  style={{ marginBottom: "5px" }}
                >
                  UNTKN OFFERS
                </p>
                <strong
                  style={{
                    fontSize: "14px",
                    letterSpacing: "0.04em",
                  }}
                >
                  HAVE A COUPON?
                </strong>
              </div>

              {availableCoupons.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowOffers((current) => !current)
                  }
                  style={{
                    border: "0",
                    background: "transparent",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                  }}
                >
                  {showOffers
                    ? "HIDE OFFERS"
                    : "VIEW OFFERS"}
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <input
                type="text"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(
                    event.target.value.toUpperCase()
                  );
                  setCouponError("");
                }}
                placeholder="ENTER CODE"
                disabled={
                  couponLoading ||
                  submitting
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1px solid #d8d8d8",
                  background: "#fff",
                  padding: "12px",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  outline: "none",
                }}
              />

              {couponData ? (
                <button
                  type="button"
                  onClick={removeCoupon}
                  disabled={
                    couponLoading ||
                    submitting
                  }
                  style={{
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "0 15px",
                    cursor: "pointer",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                  }}
                >
                  REMOVE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => applyCoupon()}
                  disabled={
                    couponLoading ||
                    submitting ||
                    !couponCode.trim()
                  }
                  style={{
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "0 17px",
                    cursor: "pointer",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                  }}
                >
                  {couponLoading
                    ? "CHECKING..."
                    : "APPLY"}
                </button>
              )}
            </div>

            {couponError && (
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#a33",
                  fontSize: "12px",
                }}
              >
                {couponError}
              </p>
            )}

            {couponData && (
              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e2e2",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  fontSize: "12px",
                }}
              >
                <span>
                  {couponData.code} APPLIED
                </span>
                <strong>
                  -₹
                  {Number(
                    couponData.discount || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            )}

            {showOffers &&
              availableCoupons.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  {availableCoupons
                    .slice(0, 5)
                    .map((coupon) => (
                      <button
                        key={coupon.id}
                        type="button"
                        onClick={() => {
                          setCouponCode(
                            coupon.code
                          );
                          setShowOffers(false);
                          applyCoupon(
                            coupon.code
                          );
                        }}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          border: "1px dashed #cfcfcf",
                          background: "#fff",
                          padding: "10px 12px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span>
                          <strong>
                            {coupon.code}
                          </strong>
                          <small
                            style={{
                              display: "block",
                              marginTop: "3px",
                              color: "#777",
                            }}
                          >
                            {coupon.discount_type ===
                            "percentage"
                              ? `${coupon.discount_value}% OFF`
                              : `₹${Number(
                                  coupon.discount_value
                                ).toLocaleString(
                                  "en-IN"
                                )} OFF`}
                          </small>
                        </span>
                        <span>→</span>
                      </button>
                    ))}
                </div>
              )}
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

            {couponDiscount > 0 && (
              <div>
                <span>
                  DISCOUNT
                </span>

                <strong
                  style={{
                    color: "#2f6b3f",
                  }}
                >
                  -₹
                  {couponDiscount.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>
            )}

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
            disabled={
              submitting ||
              deliveryLoading ||
              deliveryMethods.length === 0 ||
              !selectedDeliveryMethod
            }
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