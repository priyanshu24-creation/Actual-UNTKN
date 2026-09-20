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

<<<<<<< Updated upstream

  // =========================
  // DELIVERY METHOD
  // =========================

  const [deliveryMethod, setDeliveryMethod] =
    useState("standard");

=======
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(true);
>>>>>>> Stashed changes

  const deliveryMethods = [
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


  const selectedDeliveryMethod =
    deliveryMethods.find(
      (method) =>
        method.id === deliveryMethod
    ) || deliveryMethods[0];


  const shipping =
    selectedDeliveryMethod.price;


  // =========================
  // TOTAL
  // =========================

  const total =
    Number(subtotal || 0) +
    Number(shipping || 0);


  // =========================
  // FORM
  // =========================

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

  useEffect(() => {
    let mounted = true;

    const loadDeliveryMethods = async () => {
      try {
        setDeliveryLoading(true);

        const response = await api.get("/delivery-methods");

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load delivery methods."
          );
        }

<<<<<<< Updated upstream
  // =========================
  // INPUT CHANGE
  // =========================
=======
        const methods = Array.isArray(
          response.data?.deliveryMethods
        )
          ? response.data.deliveryMethods
          : [];

        if (!mounted) {
          return;
        }

        setDeliveryMethods(methods);

        if (methods.length > 0) {
          setDeliveryMethod((current) => {
            const exists = methods.some(
              (method) => method.id === current
            );

            return exists ? current : methods[0].id;
          });
        } else {
          setDeliveryMethod("");
        }
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

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load delivery methods."
        );
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
      (method) => method.id === deliveryMethod
    ) || null;

  const shipping = Number(
    selectedDeliveryMethod?.price || 0
  );

  const total =
    Number(subtotal || 0) +
    Number(shipping || 0);
>>>>>>> Stashed changes

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

  // =========================
  // DELIVERY CHANGE
  // =========================

  const handleDeliveryChange = (
    methodId
  ) => {
    setDeliveryMethod(methodId);

    if (error) {
      setError("");
    }
  };


  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    if (deliveryLoading) {
      setError(
        "Please wait while delivery methods are loading."
      );

      return;
    }

    if (!selectedDeliveryMethod) {
      setError(
        "Please select an available delivery method."
      );

      return;
    }

    // =========================
    // CLEAN VALUES
    // =========================

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

<<<<<<< Updated upstream

    // =========================
    // REQUIRED VALIDATION
    // =========================

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

    // =========================
    // PINCODE VALIDATION
    // =========================

=======
>>>>>>> Stashed changes
    if (!/^\d{6}$/.test(pincode)) {
      setError(
        "Please enter a valid 6-digit pincode."
      );

      return;
    }

<<<<<<< Updated upstream

    // =========================
    // PHONE VALIDATION
    // =========================

=======
>>>>>>> Stashed changes
    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit phone number."
      );

      return;
    }

<<<<<<< Updated upstream

    // =========================
    // CART VALIDATION
    // =========================

=======
>>>>>>> Stashed changes
    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      setError("Your bag is empty.");

      return;
    }

    try {
      setSubmitting(true);

<<<<<<< Updated upstream

      // =========================
      // SHIPPING NAME
      // =========================

      const shippingName =
        `${firstName} ${lastName}`.trim();


      // =========================
      // ORDER PAYLOAD
      // =========================

=======
      const shippingName =
        `${firstName} ${lastName}`.trim();

>>>>>>> Stashed changes
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
        delivery_method: deliveryMethod,
        notes: `Delivery method: ${deliveryMethod}`,
      };

      const response = await api.post(
        "/orders",
        orderPayload
      );

