import { Link } from "react-router-dom";
import {
  Check,
  Package,
  ArrowRight,
} from "lucide-react";

function OrderSuccess() {
  const orderNumber = "UNT-2026-00125";

  return (
    <div className="order-success-page">
      <div className="order-success-content">
        <div className="success-icon">
          <Check
            size={28}
            strokeWidth={1.5}
          />
        </div>

        <p className="eyebrow">
          ORDER CONFIRMED
        </p>

        <h1>
          THANK<br />
          YOU.
        </h1>

        <p className="success-message">
          Your order has been placed successfully.
          We've received your order and will begin
          processing it shortly.
        </p>

        <div className="success-order-number">
          <span>ORDER NUMBER</span>

          <strong>{orderNumber}</strong>
        </div>

        <div className="success-info">
          <div>
            <Package
              size={18}
              strokeWidth={1.3}
            />

            <div>
              <strong>WHAT'S NEXT?</strong>

              <p>
                You'll receive updates about your
                order and delivery status.
              </p>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <Link
            to={`/orders/${orderNumber}`}
            className="success-primary"
          >
            VIEW ORDER
            <ArrowRight
              size={16}
              strokeWidth={1.5}
            />
          </Link>

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