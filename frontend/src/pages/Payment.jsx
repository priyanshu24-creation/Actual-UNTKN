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

  const [paymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [resolvedItems, setResolvedItems] = useState([]);

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
              redirectTo: "/payment",
            },
          });
          return;
        }

        console.error("Payment authentication check failed:", authError);

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
          item.name ||
          "UNTKN Product",
        product_name:
          item.product_name ||
          item.name ||
          "UNTKN Product",
        image:
          item.image ||
          item.image_url ||
          item.product_image ||
          item.product_image_url ||
          "",
        image_url:
          item.image_url ||
          item.image ||
          item.product_image ||
          item.product_image_url ||
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
          Number(item.quantity || 1),
        price:
          Number(item.unit_price || item.price || 0),
        unit_price:
          Number(item.unit_price || item.price || 0),
      }));
    }

    return [];
  }, [cartItems, order]);

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (typeof image === "string") {
      return image.trim();
    }

    if (typeof image === "object") {
      return (
        image.image_url ||
        image.imageUrl ||
        image.secure_url ||
        image.secureUrl ||
        image.product_image ||
        image.productImage ||
        image.url ||
        ""
      );
    }

    return "";
  };

  const normalizeImageUrl = (image) => {
    const imageUrl = getImageUrl(image);

    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("blob:") ||
      imageUrl.startsWith("data:")
    ) {
      return "";
    }

    if (
      imageUrl.startsWith("http://localhost") ||
      imageUrl.startsWith("http://127.0.0.1") ||
      imageUrl.startsWith("https://localhost") ||
      imageUrl.startsWith("https://127.0.0.1")
    ) {
      return "";
    }

    if (imageUrl.startsWith("//")) {
      return `${window.location.protocol}${imageUrl}`;
    }

    if (imageUrl.startsWith("/")) {
      return imageUrl;
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `/${imageUrl.replace(/^\/+/, "")}`;
  };

  const getProductId = (item) => {
    const value =
      item?.product_id ??
      item?.productId ??
      item?.product?.id ??
      item?.id;

    const numericValue = Number(value);

    return Number.isInteger(numericValue) && numericValue > 0
      ? numericValue
      : null;
  };

  const getExistingItemImage = (item) => {
    const possibleImages = [
      item?.image,
      item?.image_url,
      item?.imageUrl,
      item?.product_image,
      item?.productImage,
      item?.product_image_url,
      item?.product?.image,
      item?.product?.image_url,
      item?.product?.imageUrl,
      item?.product?.product_image,
      item?.product?.product_image_url,
    ];

    for (const image of possibleImages) {
      const normalized = normalizeImageUrl(image);

      if (normalized) {
        return normalized;
      }
    }

    return "";
  };

  useEffect(() => {
    let mounted = true;

    const loadPaymentImages = async () => {
      if (!checkoutItems.length) {
        if (mounted) {
          setResolvedItems([]);
        }
        return;
      }

      const items = checkoutItems.map((item) => ({
        ...item,
        resolvedImage: getExistingItemImage(item),
      }));

      const missingItems = items.filter(
        (item) => !item.resolvedImage
      );

      if (missingItems.length === 0) {
        if (mounted) {
          setResolvedItems(items);
        }
        return;
      }

      const uniqueProductIds = [
        ...new Set(
          missingItems
            .map((item) => getProductId(item))
            .filter(Boolean)
        ),
      ];

      const imageMap = new Map();

      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const response = await api.get(
              `/products/${productId}/images`
            );

            const data = response.data;

            const images = Array.isArray(data)
              ? data
              : Array.isArray(data?.images)
              ? data.images
              : Array.isArray(data?.productImages)
              ? data.productImages
              : [];

            const normalizedImages = images
              .map((image) => normalizeImageUrl(image))
              .filter(Boolean);

            if (normalizedImages.length > 0) {
              imageMap.set(
                productId,
                normalizedImages[0]
              );
            }
          } catch (imageError) {
            console.error(
              `Failed to load payment image for product ${productId}:`,
              imageError
            );
          }
        })
      );

      const finalItems = items.map((item) => {
        if (item.resolvedImage) {
          return item;
        }

        const productId = getProductId(item);

        return {
          ...item,
          resolvedImage:
            imageMap.get(productId) || "",
        };
      });

      if (mounted) {
        setResolvedItems(finalItems);
      }
    };

    loadPaymentImages();

    return () => {
      mounted = false;
    };
  }, [checkoutItems]);

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
          Number(item.quantity || 0),
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

  const handlePayment = async (
    event,
    selectedMethod = paymentMethod
  ) => {
    event.preventDefault();

    setError("");

    try {
      await api.get("/auth/me");
    } catch (authError) {
      if (authError.response?.status === 401) {
        navigate("/login", {
          replace: true,
          state: {
            redirectTo: "/payment",
          },
        });

        return;
      }

      setError(
        authError.response?.data?.message ||
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
              paymentMethod: "cod",
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
        checkoutData?.customer || {};

      const customerName =
        `${customer.firstName || ""} ${
          customer.lastName || ""
        }`.trim();

      const options = {
        key: razorpayKey,
        amount: razorpayAmount,
        currency: razorpayCurrency,
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

  const handleImageError = (event) => {
    const imageElement =
      event.currentTarget;

    const fallback =
      imageElement.dataset.fallback;

    if (
      fallback &&
      imageElement.src !== fallback
    ) {
      imageElement.src = fallback;
      return;
    }

    imageElement.style.display = "none";

    const parent =
      imageElement.parentElement;

    if (
      parent &&
      !parent.querySelector(
        ".payment-image-fallback"
      )
    ) {
      const fallbackElement =
        document.createElement("div");

      fallbackElement.className =
        "payment-image-fallback";

      fallbackElement.textContent =
        "UNTKN";

      fallbackElement.style.width =
        "100%";

      fallbackElement.style.height =
        "100%";

      fallbackElement.style.display =
        "flex";

      fallbackElement.style.alignItems =
        "center";

      fallbackElement.style.justifyContent =
        "center";

      fallbackElement.style.fontSize =
        "10px";

      parent.appendChild(
        fallbackElement
      );
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
          Please wait while we verify your account.
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
              (item, index) => {
                const resolvedItem =
                  resolvedItems[index] ||
                  item;

                const image =
                  resolvedItem.resolvedImage ||
                  getExistingItemImage(
                    resolvedItem
                  );

                const productName =
                  resolvedItem.name ||
                  resolvedItem.product_name ||
                  "UNTKN Product";

                const quantity =
                  Number(
                    resolvedItem.quantity ||
                      1
                  );

                const price =
                  Number(
                    resolvedItem.unit_price ??
                      resolvedItem.price ??
                      0
                  );

                return (
                  <div
                    className="payment-summary-item"
                    key={`${
                      resolvedItem.product_id ||
                      resolvedItem.id
                    }-${
                      resolvedItem.variant_id ||
                      resolvedItem.size
                    }-${index}`}
                  >
                    <div className="payment-summary-image">
                      {image ? (
                        <img
                          src={image}
                          alt={productName}
                          loading="eager"
                          decoding="async"
                          onError={
                            handleImageError
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
                          }}
                        >
                          UNTKN
                        </div>
                      )}

                      <span>
                        {quantity}
                      </span>
                    </div>

                    <div>
                      <h3>
                        {productName}
                      </h3>

                      {resolvedItem.color && (
                        <p>
                          {resolvedItem.color}
                        </p>
                      )}

                      {resolvedItem.size && (
                        <span>
                          SIZE{" "}
                          {resolvedItem.size}
                        </span>
                      )}
                    </div>

                    <strong>
                      ₹
                      {formatMoney(
                        price *
                          quantity
                      )}
                    </strong>
                  </div>
                );
              }
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
    </div>
  );
}

export default Payment;