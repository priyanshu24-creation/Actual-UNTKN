import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

function getValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function normalizeStatus(value) {
  const status = String(value || "Processing").trim();

  const map = {
    pending: "Processing",
    processing: "Processing",
    confirmed: "Processing",
    paid: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    failed: "Cancelled",
  };

  return map[status.toLowerCase()] || status;
}

function getOrderPayload(response) {
  const data = response?.data;

  return (
    data?.order ||
    data?.data?.order ||
    data?.data ||
    data?.result?.order ||
    data?.result ||
    null
  );
}

function getOrderItems(order) {
  const items =
    order?.items ||
    order?.order_items ||
    order?.orderItems ||
    order?.products ||
    [];

  if (Array.isArray(items) && items.length > 0) {
    return items;
  }

  return [
    {
      id: order?.product_id || order?.productId || order?.id,
      product_id: order?.product_id || order?.productId,
      product_name:
        order?.product_name ||
        order?.productName ||
        order?.product ||
        "Product",
      name:
        order?.product_name ||
        order?.productName ||
        order?.product ||
        "Product",
      size: order?.size || order?.size_name || order?.sizeName,
      quantity: order?.quantity || 1,
      price:
        order?.item_price ||
        order?.unit_price ||
        order?.unitPrice ||
        order?.price ||
        order?.amount ||
        0,
      total:
        order?.item_total ||
        order?.line_total ||
        order?.lineTotal ||
        order?.amount ||
        0,
      image:
        order?.image_url ||
        order?.imageUrl ||
        order?.product_image ||
        order?.productImage ||
        order?.image ||
        "",
    },
  ];
}

function normalizeOrder(raw) {
  if (!raw) return null;

  const customerObject =
    raw.customer && typeof raw.customer === "object"
      ? raw.customer
      : raw.user && typeof raw.user === "object"
        ? raw.user
        : {};

  const shipping =
    raw.shipping_address ||
    raw.shippingAddress ||
    raw.address ||
    raw.delivery_address ||
    raw.deliveryAddress ||
    {};

  const billing =
    raw.billing_address ||
    raw.billingAddress ||
    {};

  const items = getOrderItems(raw);

  const totalAmount = Number(
    getValue(
      raw.total_amount,
      raw.totalAmount,
      raw.grand_total,
      raw.grandTotal,
      raw.order_total,
      raw.orderTotal,
      raw.total,
      raw.amount,
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            getValue(
              item.total,
              item.line_total,
              item.lineTotal,
              Number(item.price || 0) * Number(item.quantity || 1)
            ) || 0
          ),
        0
      )
    ) || 0
  );

  const subtotal = Number(
    getValue(
      raw.subtotal,
      raw.sub_total,
      raw.subTotal,
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            getValue(
              item.total,
              item.line_total,
              item.lineTotal,
              Number(item.price || 0) * Number(item.quantity || 1)
            ) || 0
          ),
        0
      )
    ) || 0
  );

  const shippingCost = Number(
    getValue(
      raw.shipping_amount,
      raw.shippingAmount,
      raw.delivery_fee,
      raw.deliveryFee,
      raw.shipping_cost,
      raw.shippingCost,
      0
    ) || 0
  );

  const discount = Number(
    getValue(
      raw.discount_amount,
      raw.discountAmount,
      raw.discount,
      0
    ) || 0
  );

  return {
    ...raw,

    id: getValue(
      raw.id,
      raw.order_id,
      raw.orderId,
      raw.order_number,
      raw.orderNumber
    ),

    orderNumber: getValue(
      raw.order_number,
      raw.orderNumber,
      raw.id,
      raw.order_id,
      raw.orderId
    ),

    customer: getValue(
      raw.customer_name,
      raw.customerName,
      raw.shipping_name,
      raw.shippingName,
      raw.name,
      customerObject.name,
      customerObject.full_name,
      customerObject.fullName,
      "Customer"
    ),

    email: getValue(
      raw.customer_email,
      raw.customerEmail,
      raw.email,
      customerObject.email,
      "—"
    ),

    phone: getValue(
      raw.customer_phone,
      raw.customerPhone,
      raw.phone,
      raw.mobile,
      customerObject.phone,
      customerObject.mobile,
      "—"
    ),

    date: formatDate(
      getValue(
        raw.created_at,
        raw.createdAt,
        raw.order_date,
        raw.orderDate,
        raw.date
      )
    ),

    status: normalizeStatus(
      getValue(
        raw.order_status,
        raw.orderStatus,
        raw.status,
        raw.fulfillment_status,
        raw.fulfillmentStatus
      )
    ),

    payment:
      getValue(
        raw.payment_status,
        raw.paymentStatus,
        raw.payment,
        raw.payment_status_name
      ) || "—",

    paymentMethod:
      getValue(
        raw.payment_method,
        raw.paymentMethod,
        raw.method
      ) || "—",

    items,
    subtotal,
    shippingCost,
    discount,
    totalAmount,

    address: {
      name: getValue(
        shipping.name,
        shipping.full_name,
        shipping.fullName,
        shipping.customer_name,
        shipping.customerName,
        raw.shipping_name,
        raw.shippingName,
        raw.customer_name,
        raw.customerName,
        raw.name,
        customerObject.name,
        "Customer"
      ),

      line1: getValue(
        shipping.line1,
        shipping.address_line1,
        shipping.addressLine1,
        shipping.address,
        shipping.street,
        shipping.street_address,
        shipping.streetAddress
      ),

      line2: getValue(
        shipping.line2,
        shipping.address_line2,
        shipping.addressLine2,
        shipping.landmark
      ),

      city: getValue(
        shipping.city,
        shipping.town
      ),

      state: getValue(
        shipping.state,
        shipping.state_name,
        shipping.stateName
      ),

      pincode: getValue(
        shipping.pincode,
        shipping.pin_code,
        shipping.pinCode,
        shipping.postal_code,
        shipping.postalCode,
        shipping.zip
      ),

      country: getValue(
        shipping.country,
        "India"
      ),
    },

    billing,
  };
}

function AdminOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("Processing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await api.get(
          `/orders/${encodeURIComponent(id)}`
        );

        if (!mounted) return;

        const rawOrder = getOrderPayload(response);

        if (!rawOrder) {
          throw new Error("Order was not found.");
        }

        const normalized = normalizeOrder(rawOrder);

        setOrder(normalized);
        setOrderStatus(normalized.status || "Processing");
      } catch (requestError) {
        if (!mounted) return;

        console.error("Failed to load order:", requestError);

        setOrder(null);
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Failed to load order."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [id]);

  const items = useMemo(
    () => (order ? getOrderItems(order) : []),
    [order]
  );

  const handleStatusChange = (event) => {
    setOrderStatus(event.target.value);
    setSuccess("");
    setError("");
  };

  const handleUpdateStatus = async () => {
    if (!order?.id || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/orders/admin/${encodeURIComponent(order.id)}/status`,
        {
          status: orderStatus,
        }
      );

      const updatedOrder = getOrderPayload(response);

      if (updatedOrder) {
        const normalized = normalizeOrder(updatedOrder);

        setOrder(normalized);
        setOrderStatus(normalized.status || orderStatus);
      } else {
        setOrder((current) =>
          current
            ? {
                ...current,
                status: orderStatus,
              }
            : current
        );
      }

      setSuccess("Order status updated successfully.");
    } catch (requestError) {
      console.error("Failed to update order status:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to update order status."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-order-not-found">
        <p className="admin-page-eyebrow">SALES</p>
        <h1>Loading Order</h1>
        <p>Fetching order information from the database.</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="admin-order-not-found">
        <p className="admin-page-eyebrow">SALES</p>

        <h1>Order Not Found</h1>

        <p>
          {error || "The order you're looking for does not exist."}
        </p>

        <Link
          to="/admin/orders"
          className="admin-primary-button"
        >
          <ArrowLeft size={17} />
          Back to Orders
        </Link>
      </section>
    );
  }

  return (
    <section className="admin-order-details-page">
      <div className="admin-order-details-header">
        <div>
          <Link
            to="/admin/orders"
            className="admin-back-link"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>

          <p className="admin-page-eyebrow">
            ORDER DETAILS
          </p>

          <div className="admin-order-title-row">
            <h1>#{order.orderNumber}</h1>

            <span
              className={`admin-order-status ${String(
                orderStatus
              ).toLowerCase()}`}
            >
              {orderStatus}
            </span>
          </div>

          <p>Placed on {order.date}</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border: "1px solid #e5caca",
            background: "#fff7f7",
            color: "#a33",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border: "1px solid #cfe4d2",
            background: "#f5fbf6",
            color: "#286b35",
          }}
        >
          {success}
        </div>
      )}

      <div className="admin-order-details-grid">
        <div className="admin-order-details-main">
          <div className="admin-order-details-panel">
            <div className="admin-details-panel-header">
              <div>
                <h2>Order Items</h2>
                <span>Products in this order</span>
              </div>

              <Package
                size={20}
                strokeWidth={1.5}
              />
            </div>

            {items.length === 0 ? (
              <div className="admin-table-empty">
                No items found for this order.
              </div>
            ) : (
              items.map((item, index) => {
                const productName = getValue(
                  item.product_name,
                  item.productName,
                  item.name,
                  item.product?.name,
                  item.product?.title,
                  "Product"
                );

                const size = getValue(
                  item.size_name,
                  item.sizeName,
                  item.size,
                  item.variant?.size?.name,
                  item.variant?.size_name
                );

                const quantity = Number(
                  getValue(
                    item.quantity,
                    item.qty,
                    1
                  )
                );

                const itemTotal = Number(
                  getValue(
                    item.total,
                    item.line_total,
                    item.lineTotal,
                    item.amount,
                    Number(
                      getValue(
                        item.price,
                        item.unit_price,
                        item.unitPrice,
                        0
                      )
                    ) * quantity
                  ) || 0
                );

                const image = getValue(
                  item.image_url,
                  item.imageUrl,
                  item.product_image,
                  item.productImage,
                  item.image,
                  item.product?.image_url,
                  item.product?.image
                );

                return (
                  <div
                    className="admin-order-item"
                    key={
                      item.id ||
                      item.order_item_id ||
                      index
                    }
                  >
                    <div className="admin-order-item-image">
                      {image ? (
                        <img
                          src={image}
                          alt={productName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div>
                          {String(productName).charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="admin-order-item-info">
                      <strong>{productName}</strong>

                      {size && (
                        <span>
                          Size: {size}
                        </span>
                      )}

                      <span>
                        Quantity: {quantity}
                      </span>
                    </div>

                    <strong className="admin-order-item-price">
                      {formatCurrency(itemTotal)}
                    </strong>
                  </div>
                );
              })
            )}
          </div>

          <div className="admin-order-details-panel">
            <div className="admin-details-panel-header">
              <div>
                <h2>Order Timeline</h2>
                <span>
                  Order fulfillment progress
                </span>
              </div>

              <Clock3
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <div className="admin-order-timeline">
              <div className="admin-timeline-item completed">
                <div className="admin-timeline-icon">
                  <CheckCircle2 size={16} />
                </div>

                <div>
                  <strong>Order Placed</strong>
                  <span>
                    Customer placed the order
                  </span>
                </div>
              </div>

              <div
                className={
                  orderStatus === "Cancelled"
                    ? "admin-timeline-item cancelled"
                    : "admin-timeline-item completed"
                }
              >
                <div className="admin-timeline-icon">
                  {orderStatus === "Cancelled" ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>

                <div>
                  <strong>Payment</strong>
                  <span>
                    {order.payment} ·{" "}
                    {order.paymentMethod}
                  </span>
                </div>
              </div>

              <div
                className={
                  ["Shipped", "Delivered"].includes(
                    orderStatus
                  )
                    ? "admin-timeline-item completed"
                    : "admin-timeline-item"
                }
              >
                <div className="admin-timeline-icon">
                  <Truck size={16} />
                </div>

                <div>
                  <strong>Shipped</strong>

                  <span>
                    {["Shipped", "Delivered"].includes(
                      orderStatus
                    )
                      ? "Order has been shipped"
                      : "Waiting for shipment"}
                  </span>
                </div>
              </div>

              <div
                className={
                  orderStatus === "Delivered"
                    ? "admin-timeline-item completed"
                    : "admin-timeline-item"
                }
              >
                <div className="admin-timeline-icon">
                  <CheckCircle2 size={16} />
                </div>

                <div>
                  <strong>Delivered</strong>

                  <span>
                    {orderStatus === "Delivered"
                      ? "Order delivered successfully"
                      : "Waiting for delivery"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-order-details-panel">
            <div className="admin-details-panel-header">
              <div>
                <h2>Payment Summary</h2>
                <span>
                  Order payment information
                </span>
              </div>

              <CreditCard
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <div className="admin-payment-summary">
              <div>
                <span>Subtotal</span>
                <strong>
                  {formatCurrency(order.subtotal)}
                </strong>
              </div>

              <div>
                <span>Shipping</span>
                <strong>
                  {formatCurrency(order.shippingCost)}
                </strong>
              </div>

              <div>
                <span>Discount</span>
                <strong>
                  {formatCurrency(order.discount)}
                </strong>
              </div>

              <div className="total">
                <span>Total</span>
                <strong>
                  {formatCurrency(order.totalAmount)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-order-details-side">
          <div className="admin-order-details-panel">
            <div className="admin-details-panel-header">
              <div>
                <h2>Customer</h2>
                <span>
                  Customer information
                </span>
              </div>

              <User
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <div className="admin-customer-details">
              <strong>{order.customer}</strong>
              <span>{order.email}</span>
              <span>{order.phone}</span>
            </div>
          </div>

          <div className="admin-order-details-panel">
            <div className="admin-details-panel-header">
              <div>
                <h2>Shipping Address</h2>
                <span>
                  Delivery information
                </span>
              </div>

              <MapPin
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <div className="admin-address-details">
              <strong>{order.address.name}</strong>

              {order.address.line1 && (
                <span>{order.address.line1}</span>
              )}

              {order.address.line2 && (
                <span>{order.address.line2}</span>
              )}

              {(order.address.city ||
                order.address.state) && (
                <span>
                  {order.address.city}
                  {order.address.city &&
                  order.address.state
                    ? ", "
                    : ""}
                  {order.address.state}
                </span>
              )}

              {order.address.pincode && (
                <span>{order.address.pincode}</span>
              )}

              {order.address.country && (
                <span>{order.address.country}</span>
              )}
            </div>
          </div>

          <div className="admin-order-details-panel">
            <div className="admin-details-panel-header">
              <div>
                <h2>Order Status</h2>
                <span>
                  Update fulfillment status
                </span>
              </div>
            </div>

            <div className="admin-order-status-control">
              <label htmlFor="orderStatus">
                Current Status
              </label>

              <select
                id="orderStatus"
                value={orderStatus}
                onChange={handleStatusChange}
                disabled={saving}
              >
                <option value="Processing">
                  Processing
                </option>

                <option value="Shipped">
                  Shipped
                </option>

                <option value="Delivered">
                  Delivered
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>

              <button
                type="button"
                className="admin-update-status-button"
                onClick={handleUpdateStatus}
                disabled={saving}
              >
                {saving
                  ? "Updating..."
                  : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminOrderDetails;