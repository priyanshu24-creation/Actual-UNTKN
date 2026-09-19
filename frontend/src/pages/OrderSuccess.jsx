import { Link, useLocation } from "react-router-dom";
import {
  Check,
  Package,
  ArrowRight,
} from "lucide-react";

function OrderSuccess() {
  const location = useLocation();

  /*
  |--------------------------------------------------------------------------
  | GET ORDER DATA
  |--------------------------------------------------------------------------
  */

  const order = location.state?.order || null;

  /*
  |--------------------------------------------------------------------------
  | ORDER NUMBER
  |--------------------------------------------------------------------------
  |
  | Prefer the real order number returned by the backend.
  | Fall back to the order ID if order_number is unavailable.
  |
  */

  const orderNumber =
    order?.order_number ||
    order?.orderNumber ||
    (order?.id
      ? `UNT-${String(order.id).padStart(5, "0")}`
      : "UNT-2026-00125");

  /*
  |--------------------------------------------------------------------------
  | ORDER ID
  |--------------------------------------------------------------------------
  */

  const orderId = order?.id || null;

  /*
  |--------------------------------------------------------------------------
  | VIEW ORDER LINK
  |--------------------------------------------------------------------------
  |
  | If we have the actual order ID, use it.
  | Otherwise fall back to the order number.
  |
  */

  const viewOrderPath = orderId
    ? `/account/orders/${orderId}`
    : `/account/orders/${orderNumber}`;

  return (
    <div className="order-success-page">

      <div className="order-success-content">

        {/* SUCCESS ICON */}

        <div className="success-icon">

          <Check
            size={28}
            strokeWidth={1.5}
          />

        </div>

        {/* EYEBROW */}

        <p className="eyebrow">
          ORDER CONFIRMED
        </p>

        {/* TITLE */}

        <h1>
          THANK
          <br />
          YOU.
        </h1>

        {/* MESSAGE */}

        <p className="success-message">
          Your order has been placed successfully.
          We've received your order and will begin
          processing it shortly.
        </p>

        {/* ORDER NUMBER */}

        <div className="success-order-number">

          <span>
            ORDER NUMBER
          </span>

          <strong>
            {orderNumber}
          </strong>

        </div>

        {/* WHAT'S NEXT */}

        <div className="success-info">

          <div>

            <Package
              size={18}
              strokeWidth={1.3}
            />

            <div>

              <strong>
                WHAT'S NEXT?
              </strong>

              <p>
                You'll receive updates about your
                order and delivery status.
              </p>

            </div>

          </div>

        </div>

        {/* ACTION BUTTONS */}

        <div className="success-actions">

          {/* VIEW ORDER */}

          <Link
            to={viewOrderPath}
            className="success-primary"
          >

            <span>
              VIEW ORDER
            </span>

            <ArrowRight
              size={16}
              strokeWidth={1.5}
            />

          </Link>

          {/* CONTINUE SHOPPING */}

          <Link
            to="/shop"
            className="success-secondary"
          >
            CONTINUE SHOPPING
          </Link>

        </div>

      </div>

    </div>
  );
}

export default OrderSuccess;