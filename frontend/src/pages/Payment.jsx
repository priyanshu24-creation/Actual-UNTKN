import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  const value = String(imageUrl).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("blob:")) {
    return "";
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  const backendUrl = apiUrl.replace(
    /\/api\/?$/,
    ""
  );

  return `${backendUrl}${
    value.startsWith("/")
      ? value
      : `/${value}`
  }`;
}

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cartItems,
    subtotal,
  } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState("upi");

  const [loading, setLoading] =
    useState(false);

  const [scriptLoading, setScriptLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [authChecking, setAuthChecking] =
    useState(true);

  const [orderDetails, setOrderDetails] =
    useState(null);

  const [orderItems, setOrderItems] =
    useState([]);

  const [orderLoading, setOrderLoading] =
    useState(false);

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

        if (
          authError.response?.status === 401
        ) {
          navigate("/login", {
            replace: true,
            state: {
              redirectTo: "/payment",
            },
          });

          return;
        }

        console.error(
          "Payment authentication check failed:",
          authError
        );

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

  const checkoutData = useMemo(() => {
    if (location.state?.checkout) {
      return location.state.checkout;
    }

    try {
      const stored =
        sessionStorage.getItem(
          "untkn_checkout"
        );

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
    if (orderDetails) {
      return orderDetails;
    }

    if (location.state?.order) {
      return location.state.order;
    }

    return checkoutData?.order || null;
  }, [
    orderDetails,
    location.state,
    checkoutData,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadOrderDetails = async () => {
      if (!order?.id) {
        return;
      }

      try {
        setOrderLoading(true);

        const response = await api.get(
          `/orders/${Number(order.id)}`
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load order details."
          );
        }

        const backendOrder =
          response.data?.order;

        if (!backendOrder) {
          throw new Error(
            "Order details were not returned."
          );
        }

        const items =
          Array.isArray(
            backendOrder.items
          )
            ? backendOrder.items
            : [];

        const itemsWithImages =
          await Promise.all(
            items.map(async (item) => {
              let imageUrl =
                item.image_url ||
                item.image ||
                "";

              if (
                !imageUrl &&
                item.product_id
              ) {
                try {
                  const imageResponse =
                    await api.get(
                      `/products/${Number(
                        item.product_id
                      )}/images`
                    );

                  const images =
                    Array.isArray(
                      imageResponse
                        .data?.images
                    )
                      ? imageResponse.data
                          .images
                      : [];

                  const validImages =
                    images.filter(
                      (image) =>
                        image?.image_url &&
                        !String(
                          image.image_url
                        )
                          .toLowerCase()
                          .includes(
                            "example.com"
                          )
                    );

                  const primaryImage =
                    validImages.find(
                      (image) =>
                        Boolean(
                          image.is_primary
                        )
                    );

                  imageUrl =
                    primaryImage?.image_url ||
                    validImages[0]
                      ?.image_url ||
                    "";
                } catch (imageError) {
                  console.error(
                    `Failed to load image for product ${item.product_id}:`,
                    imageError
                  );
                }
              }

              return {
                ...item,

                id:
                  item.id ||
                  item.product_id,

                product_id:
                  item.product_id,

                variant_id:
                  item.variant_id ?? null,

                name:
                  item.product_name ||
                  item.name ||
                  "UNTKN Product",

                product_name:
                  item.product_name ||
                  item.name ||
                  "UNTKN Product",

                image:
                  imageUrl,

                image_url:
                  imageUrl,

                size:
                  item.size_name ||
                  item.size ||
                  "",

                color:
                  item.color_name ||
                  item.color ||
                  "",

                quantity:
                  Number(
                    item.quantity || 1
                  ),

                price:
                  Number(
                    item.unit_price ??
                      item.price ??
                      0
                  ),

                unit_price:
                  Number(
                    item.unit_price ??
                      item.price ??
                      0
                  ),
              };
            })
          );

        if (cancelled) {
          return;
        }

        setOrderDetails(
          backendOrder
        );

        setOrderItems(
          itemsWithImages
        );
      } catch (requestError) {
        console.error(
          "Payment order details error:",
          requestError
        );

        if (!cancelled) {
          setError(
            requestError.response
              ?.data?.message ||
              requestError.message ||
              "Unable to load order details."
          );
        }
      } finally {
        if (!cancelled) {
          setOrderLoading(false);
        }
      }
    };

    loadOrderDetails();

    return () => {
      cancelled = true;
    };
  }, [order?.id]);

  const checkoutItems = useMemo(() => {
    if (orderItems.length > 0) {
      return orderItems;
    }

    if (
      Array.isArray(cartItems) &&
      cartItems.length > 0
    ) {
      return cartItems.map((item) => ({
        ...item,

        name:
          item.name ||
          item.product_name ||
          "UNTKN Product",

        product_name:
          item.product_name ||
          item.name ||
          "UNTKN Product",

        image:
          item.image_url ||
          item.image ||
          "",

        image_url:
          item.image_url ||
          item.image ||
          "",

        unit_price:
          Number(
            item.unit_price ??
              item.price ??
              0
          ),

        price:
          Number(
            item.unit_price ??
              item.price ??
              0
          ),

        quantity:
          Number(
            item.quantity || 1
          ),
      }));
    }

    if (
      Array.isArray(order?.items) &&
      order.items.length > 0
    ) {
      return order.items.map(
        (item) => ({
          ...item,

          id:
            item.id ||
            item.product_id,

          product_id:
            item.product_id,

          variant_id:
            item.variant_id ?? null,

          name:
            item.product_name ||
            item.name ||
            "UNTKN Product",

          product_name:
            item.product_name ||
            item.name ||
            "UNTKN Product",

          image:
            item.image_url ||
            item.image ||
            "",

          image_url:
            item.image_url ||
            item.image ||
            "",

          size:
            item.size_name ||
            item.size ||
            "",

          color:
            item.color_name ||
            item.color ||
            "",

          quantity:
            Number(
              item.quantity || 1
            ),

          price:
            Number(
              item.unit_price ??
                item.price ??
                0
            ),

          unit_price:
            Number(
              item.unit_price ??
                item.price ??
                0
            ),
        })
      );
    }

    return [];
  }, [
    orderItems,
    cartItems,
    order,
  ]);

  const calculatedSubtotal =
    useMemo(() => {
      const backendSubtotal =
        Number(
          order?.subtotal ||
            order?.subtotal_amount ||
            0
        );

      if (
        backendSubtotal > 0
      ) {
        return backendSubtotal;
      }

      const checkoutSubtotal =
        Number(
          checkoutData?.subtotal ||
            0
        );

      if (
        checkoutSubtotal > 0
      ) {
        return checkoutSubtotal;
      }

      const cartSubtotal =
        Number(
          subtotal || 0
        );

      if (
        cartSubtotal > 0
      ) {
        return cartSubtotal;
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
    }, [
      order,
      checkoutData,
      subtotal,
      checkoutItems,
    ]);

  const shipping =
    Number(
      order?.shipping_fee ??
        order?.shipping_amount ??
        checkoutData?.shippingFee ??
        100
    );

  const discount = Number(
    order?.discount_amount ??
      order?.discount ??
      checkoutData?.discount ??
      0
  );

  const couponCode =
    order?.coupon_code ||
    checkoutData?.couponCode ||
    checkoutData?.coupon?.code ||
    null;

  const backendTotal = Number(
    order?.total_amount ||
      order?.total ||
      0
  );

  const calculatedTotal =
    Math.max(
      calculatedSubtotal +
        shipping -
        discount,
      0
    );

  const total =
    backendTotal > 0
      ? backendTotal
      : calculatedTotal;

  useEffect(() => {
    if (window.Razorpay) {
      setScriptLoading(false);
      return;
    }

    const scriptSelector =
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]';

    const existingScript =
      document.querySelector(
        scriptSelector
      );

    if (existingScript) {
      const handleLoad = () => {
        setScriptLoading(false);
      };

      const handleError = () => {
        setScriptLoading(false);

        setError(
          "Failed to load Razorpay Checkout."
        );
      };

      existingScript.addEventListener(
        "load",
        handleLoad
      );

      existingScript.addEventListener(
        "error",
        handleError
      );

      return () => {
        existingScript.removeEventListener(
          "load",
          handleLoad
        );

        existingScript.removeEventListener(
          "error",
          handleError
        );
      };
    }

    const script =
      document.createElement(
        "script"
      );

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

    document.body.appendChild(
      script
    );

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const formatMoney = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-IN"
    );
  };

  const handlePayment = async (
    event,
    selectedMethod = paymentMethod
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setPaymentMethod(
      selectedMethod
    );

    setError("");

    try {
      await api.get(
        "/auth/me"
      );
    } catch (authError) {
      if (
        authError.response?.status ===
        401
      ) {
        navigate("/login", {
          replace: true,
          state: {
            redirectTo: "/payment",
          },
        });

        return;
      }

      setError(
        authError.response
          ?.data?.message ||
          "Unable to verify your account. Please try again."
      );

      return;
    }

    if (!order?.id) {
      setError(
        "Order information is missing. Please return to checkout and try again."
      );

      return;
    }

    if (selectedMethod === "cod") {
      try {
        setLoading(true);

        sessionStorage.removeItem(
          "untkn_checkout"
        );

        navigate(
          "/order-success",
          {
            replace: true,

            state: {
              order,
              paymentMethod:
                "cod",
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

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to create Razorpay order."
        );
      }

      const paymentData =
        response.data?.payment;

      if (!paymentData) {
        throw new Error(
          "Payment information was not returned by the backend."
        );
      }

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
        checkoutData?.customer ||
        {};

      const customerName =
        `${customer.firstName || ""} ${
          customer.lastName || ""
        }`.trim();

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

          coupon_code:
            couponCode ||
            "",
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

              const verifyResponse =
                await api.post(
                  "/payments/verify",
                  {
                    order_id:
                      Number(
                        order.id
                      ),

                    razorpay_order_id:
                      razorpayResponse.razorpay_order_id,

                    razorpay_payment_id:
                      razorpayResponse.razorpay_payment_id,

                    razorpay_signature:
                      razorpayResponse.razorpay_signature,
                  }
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
                      selectedMethod,
                  },
                }
              );
            } catch (
              verifyError
            ) {
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

      const razorpay =
        new window.Razorpay(
          options
        );

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

      razorpay.open();

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

  if (authChecking) {
    return (
      <div className="payment-empty">
        <p className="eyebrow">
          SECURE PAYMENT
        </p>

        <h1>
          VERIFYING
          <br />
          ACCOUNT.
        </h1>

        <p>
          Please wait while we
          verify your account.
        </p>
      </div>
    );
  }

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
          Your checkout session
          could not be found.
          Please return to checkout
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
              {checkoutItems.reduce(
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

          <div className="payment-summary-items">
            {orderLoading &&
            checkoutItems.length ===
              0 ? (
              <div
                style={{
                  padding:
                    "30px 0",
                  textAlign:
                    "center",
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.08em",
                }}
              >
                LOADING ORDER...
              </div>
            ) : (
              checkoutItems.map(
                (item, index) => {
                  const rawImage =
                    item.image_url ||
                    item.image ||
                    "";

                  const imageUrl =
                    getImageUrl(
                      rawImage
                    );

                  const itemPrice =
                    Number(
                      item.unit_price ??
                        item.price ??
                        0
                    );

                  const quantity =
                    Number(
                      item.quantity ||
                        0
                    );

                  const itemTotal =
                    itemPrice *
                    quantity;

                  return (
                    <div
                      className="payment-summary-item"
                      key={`${item.product_id || item.id}-${item.variant_id || item.size || ""}-${index}`}
                    >
                      <div className="payment-summary-image">
                        {imageUrl ? (
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              item.name ||
                              item.product_name ||
                              "UNTKN Product"
                            }
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";

                              const parent =
                                event.currentTarget.parentElement;

                              if (
                                parent &&
                                !parent.querySelector(
                                  ".payment-image-fallback"
                                )
                              ) {
                                const fallback =
                                  document.createElement(
                                    "div"
                                  );

                                fallback.className =
                                  "payment-image-fallback";

                                fallback.textContent =
                                  "UNTKN";

                                fallback.style.width =
                                  "100%";

                                fallback.style.height =
                                  "100%";

                                fallback.style.display =
                                  "flex";

                                fallback.style.alignItems =
                                  "center";

                                fallback.style.justifyContent =
                                  "center";

                                fallback.style.fontSize =
                                  "10px";

                                fallback.style.letterSpacing =
                                  "0.08em";

                                parent.insertBefore(
                                  fallback,
                                  parent.firstChild
                                );
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="payment-image-fallback"
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
                              letterSpacing:
                                "0.08em",
                            }}
                          >
                            UNTKN
                          </div>
                        )}

                        <span>
                          {
                            item.quantity
                          }
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
                            {
                              item.color
                            }
                          </p>
                        )}

                        {item.size && (
                          <span>
                            SIZE{" "}
                            {
                              item.size
                            }
                          </span>
                        )}
                      </div>

                      <strong>
                        ₹
                        {formatMoney(
                          itemTotal
                        )}
                      </strong>
                    </div>
                  );
                }
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

            {discount > 0 && (
              <div>
                <span>
                  DISCOUNT
                  {couponCode
                    ? ` (${couponCode})`
                    : ""}
                </span>

                <strong
                  style={{
                    color:
                      "#16803c",
                  }}
                >
                  -₹
                  {formatMoney(
                    discount
                  )}
                </strong>
              </div>
            )}

            <div>
              <span>
                SHIPPING
              </span>

              <strong>
                {shipping === 0
                  ? "FREE"
                  : `₹${formatMoney(
                      shipping
                    )}`}
              </strong>
            </div>

            <div className="payment-divider" />

            <div className="payment-total">
              <span>
                TOTAL
              </span>

              <strong>
                ₹
                {formatMoney(
                  total
                )}
              </strong>
            </div>
          </div>

          {couponCode &&
            discount > 0 && (
              <div
                style={{
                  marginTop:
                    "18px",
                  padding:
                    "13px 15px",
                  border:
                    "1px solid #d7e6da",
                  background:
                    "#f5faf6",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "15px",
                }}
              >
                <div>
                  <span
                    style={{
                      display:
                        "block",
                      fontSize:
                        "10px",
                      letterSpacing:
                        "0.1em",
                      fontWeight:
                        600,
                    }}
                  >
                    COUPON APPLIED
                  </span>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      fontSize:
                        "13px",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    {couponCode}
                  </strong>
                </div>

                <span
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#16803c",
                    fontWeight:
                      600,
                  }}
                >
                  YOU SAVED ₹
                  {formatMoney(
                    discount
                  )}
                </span>
              </div>
            )}

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
                scriptLoading ||
                orderLoading
              }
            >
              {loading
                ? "PROCESSING..."
                : scriptLoading
                ? "LOADING PAYMENT..."
                : `PAY ₹${formatMoney(
                    total
                  )} →`}
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
              disabled={
                loading ||
                orderLoading
              }
            >
              {loading
                ? "PROCESSING..."
                : `CASH ON DELIVERY ₹${formatMoney(
                    total
                  )} →`}
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
                Payment details are
                securely processed
                by Razorpay. UNTKN
                does not store card
                information.
              </p>
            </div>
          </div>

          <p className="payment-note">
            By placing this order,
            you agree to our terms
            and conditions.
          </p>
        </section>
      </form>
    </div>
  );
}

export default Payment;