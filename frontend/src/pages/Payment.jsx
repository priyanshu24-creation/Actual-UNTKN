import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItems, subtotal } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [error, setError] = useState("");

  const checkoutData = useMemo(() => {
    if (location.state?.checkout) {
      return location.state.checkout;
    }

    try {
      const stored = sessionStorage.getItem("untkn_checkout");

      if (stored) {
        return JSON.parse(stored);
      }
    } catch (storageError) {
      console.error(
        "Failed to read checkout data:",
        storageError
      );
    }

    return null;
  }, [location.state]);

  const order = useMemo(() => {
    if (location.state?.order) {
      return location.state.order;
    }

    return checkoutData?.order || null;
  }, [location.state, checkoutData]);

  const checkoutItems = useMemo(() => {
    if (
      Array.isArray(cartItems) &&
      cartItems.length > 0
    ) {
      return cartItems;
    }

    if (
      Array.isArray(order?.items) &&
      order.items.length > 0
    ) {
      return order.items.map((item) => ({
        id: item.product_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name:
          item.product_name ||
          "UNTKN Product",
        product_name:
          item.product_name ||
          "UNTKN Product",
        image:
          item.image_url ||
          "",
        size:
          item.size_name ||
          "",
        color:
          item.color_name ||
          "",
        quantity:
          Number(item.quantity || 1),
        price:
          Number(item.unit_price || 0),
        unit_price:
          Number(item.unit_price || 0),
      }));
    }

    return [];
  }, [cartItems, order]);

  const calculatedSubtotal = useMemo(() => {
    if (Number(subtotal || 0) > 0) {
      return Number(subtotal);
    }

    if (Number(order?.subtotal || 0) > 0) {
      return Number(order.subtotal);
    }

    return checkoutItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.unit_price ??
            item.price ??
            0
        ) *
        Number(
          item.quantity || 0
        ),
      0
    );
  }, [subtotal, order, checkoutItems]);

  const shipping = Number(
    order?.shipping_fee ??
      checkoutData?.shippingFee ??
      100
  );

  const backendTotal = Number(
    order?.total_amount || 0
  );

  const frontendTotal =
    calculatedSubtotal + shipping;

<<<<<<< Updated upstream
  /*
  |--------------------------------------------------------------------------
  | BACKEND TOTAL IS AUTHORITATIVE
  |--------------------------------------------------------------------------
  */

