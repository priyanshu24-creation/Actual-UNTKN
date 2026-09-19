import { useState } from "react";
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
  } = useCart();


  // =========================
  // DELIVERY METHOD
  // =========================

  const [deliveryMethod, setDeliveryMethod] =
    useState("standard");


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


  const [submitting, setSubmitting] =
    useState(false);


  const [error, setError] =
    useState("");


  // =========================
  // INPUT CHANGE
  // =========================

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


    // =========================
    // REQUIRED VALIDATION
    // =========================

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


    // =========================
    // PINCODE VALIDATION
    // =========================

    if (!/^\d{6}$/.test(pincode)) {
      setError(
        "Please enter a valid 6-digit pincode."
      );

      return;
    }


    // =========================
    // PHONE VALIDATION
    // =========================

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit phone number."
      );

      return;
    }


    // =========================
    // CART VALIDATION
    // =========================

    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      setError(
        "Your bag is empty."
      );

      return;
    }


    try {
      setSubmitting(true);


      // =========================
      // SHIPPING NAME
      // =========================

      const shippingName =
        `${firstName} ${lastName}`.trim();


      // =========================
      // ORDER PAYLOAD
      // =========================

      const orderPayload = {
        shipping_name:
          shippingName,

        shipping_phone:
          phone,

        shipping_email:
          email,

        shipping_address_line1:
          address,

        shipping_address_line2:
          apartment || null,

        shipping_city:
          city,

        shipping_state:
          state,

        shipping_postal_code:
          pincode,

        shipping_country:
          "India",

        delivery_method:
          deliveryMethod,

        notes:
          `Delivery method: ${deliveryMethod}`,
      };


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
        throw new Error(
          response.data?.message ||
            "Failed to create order."
        );
      }


      const createdOrder =
        response.data?.order;


      if (
        !createdOrder?.id
      ) {
        throw new Error(
          "Order was created but no order ID was returned."
        );
      }


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

        order:
          createdOrder,
      };


      // =========================
      // SAVE CHECKOUT SESSION
      // =========================

      sessionStorage.setItem(
        "untkn_checkout",
        JSON.stringify(
          checkoutData
        )
      );


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


    } catch (requestError) {

      console.error(
        "Checkout error:",
        requestError
      );


      const message =
        requestError.response?.data
          ?.message ||
        requestError.message ||
        "Unable to create your order.";


      setError(message);

    } finally {

      setSubmitting(false);

    }
  };


  // =========================
  // EMPTY CART
  // =========================

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


  // =========================
  // LOADING
  // =========================

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


  // =========================
  // PAGE
  // =========================

  return (
    <div className="checkout-page">


      {/* =========================
          HEADER
      ========================= */}

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


      {/* =========================
          ERROR
      ========================= */}

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


      {/* =========================
          CHECKOUT FORM
      ========================= */}

      <form
        className="checkout-layout"
        onSubmit={handleSubmit}
      >


        {/* =========================
            MAIN
        ========================= */}

        <main className="checkout-main">


          {/* =========================
              CONTACT
          ========================= */}

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


              {/* FIRST NAME */}

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


              {/* LAST NAME */}

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


              {/* EMAIL */}

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


              {/* PHONE */}

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


          {/* =========================
              SHIPPING ADDRESS
          ========================= */}

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


              {/* ADDRESS */}

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


              {/* APARTMENT */}

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


              {/* CITY */}

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


              {/* STATE */}

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


              {/* PINCODE */}

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


        {/* =========================
            ORDER SUMMARY
        ========================= */}

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


          {/* =========================
              ITEMS
          ========================= */}

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


          {/* =========================
              TOTALS
          ========================= */}

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


            <div className="checkout-total-divider"></div>


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


          {/* =========================
              SUBMIT
          ========================= */}

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