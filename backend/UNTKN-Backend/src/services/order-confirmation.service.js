import pool from "../config/database.js";
import { sendEmail } from "./email-service.js";

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const sendOrderConfirmationEmail = async (
    orderId
) => {
    const [orders] = await pool.execute(
        `
        SELECT
            id,
            order_number,
            subtotal,
            shipping_fee,
            discount,
            total_amount,
            currency,
            payment_status,
            order_status,
            shipping_name,
            shipping_email,
            shipping_phone,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country,
            delivery_method,
            created_at
        FROM orders
        WHERE id = ?
        LIMIT 1
        `,
        [orderId]
    );

    if (orders.length === 0) {
        throw new Error(
            "Order not found for confirmation email."
        );
    }

    const order = orders[0];

    if (!order.shipping_email) {
        throw new Error(
            "Customer email is missing for confirmation email."
        );
    }

    const [items] = await pool.execute(
        `
        SELECT
            product_name,
            sku,
            size_name,
            color_name,
            quantity,
            unit_price,
            total_price
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
        `,
        [orderId]
    );

    let deliveryMethod = null;

    if (order.delivery_method) {
        const [deliveryMethods] =
            await pool.execute(
                `
                SELECT
                    method_id,
                    name,
                    description,
                    price
                FROM delivery_methods
                WHERE method_id = ?
                LIMIT 1
                `,
                [order.delivery_method]
            );

        if (deliveryMethods.length > 0) {
            deliveryMethod =
                deliveryMethods[0];
        }
    }

    const itemRows = items
        .map((item) => {
            const details = [
                item.size_name
                    ? `Size: ${item.size_name}`
                    : "",
                item.color_name
                    ? `Color: ${item.color_name}`
                    : "",
                item.sku
                    ? `SKU: ${item.sku}`
                    : ""
            ]
                .filter(Boolean)
                .join(" · ");

            return `
                <tr>
                    <td style="padding:14px 10px;border-bottom:1px solid #e5e5e5;">
                        <strong>${escapeHtml(
                            item.product_name
                        )}</strong>
                        ${
                            details
                                ? `<div style="font-size:12px;color:#777;margin-top:5px;">${escapeHtml(
                                      details
                                  )}</div>`
                                : ""
                        }
                    </td>
                    <td style="padding:14px 10px;border-bottom:1px solid #e5e5e5;text-align:center;">
                        ${Number(
                            item.quantity || 0
                        )}
                    </td>
                    <td style="padding:14px 10px;border-bottom:1px solid #e5e5e5;text-align:right;">
                        ₹${formatMoney(
                            item.total_price
                        )}
                    </td>
                </tr>
            `;
        })
        .join("");

    const customerName =
        order.shipping_name ||
        "there";

    const address = [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
    ]
        .filter(Boolean)
        .join(", ");

    const deliveryText =
        deliveryMethod?.name ||
        order.delivery_method ||
        "Standard Delivery";

    const subject =
        `Your UNTKN order #${order.order_number} is confirmed ✓`;

    const text = `
Hi ${customerName},

Thank you for shopping with UNTKN.

We're happy to confirm that your order has been successfully placed and your payment has been received.

Order: #${order.order_number}
Order Status: ${order.order_status}
Payment Status: ${order.payment_status}

ORDER ITEMS

${items
    .map(
        (item) =>
            `${item.product_name} × ${item.quantity} — ₹${formatMoney(
                item.total_price
            )}`
    )
    .join("\n")}

Subtotal: ₹${formatMoney(order.subtotal)}
Shipping: ₹${formatMoney(order.shipping_fee)}
Discount: ₹${formatMoney(order.discount)}
Total: ₹${formatMoney(order.total_amount)}

Delivery: ${deliveryText}

Shipping Address:
${address}

We'll keep you updated about your order.

Thank you for choosing UNTKN.

With love,
UNTKN
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UNTKN Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717;">
<div style="max-width:680px;margin:30px auto;background:#ffffff;padding:40px 32px;">

    <div style="text-align:center;margin-bottom:35px;">
        <h1 style="margin:0;font-size:30px;letter-spacing:5px;font-weight:600;">
            UNTKN
        </h1>
        <p style="margin:10px 0 0;color:#777;font-size:12px;letter-spacing:2px;">
            ORDER CONFIRMATION
        </p>
    </div>

    <div style="text-align:center;margin-bottom:35px;">
        <div style="font-size:42px;margin-bottom:12px;">
            ✓
        </div>

        <h2 style="margin:0 0 10px;font-size:24px;">
            Thank you, ${escapeHtml(
                customerName
            )}!
        </h2>

        <p style="margin:0;color:#666;line-height:1.7;">
            Your order has been successfully placed.
            We're getting everything ready for you.
        </p>
    </div>

    <div style="background:#fafafa;padding:22px;margin-bottom:30px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span style="color:#777;">Order Number</span>
            <strong>#${escapeHtml(
                order.order_number
            )}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span style="color:#777;">Payment</span>
            <strong>${escapeHtml(
                order.payment_status
            )}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
            <span style="color:#777;">Delivery</span>
            <strong>${escapeHtml(
                deliveryText
            )}</strong>
        </div>
    </div>

    <h3 style="font-size:16px;letter-spacing:1px;margin-bottom:15px;">
        YOUR ORDER
    </h3>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
            <tr>
                <th style="padding:12px 10px;text-align:left;border-bottom:2px solid #171717;">
                    ITEM
                </th>
                <th style="padding:12px 10px;text-align:center;border-bottom:2px solid #171717;">
                    QTY
                </th>
                <th style="padding:12px 10px;text-align:right;border-bottom:2px solid #171717;">
                    TOTAL
                </th>
            </tr>
        </thead>

        <tbody>
            ${itemRows}
        </tbody>
    </table>

    <div style="margin-top:25px;border-top:1px solid #ddd;padding-top:18px;">

        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span>Subtotal</span>
            <span>₹${formatMoney(
                order.subtotal
            )}</span>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span>Shipping</span>
            <span>₹${formatMoney(
                order.shipping_fee
            )}</span>
        </div>

        ${
            Number(order.discount || 0) > 0
                ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span>Discount</span>
            <span>-₹${formatMoney(
                order.discount
            )}</span>
        </div>
        `
                : ""
        }

        <div style="display:flex;justify-content:space-between;padding-top:15px;border-top:1px solid #ddd;font-size:18px;font-weight:bold;">
            <span>Total</span>
            <span>₹${formatMoney(
                order.total_amount
            )}</span>
        </div>
    </div>

    <div style="margin-top:35px;padding:22px;background:#fafafa;">
        <h3 style="margin:0 0 12px;font-size:15px;">
            SHIPPING ADDRESS
        </h3>

        <p style="margin:0;color:#666;line-height:1.7;">
            ${escapeHtml(address)}
        </p>
    </div>

    <div style="margin-top:35px;text-align:center;">
        <p style="margin:0;color:#666;line-height:1.7;">
            We'll keep you updated about your order.
        </p>

        <p style="margin:20px 0 0;font-size:15px;">
            Thank you for choosing
            <strong>UNTKN</strong>.
        </p>
    </div>

    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">
            This is an automated order confirmation email.
        </p>
    </div>

</div>
</body>
</html>
`;

    return await sendEmail({
        to: order.shipping_email,
        subject,
        text,
        html
    });
};
