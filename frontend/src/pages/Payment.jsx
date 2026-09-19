import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CreditCard,
  Smartphone,
  Landmark,
  Banknote,
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

  /*
  |--------------------------------------------------------------------------
  | GET CHECKOUT DATA
  |--------------------------------------------------------------------------
  */

  const checkoutData = useMemo(() => {
    if (location.state?.checkout) {
      return location.state.checkout;
    }

    try {
      const stored =
        sessionStorage.getItem("untkn_checkout");

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

  /*
  |--------------------------------------------------------------------------
  | ITEMS
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | TOTALS
  |--------------------------------------------------------------------------
  */

  const calculatedSubtotal = useMemo(() => {
    if (
      Number(subtotal || 0) > 0
    ) {
      return Number(subtotal);
    }

    if (
      Number(order?.subtotal || 0) > 0
    ) {
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

  const shipping =
    Number(
      order?.shipping_fee ??
        checkoutData?.shippingFee ??
        100
    );

  const backendTotal =
    Number(
      order?.total_amount || 0
    );

  const frontendTotal =
    calculatedSubtotal + shipping;

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  | The backend amount is the authoritative payment amount.
  */

  const total =
    backendTotal > 0
      ? backendTotal
      : frontendTotal;

  /*
  |--------------------------------------------------------------------------
  | LOAD RAZORPAY CHECKOUT SCRIPT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      window.Razorpay
    ) {
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

  /*
  |--------------------------------------------------------------------------
  | FORMAT MONEY
  |--------------------------------------------------------------------------
  */

  const formatMoney = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString("en-IN");
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE PAYMENT
  |--------------------------------------------------------------------------
  */

  const handlePayment = async (event) => {
    event.preventDefault();

    setError("");

    /*
    |--------------------------------------------------------------------------
    | CHECK ORDER
    |--------------------------------------------------------------------------
    */

    if (!order?.id) {
      setError(
        "Order information is missing. Please return to checkout and try again."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | COD
    |--------------------------------------------------------------------------
    */

    if (
      paymentMethod === "cod"
    ) {
      sessionStorage.removeItem(
        "untkn_checkout"
      );

      navigate(
        "/order-success",
        {
          state: {
            order,
            paymentMethod: "cod",
          },
        }
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK RAZORPAY SCRIPT
    |--------------------------------------------------------------------------
    */

    if (
      scriptLoading ||
      !window.Razorpay
    ) {
      setError(
        "Razorpay Checkout is still loading. Please try again."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | START PAYMENT
    |--------------------------------------------------------------------------
    */

    try {
      setLoading(true);

      /*
      |--------------------------------------------------------------------------
      | CREATE RAZORPAY ORDER
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | YOUR BACKEND RETURNS:
      |
      | response.data.payment
      |--------------------------------------------------------------------------
      */

      const paymentData =
        response.data?.payment;

      if (!paymentData) {
        throw new Error(
          "Payment information was not returned by the backend."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | GET RAZORPAY VALUES
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | VALIDATE RAZORPAY DATA
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | CUSTOMER DATA
      |--------------------------------------------------------------------------
      */

      const customer =
        checkoutData?.customer || {};

      const customerName =
        `${customer.firstName || ""} ${
          customer.lastName || ""
        }`.trim();

      /*
      |--------------------------------------------------------------------------
      | RAZORPAY OPTIONS
      |--------------------------------------------------------------------------
      */

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
            customer.email ||
            "",

          contact:
            customer.phone ||
            "",
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

              /*
              |--------------------------------------------------------------------------
              | VERIFY PAYMENT ON BACKEND
              |--------------------------------------------------------------------------
              */

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
                !verifyResponse.data
                  ?.success
              ) {
                throw new Error(
                  verifyResponse.data
                    ?.message ||
                    "Payment verification failed."
                );
              }

              /*
              |--------------------------------------------------------------------------
              | PAYMENT SUCCESS
              |--------------------------------------------------------------------------
              */

              sessionStorage.removeItem(
                "untkn_checkout"
              );

              navigate(
                "/order-success",
                {
                  replace: true,

                  state: {
                    order:
                      verifyResponse
                        .data
                        ?.order ||
                      order,

                    payment:
                      verifyResponse
                        .data
                        ?.payment,

                    paymentMethod:
                      paymentMethod,
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

      /*
      |--------------------------------------------------------------------------
      | OPEN RAZORPAY
      |--------------------------------------------------------------------------
      */

      const razorpay =
        new window.Razorpay(
          options
        );

      /*
      |--------------------------------------------------------------------------
      | PAYMENT FAILED EVENT
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | OPEN CHECKOUT
      |--------------------------------------------------------------------------
      */

      razorpay.open();

      /*
      |--------------------------------------------------------------------------
      | Allow Razorpay modal to control the UI.
      |--------------------------------------------------------------------------
      */

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

  /*
  |--------------------------------------------------------------------------
  | EMPTY / MISSING ORDER
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="payment-page">

      {/* HEADER */}

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

      {/* PAYMENT FORM */}

      <form
        className="payment-layout"
        onSubmit={handlePayment}
      >

        {/* MAIN */}

        <main className="payment-main">

          {/* ERROR */}

          {error && (
            <div
              className="payment-error"
              style={{
                border:
                  "1px solid #000",
                padding: "16px",
                marginBottom: "30px",
                fontSize: "13px",
                lineHeight: "1.5",
                background:
                  "#fff",
              }}
            >
              {error}
            </div>
          )}

          {/* PAYMENT METHODS */}

          <section className="payment-method-section">

            <div className="payment-section-header">

              <div>

                <p className="eyebrow">
                  SELECT METHOD
                </p>

                <h2>
                  PAYMENT OPTIONS
                </h2>

              </div>

              <ShieldCheck
                size={21}
                strokeWidth={1.2}
              />

            </div>

            <div className="payment-methods">

              {/* UPI */}

              <button
                type="button"
                className={
                  paymentMethod === "upi"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "upi"
                  )
                }
              >

                <Smartphone
                  size={19}
                  strokeWidth={1.3}
                />

                <div>
                  <strong>
                    UPI
                  </strong>

                  <span>
                    Google Pay, PhonePe,
                    Paytm
                  </span>
                </div>

                <span className="payment-radio">
                  {paymentMethod ===
                    "upi" && "✓"}
                </span>

              </button>

              {/* CARD */}

              <button
                type="button"
                className={
                  paymentMethod === "card"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "card"
                  )
                }
              >

                <CreditCard
                  size={19}
                  strokeWidth={1.3}
                />

                <div>
                  <strong>
                    CARD
                  </strong>

                  <span>
                    Credit or debit card
                  </span>
                </div>

                <span className="payment-radio">
                  {paymentMethod ===
                    "card" && "✓"}
                </span>

              </button>

              {/* NET BANKING */}

              <button
                type="button"
                className={
                  paymentMethod ===
                  "netbanking"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "netbanking"
                  )
                }
              >

                <Landmark
                  size={19}
                  strokeWidth={1.3}
                />

                <div>
                  <strong>
                    NET BANKING
                  </strong>

                  <span>
                    Pay through your bank
                  </span>
                </div>

                <span className="payment-radio">
                  {paymentMethod ===
                    "netbanking" &&
                    "✓"}
                </span>

              </button>

              {/* COD */}

              <button
                type="button"
                className={
                  paymentMethod ===
                  "cod"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "cod"
                  )
                }
              >

                <Banknote
                  size={19}
                  strokeWidth={1.3}
                />

                <div>
                  <strong>
                    CASH ON DELIVERY
                  </strong>

                  <span>
                    Pay when your order
                    arrives
                  </span>
                </div>

                <span className="payment-radio">
                  {paymentMethod ===
                    "cod" && "✓"}
                </span>

              </button>

            </div>

          </section>

          {/* UPI INFORMATION */}

          {paymentMethod === "upi" && (
            <section
              className="payment-form-section"
            >

              <div className="payment-form-heading">

                <p className="eyebrow">
                  UPI PAYMENT
                </p>

                <h2>
                  RAZORPAY CHECKOUT
                </h2>

              </div>

              <p className="payment-helper">
                Click PAY NOW below. Razorpay
                will securely open its checkout
                window where you can complete
                the payment using UPI.
              </p>

            </section>
          )}

          {/* CARD INFORMATION */}

          {paymentMethod === "card" && (
            <section
              className="payment-form-section"
            >

              <div className="payment-form-heading">

                <p className="eyebrow">
                  CARD PAYMENT
                </p>

                <h2>
                  RAZORPAY CHECKOUT
                </h2>

              </div>

              <p className="payment-helper">
                Your card details will be
                entered securely inside Razorpay
                Checkout. UNTKN does not store
                your card information.
              </p>

            </section>
          )}

          {/* NET BANKING */}

          {paymentMethod ===
            "netbanking" && (
            <section
              className="payment-form-section"
            >

              <div className="payment-form-heading">

                <p className="eyebrow">
                  NET BANKING
                </p>

                <h2>
                  RAZORPAY CHECKOUT
                </h2>

              </div>

              <p className="payment-helper">
                Click PAY NOW below and select
                your bank from Razorpay Checkout.
              </p>

            </section>
          )}

          {/* COD */}

          {paymentMethod === "cod" && (
            <section
              className="payment-form-section cod-section"
            >

              <Banknote
                size={28}
                strokeWidth={1.2}
              />

              <p className="eyebrow">
                CASH ON DELIVERY
              </p>

              <h2>
                PAY WHEN IT ARRIVES.
              </h2>

              <p>
                Pay the delivery partner in
                cash when your order reaches
                you.
              </p>

            </section>
          )}

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

        </main>

        {/* SUMMARY */}

        <aside className="payment-summary">

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
                  key={`${item.product_id || item.id}-${item.variant_id || item.size}-${index}`}
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
                          width:
                            "100%",
                          height:
                            "100%",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize:
                            "10px",
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
                        SIZE{" "}
                        {item.size}
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
                          item.quantity ||
                            0
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
                {formatMoney(
                  shipping
                )}
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

          {/* PAY BUTTON */}

          <button
            type="submit"
            className="place-order-button"
            disabled={
              loading ||
              scriptLoading
            }
            style={{
              opacity:
                loading ||
                scriptLoading
                  ? 0.6
                  : 1,
              cursor:
                loading ||
                scriptLoading
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            {loading
              ? "PROCESSING..."
              : scriptLoading
              ? "LOADING PAYMENT..."
              : paymentMethod ===
                "cod"
              ? "PLACE ORDER →"
              : "PAY NOW →"}

          </button>

          <p className="payment-note">
            By placing this order, you
            agree to our terms and
            conditions.
          </p>

        </aside>

      </form>

    </div>
  );
}

export default Payment;