<<<<<<< Updated upstream
      // =========================
      // CREATE ORDER
      // =========================

      const response =
        await api.post(
          "/orders",
          orderPayload
        );


      if (
        !response.data?.success
      ) {
=======
      if (!response.data?.success) {
>>>>>>> Stashed changes
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

      await refreshCart();

      // =========================
      // CHECKOUT DATA
      // =========================

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

        deliveryMethod,

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

<<<<<<< Updated upstream

      // =========================
      // SAVE CHECKOUT SESSION
      // =========================

=======
>>>>>>> Stashed changes
      sessionStorage.setItem(
        "untkn_checkout",
        JSON.stringify(checkoutData)
      );

<<<<<<< Updated upstream

      // =========================
      // GO TO PAYMENT
      // =========================

      navigate(
        "/payment",
        {
          state: {
            order:
              createdOrder,

            checkout:
              checkoutData,
          },
        }
      );


=======
      navigate("/payment", {
        state: {
          order: createdOrder,
          checkout: checkoutData,
        },
      });
>>>>>>> Stashed changes
    } catch (requestError) {
      console.error(
        "Checkout error:",
        requestError
      );

      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to create your order.";

      setError(message);
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
    } finally {
      setSubmitting(false);

    }
  };

<<<<<<< Updated upstream

  // =========================
  // EMPTY CART
  // =========================

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

  // =========================
  // LOADING
  // =========================

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

  // =========================
  // PAGE
  // =========================

  return (
    <div className="checkout-page">


      {/* =========================
          HEADER
      ========================= */}

=======
  return (
    <div className="checkout-page">
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

      {/* =========================
          ERROR
      ========================= */}

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

      {/* =========================
          CHECKOUT FORM
      ========================= */}

=======
>>>>>>> Stashed changes
      <form
        className="checkout-layout"
        onSubmit={handleSubmit}
      >
<<<<<<< Updated upstream


        {/* =========================
            MAIN
        ========================= */}

        <main className="checkout-main">


          {/* =========================
              CONTACT
          ========================= */}

=======
        <main className="checkout-main">
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream


              {/* FIRST NAME */}

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

          {/* =========================
              SHIPPING ADDRESS
          ========================= */}

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream


              {/* ADDRESS */}

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
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
                  }}
                >
                  NO DELIVERY METHODS ARE CURRENTLY AVAILABLE.
                </div>
              ) : (
                <div className="delivery-methods">
                  {deliveryMethods.map(
                    (method) => {
                      const selected =
                        deliveryMethod ===
                        method.id;
>>>>>>> Stashed changes

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
                          disabled={
                            submitting
                          }
                        >
                          <div className="delivery-radio">
                            <span />
                          </div>

                          <div className="delivery-info">
                            <strong>
                              {method.name}
                            </strong>

<<<<<<< Updated upstream

            {/* =========================
                DELIVERY METHOD
            ========================= */}

            <section className="checkout-delivery">

              <div className="checkout-section-heading">

                <p className="eyebrow">
                  DELIVERY
                </p>

                <h2>
                  DELIVERY METHOD
                </h2>

              </div>


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
                        disabled={
                          submitting
                        }
                      >

                        <div className="delivery-radio">

                          <span />

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

                          {method.price === 0
                            ? "FREE"
                            : `₹${method.price}`}

                        </strong>

                      </button>
                    );
                  }
                )}

              </div>

            </section>

          </section>


          {/* =========================
              SECURITY
          ========================= */}

=======
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

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

        {/* =========================
            ORDER SUMMARY
        ========================= */}

        <aside className="checkout-summary">


=======
        <aside className="checkout-summary">
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

          {/* =========================
              ITEMS
          ========================= */}

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream


=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

          {/* =========================
              TOTALS
          ========================= */}

          <div className="checkout-totals">


=======
          <div className="checkout-totals">
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
                {shipping === 0
                  ? "FREE"
                  : `₹${shipping.toLocaleString(
                      "en-IN"
                    )}`}
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

          {/* =========================
              SUBMIT
          ========================= */}

=======
>>>>>>> Stashed changes
          <button
            type="submit"
            className="checkout-submit"
            disabled={
              submitting ||
              deliveryLoading ||
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