=======
>>>>>>> Stashed changes
  const total =
    backendTotal > 0
      ? backendTotal
      : frontendTotal;

  useEffect(() => {
    if (window.Razorpay) {
      setScriptLoading(false);
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => {
          setScriptLoading(false);
        }
      );

      existingScript.addEventListener(
        "error",
        () => {
          setScriptLoading(false);

          setError(
            "Failed to load Razorpay Checkout."
          );
        }
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      setScriptLoading(false);
    };

    script.onerror = () => {
      setScriptLoading(false);

      setError(
        "Failed to load Razorpay Checkout. Please check your internet connection."
      );
    };

    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const formatMoney = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString("en-IN");
  };

<<<<<<< Updated upstream
  /*
  |--------------------------------------------------------------------------
  | HANDLE PAYMENT
  |--------------------------------------------------------------------------
  */

=======
>>>>>>> Stashed changes
  const handlePayment = async (
    event,
    selectedMethod = paymentMethod
  ) => {
    event.preventDefault();

    setError("");
    setPaymentMethod(selectedMethod);

    if (!order?.id) {
      setError(
        "Order information is missing. Please return to checkout and try again."
      );

      return;
    }

<<<<<<< Updated upstream
    /*
    |--------------------------------------------------------------------------
    | CASH ON DELIVERY
    |--------------------------------------------------------------------------
    */

    if (selectedMethod === "cod") {
      try {
        setLoading(true);

        sessionStorage.removeItem(
          "untkn_checkout"
        );

=======
    if (selectedMethod === "cod") {
      try {
        setLoading(true);

        sessionStorage.removeItem(
          "untkn_checkout"
        );

>>>>>>> Stashed changes
        navigate(
          "/order-success",
          {
            replace: true,
<<<<<<< Updated upstream

            state: {
              order,
              paymentMethod: "cod",
=======
            state: {
              order,
              paymentMethod: "cod",
              customerEmail:
                checkoutData?.customer?.email ||
                order?.shipping_email ||
                "",
              emailSent: false,
>>>>>>> Stashed changes
            },
          }
        );
      } catch (codError) {
        console.error(
          "COD error:",
          codError
        );

        setError(
          "Unable to place COD order."
        );

        setLoading(false);
      }

      return;
    }

    if (
      scriptLoading ||
      !window.Razorpay
    ) {
      setError(
        "Razorpay Checkout is still loading. Please try again."
      );

      return;
    }

<<<<<<< Updated upstream
    /*
    |--------------------------------------------------------------------------
    | START RAZORPAY PAYMENT
    |--------------------------------------------------------------------------
    */

=======
>>>>>>> Stashed changes
    try {
      setLoading(true);

      const response =
        await api.post(
          "/payments/create-order",
          {
            order_id:
              Number(order.id),
          }
        );

      console.log(
        "Create Razorpay order response:",
        response.data
      );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to create Razorpay order."
        );
      }

<<<<<<< Updated upstream
      /*
      |--------------------------------------------------------------------------
      | GET PAYMENT DATA
      |--------------------------------------------------------------------------
      */

=======
>>>>>>> Stashed changes
      const paymentData =
        response.data?.payment;

      if (!paymentData) {
        throw new Error(
          "Payment information was not returned by the backend."
        );
      }

<<<<<<< Updated upstream
      /*
      |--------------------------------------------------------------------------
      | RAZORPAY VALUES
      |--------------------------------------------------------------------------
      */

=======
>>>>>>> Stashed changes
      const razorpayOrderId =
        paymentData?.razorpay_order_id;

      const razorpayAmount =
        Number(
          paymentData?.amount || 0
        );

      const razorpayCurrency =
        paymentData?.currency ||
        "INR";

      const razorpayKey =
        paymentData?.razorpay_key_id ||
        import.meta.env
          .VITE_RAZORPAY_KEY_ID;

      if (!razorpayOrderId) {
        throw new Error(
          "Razorpay order ID was not returned by the backend."
        );
      }

      if (
        !razorpayAmount ||
        razorpayAmount <= 0
      ) {
        throw new Error(
          "Invalid Razorpay payment amount."
        );
      }

      if (!razorpayKey) {
        throw new Error(
          "Razorpay Key ID is not configured."
        );
      }

      const customer =
        checkoutData?.customer || {};

      const customerName =
        `${customer.firstName || ""} ${
          customer.lastName || ""
        }`.trim();

      const customerEmail =
        customer.email ||
        order?.shipping_email ||
        "";

      const customerPhone =
        customer.phone ||
        order?.shipping_phone ||
        "";

      const options = {
        key: razorpayKey,

        amount:
          razorpayAmount,

        currency:
          razorpayCurrency,

        name: "UNTKN",

        description:
          `Payment for order ${
            paymentData.order_number ||
            order.order_number ||
            order.id
          }`,

        order_id:
          razorpayOrderId,

        prefill: {
          name:
            customerName,

          email:
            customerEmail,

          contact:
            customerPhone,
        },

        notes: {
          order_id:
            String(order.id),

          order_number:
            String(
              order.order_number ||
                ""
            ),
        },

        theme: {
          color: "#000000",
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },

        handler:
          async function (
            razorpayResponse
          ) {
            try {
              setError("");
              setLoading(true);

              console.log(
                "Razorpay payment response:",
                razorpayResponse
              );

<<<<<<< Updated upstream
              /*
              |--------------------------------------------------------------------------
              | VERIFY PAYMENT
              |--------------------------------------------------------------------------
              */

=======
>>>>>>> Stashed changes
              const verifyResponse =
                await api.post(
                  "/payments/verify",
                  {
                    order_id:
                      Number(order.id),

                    razorpay_order_id:
                      razorpayResponse.razorpay_order_id,

                    razorpay_payment_id:
                      razorpayResponse.razorpay_payment_id,

                    razorpay_signature:
                      razorpayResponse.razorpay_signature,
                  }
                );

              console.log(
                "Payment verification response:",
                verifyResponse.data
              );

              if (
                !verifyResponse
                  .data
                  ?.success
              ) {
                throw new Error(
                  verifyResponse
                    .data
                    ?.message ||
                    "Payment verification failed."
                );
              }

              const verifiedOrder =
                verifyResponse
                  .data
                  ?.order ||
                order;

              const verifiedPayment =
                verifyResponse
                  .data
                  ?.payment ||
                null;

              const emailSent =
                verifyResponse
                  .data
                  ?.email_sent === true;

              sessionStorage.removeItem(
                "untkn_checkout"
              );

              navigate(
                "/order-success",
                {
                  replace: true,

                  state: {
                    order:
                      verifiedOrder,

                    payment:
                      verifiedPayment,

                    paymentMethod:
                      selectedMethod,
<<<<<<< Updated upstream
=======

                    customerEmail:
                      customerEmail,

                    emailSent:
                      emailSent,
>>>>>>> Stashed changes
                  },
                }
              );
            } catch (verifyError) {
              console.error(
                "Payment verification error:",
                verifyError
              );

              setError(
                verifyError.response
                  ?.data?.message ||
                  verifyError.message ||
                  "Payment verification failed."
              );

              setLoading(false);
            }
          },
      };

<<<<<<< Updated upstream
      /*
      |--------------------------------------------------------------------------
      | CREATE RAZORPAY INSTANCE
      |--------------------------------------------------------------------------
      */

=======
>>>>>>> Stashed changes
      const razorpay =
        new window.Razorpay(
          options
        );

<<<<<<< Updated upstream
      /*
      |--------------------------------------------------------------------------
      | PAYMENT FAILED
      |--------------------------------------------------------------------------
      */

=======
>>>>>>> Stashed changes
      razorpay.on(
        "payment.failed",
        (paymentFailure) => {
          console.error(
            "Razorpay payment failed:",
            paymentFailure
          );

          setError(
            paymentFailure.error
              ?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

<<<<<<< Updated upstream
      /*
      |--------------------------------------------------------------------------
      | OPEN RAZORPAY
      |--------------------------------------------------------------------------
      */

      razorpay.open();

      /*
      |--------------------------------------------------------------------------
      | RAZORPAY MODAL CONTROLS UI
      |--------------------------------------------------------------------------
      */

=======
      razorpay.open();

>>>>>>> Stashed changes
      setLoading(false);
    } catch (paymentError) {
      console.error(
        "Payment error:",
        paymentError
      );

      setError(
        paymentError.response
          ?.data?.message ||
          paymentError.message ||
          "Unable to start payment."
      );

      setLoading(false);
    }
  };

  if (
    !order?.id &&
    checkoutItems.length === 0
  ) {
    return (
      <div className="payment-empty">

        <p className="eyebrow">
          PAYMENT
        </p>

        <h1>
          ORDER
          <br />
          NOT FOUND.
        </h1>

        <p>
          Your checkout session could not
          be found. Please return to checkout
          and try again.
        </p>

        <Link to="/checkout">
          RETURN TO CHECKOUT →
        </Link>

      </div>
    );
  }

  return (
    <div className="payment-page">
      <section className="payment-header">
        <Link
          to="/checkout"
          className="payment-back"
        >
          <ChevronLeft
            size={17}
            strokeWidth={1.5}
          />

          BACK TO CHECKOUT
        </Link>

        <div>

          <p className="eyebrow">
            SECURE PAYMENT
          </p>

          <h1>
            PAYMENT
          </h1>

        </div>
      </section>

<<<<<<< Updated upstream
  <form
  className="payment-layout payment-layout-full"
  onSubmit={handlePayment}
>

  <section className="payment-summary payment-summary-full">

    {/* SUMMARY HEADER */}

    <div className="payment-summary-header">

      <p className="eyebrow">
        ORDER SUMMARY
      </p>

      <span>
        {checkoutItems.length} ITEMS
      </span>

    </div>

    {/* ITEMS */}

    <div className="payment-summary-items">

      {checkoutItems.map(
        (item, index) => (
          <div
            className="payment-summary-item"
            key={`${
              item.product_id ||
              item.id
            }-${
              item.variant_id ||
              item.size
            }-${index}`}
          >

            <div className="payment-summary-image">

              {item.image ? (
                <img
                  src={item.image}
                  alt={
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
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                  }}
                >
                  UNTKN
                </div>
              )}

              <span>
                {item.quantity}
              </span>

            </div>

            <div>

              <h3>
                {item.name ||
                  item.product_name ||
                  "UNTKN Product"}
              </h3>

              {item.color && (
                <p>
                  {item.color}
                </p>
              )}

              {item.size && (
                <span>
                  SIZE {item.size}
                </span>
              )}

            </div>

            <strong>
              ₹
              {formatMoney(
                Number(
                  item.unit_price ??
                    item.price ??
                    0
                ) *
                  Number(
                    item.quantity || 0
                  )
              )}
            </strong>

          </div>
        )
      )}

    </div>

    {/* TOTALS */}

    <div className="payment-totals">

      <div>

        <span>
          SUBTOTAL
        </span>

        <strong>
          ₹
          {formatMoney(
            calculatedSubtotal
          )}
        </strong>

      </div>

      <div>

        <span>
          SHIPPING
        </span>

        <strong>
          ₹
          {formatMoney(shipping)}
        </strong>

      </div>

      <div className="payment-divider"></div>

      <div className="payment-total">

        <span>
          TOTAL
        </span>

        <strong>
          ₹
          {formatMoney(total)}
        </strong>

      </div>

    </div>

    {/* ERROR */}

    {error && (
      <div className="payment-error">
        {error}
      </div>
    )}

    {/* PAYMENTS */}

    <section className="payment-actions">

      <button
        type="button"
        className="payment-action-button"
        onClick={(event) =>
          handlePayment(
            event,
            "upi"
          )
        }
        disabled={
          loading ||
          scriptLoading
        }
      >
        {loading
          ? "PROCESSING..."
          : scriptLoading
          ? "LOADING PAYMENT..."
          : "PAY NOW →"}
      </button>

      <button
        type="button"
        className="payment-action-button payment-cod-button"
        onClick={(event) =>
          handlePayment(
            event,
            "cod"
          )
        }
        disabled={loading}
      >
        {loading
          ? "PROCESSING..."
          : "CASH ON DELIVERY →"}
      </button>

    </section>

    {/* SECURITY */}

    <div className="payment-security">

      <ShieldCheck
        size={18}
        strokeWidth={1.3}
      />

      <div>

        <strong>
          YOUR PAYMENT IS SECURE
        </strong>

        <p>
          Payment details are securely
          processed by Razorpay. UNTKN
          does not store card information.
        </p>

      </div>

    </div>

    <p className="payment-note">
      By placing this order, you agree
      to our terms and conditions.
    </p>

  </section>

</form>
=======
      <form
        className="payment-layout payment-layout-full"
        onSubmit={handlePayment}
      >
        <section className="payment-summary payment-summary-full">
          <div className="payment-summary-header">
            <p className="eyebrow">
              ORDER SUMMARY
            </p>

            <span>
              {checkoutItems.length} ITEMS
            </span>
          </div>

          <div className="payment-summary-items">
            {checkoutItems.map(
              (item, index) => (
                <div
                  className="payment-summary-item"
                  key={`${
                    item.product_id ||
                    item.id
                  }-${
                    item.variant_id ||
                    item.size
                  }-${index}`}
                >
                  <div className="payment-summary-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={
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
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                        }}
                      >
                        UNTKN
                      </div>
                    )}

                    <span>
                      {item.quantity}
                    </span>
                  </div>

                  <div>
                    <h3>
                      {item.name ||
                        item.product_name ||
                        "UNTKN Product"}
                    </h3>

                    {item.color && (
                      <p>
                        {item.color}
                      </p>
                    )}

                    {item.size && (
                      <span>
                        SIZE {item.size}
                      </span>
                    )}
                  </div>

                  <strong>
                    ₹
                    {formatMoney(
                      Number(
                        item.unit_price ??
                          item.price ??
                          0
                      ) *
                        Number(
                          item.quantity || 0
                        )
                    )}
                  </strong>
                </div>
              )
            )}
          </div>

          <div className="payment-totals">
            <div>
              <span>
                SUBTOTAL
              </span>

              <strong>
                ₹
                {formatMoney(
                  calculatedSubtotal
                )}
              </strong>
            </div>

            <div>
              <span>
                SHIPPING
              </span>

              <strong>
                ₹
                {formatMoney(shipping)}
              </strong>
            </div>

            <div className="payment-divider"></div>

            <div className="payment-total">
              <span>
                TOTAL
              </span>

              <strong>
                ₹
                {formatMoney(total)}
              </strong>
            </div>
          </div>

          {error && (
            <div className="payment-error">
              {error}
            </div>
          )}

          <section className="payment-actions">
            <button
              type="button"
              className="payment-action-button"
              onClick={(event) =>
                handlePayment(
                  event,
                  "upi"
                )
              }
              disabled={
                loading ||
                scriptLoading
              }
            >
              {loading
                ? "PROCESSING..."
                : scriptLoading
                ? "LOADING PAYMENT..."
                : "PAY NOW →"}
            </button>

            <button
              type="button"
              className="payment-action-button payment-cod-button"
              onClick={(event) =>
                handlePayment(
                  event,
                  "cod"
                )
              }
              disabled={loading}
            >
              {loading
                ? "PROCESSING..."
                : "CASH ON DELIVERY →"}
            </button>
          </section>

          <div className="payment-security">
            <ShieldCheck
              size={18}
              strokeWidth={1.3}
            />

            <div>
              <strong>
                YOUR PAYMENT IS SECURE
              </strong>

              <p>
                Payment details are securely
                processed by Razorpay. UNTKN
                does not store card information.
              </p>
            </div>
          </div>

          <p className="payment-note">
            By placing this order, you agree
            to our terms and conditions.
          </p>
        </section>
      </form>
>>>>>>> Stashed changes
    </div>
  );
}

export default Payment;