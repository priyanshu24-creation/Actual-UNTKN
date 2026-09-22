import pool from "../database.js";
import { sendEmail, getAdminEmail } from "./email.service.js";

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const formatMoney = (value) => {
    return Number(value || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
};

const getDeliveryDetails = (notes) => {
    const value = String(notes || "").toLowerCase();
    if (value.includes("express")) {
        return {
            name: "EXPRESS DELIVERY",
            description: "2–3 BUSINESS DAYS"
        };
    }
    return {
        name: "STANDARD DELIVERY",
        description: "5–7 BUSINESS DAYS"
    };
};

const getOrderData = async (orderId) => {
    const [orders] =
        await pool.execute(
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
                notes,
                created_at
            FROM orders
            WHERE id = ?
            LIMIT 1
            `,
            [orderId]
        );

    if (orders.length === 0) {
        throw new Error(
            `Order ${orderId} was not found`
        );
    }

    const order = orders[0];

    if (!order.shipping_email) {
        throw new Error(
            `Order ${orderId} does not contain a customer email`
        );
    }

    const [items] =
        await pool.execute(
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

    return {
        order,
        items,
        delivery: getDeliveryDetails(
            order.notes
        )
    };
};

const createItemRows = (items) => {
    return items
        .map((item) => {
            const options = [
                item.size_name
                    ? `Size: ${escapeHtml(
                          item.size_name
                      )}`
                    : "",
                item.color_name
                    ? `Color: ${escapeHtml(
                          item.color_name
                      )}`
                    : ""
            ]
                .filter(Boolean)
                .join(" · ");

            return `
                <tr>
                    <td style="padding:18px 0;border-bottom:1px solid #e8e8e8;">
                        <div style="font-size:15px;font-weight:600;color:#111;">
                            ${escapeHtml(
                                item.product_name
                            )}
                        </div>

                        ${
                            options
                                ? `
                                    <div style="margin-top:6px;font-size:12px;color:#777;">
                                        ${options}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            item.sku
                                ? `
                                    <div style="margin-top:5px;font-size:11px;color:#999;">
                                        SKU: ${escapeHtml(
                                            item.sku
                                        )}
                                    </div>
                                `
                                : ""
                        }
                    </td>

                    <td style="padding:18px 0;border-bottom:1px solid #e8e8e8;text-align:center;color:#555;">
                        ${Number(
                            item.quantity || 0
                        )}
                    </td>

                    <td style="padding:18px 0;border-bottom:1px solid #e8e8e8;text-align:right;font-weight:600;color:#111;">
                        ₹${formatMoney(
                            item.total_price
                        )}
                    </td>
                </tr>
            `;
        })
        .join("");
};

export const sendOrderConfirmationEmail =
    async (orderId) => {
        const {
            order,
            items,
            delivery
        } = await getOrderData(orderId);

        const customerName =
            order.shipping_name?.trim() ||
            "there";

        const itemRows =
            createItemRows(items);

        const addressLines = [
            order.shipping_address_line1,
            order.shipping_address_line2,
            order.shipping_city,
            order.shipping_state,
            order.shipping_postal_code,
            order.shipping_country
        ]
            .filter(Boolean)
            .map((line) =>
                escapeHtml(line)
            )
            .join("<br>");

        const subject =
            `Your UNTKN order #${order.order_number} is confirmed`;

        const text = `
Hi ${customerName},

Thank you for shopping with UNTKN.

Your order has been successfully confirmed.

Order: #${order.order_number}

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

Delivery: ${delivery.name}
Estimated delivery: ${delivery.description}

Shipping address:
${order.shipping_address_line1}
${order.shipping_address_line2 || ""}
${order.shipping_city}, ${order.shipping_state}
${order.shipping_postal_code}
${order.shipping_country}

Thank you for choosing UNTKN.

With love,
UNTKN
`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>UNTKN Order Confirmation</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#111;">

<div style="width:100%;padding:40px 16px;box-sizing:border-box;">

<div style="max-width:680px;margin:0 auto;background:#ffffff;">

<div style="padding:38px 40px;border-bottom:1px solid #eeeeee;text-align:center;">
    <div style="font-size:28px;letter-spacing:8px;font-weight:700;">
        UNTKN
    </div>

    <div style="margin-top:10px;font-size:10px;letter-spacing:3px;color:#888;">
        ORDER CONFIRMATION
    </div>
</div>

<div style="padding:45px 40px;">

<div style="text-align:center;">

    <div style="display:inline-block;width:54px;height:54px;line-height:54px;border-radius:50%;background:#111;color:#fff;font-size:25px;">
        ✓
    </div>

    <h1 style="margin:24px 0 10px;font-size:28px;font-weight:500;">
        Thank you, ${escapeHtml(
            customerName
        )}.
    </h1>

    <p style="margin:0;color:#666;font-size:15px;line-height:1.7;">
        Your order has been successfully confirmed.
    </p>

</div>

<div style="margin:38px 0;padding:22px;background:#f7f7f5;text-align:center;">

    <div style="font-size:11px;letter-spacing:2px;color:#888;">
        ORDER NUMBER
    </div>

    <div style="margin-top:8px;font-size:19px;font-weight:600;">
        #${escapeHtml(
            order.order_number
        )}
    </div>

</div>

<h2 style="margin:0 0 18px;font-size:14px;letter-spacing:2px;font-weight:600;">
    YOUR ORDER
</h2>

<table style="width:100%;border-collapse:collapse;">

<thead>

<tr>

<th style="padding:0 0 12px;text-align:left;font-size:10px;letter-spacing:1.5px;color:#999;">
    ITEM
</th>

<th style="padding:0 0 12px;text-align:center;font-size:10px;letter-spacing:1.5px;color:#999;">
    QTY
</th>

<th style="padding:0 0 12px;text-align:right;font-size:10px;letter-spacing:1.5px;color:#999;">
    PRICE
</th>

</tr>

</thead>

<tbody>
${itemRows}
</tbody>

</table>

<div style="margin-top:25px;">

<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:14px;color:#666;">
    <span>Subtotal</span>
    <span>₹${formatMoney(
        order.subtotal
    )}</span>
</div>

<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:14px;color:#666;">
    <span>Shipping</span>
    <span>₹${formatMoney(
        order.shipping_fee
    )}</span>
</div>

<div style="margin-top:10px;padding-top:18px;border-top:1px solid #111;display:flex;justify-content:space-between;font-size:17px;font-weight:700;">
    <span>Total</span>
    <span>₹${formatMoney(
        order.total_amount
    )}</span>
</div>

</div>

<div style="margin-top:42px;padding-top:30px;border-top:1px solid #eeeeee;">

<h2 style="margin:0 0 16px;font-size:14px;letter-spacing:2px;font-weight:600;">
    DELIVERY
</h2>

<div style="font-size:14px;color:#333;line-height:1.8;">
    <strong>${escapeHtml(
        delivery.name
    )}</strong>
    <br>
    ${escapeHtml(
        delivery.description
    )}
</div>

</div>

<div style="margin-top:32px;padding:25px;background:#f7f7f5;">

<h2 style="margin:0 0 15px;font-size:14px;letter-spacing:2px;font-weight:600;">
    SHIPPING ADDRESS
</h2>

<div style="font-size:14px;line-height:1.8;color:#555;">
    ${addressLines}
</div>

</div>

<div style="margin-top:42px;text-align:center;">

<p style="margin:0;color:#555;font-size:14px;line-height:1.8;">
    Thank you for choosing UNTKN.
</p>

<p style="margin:7px 0 0;color:#555;font-size:14px;line-height:1.8;">
    We hope you love your order.
</p>

<p style="margin:22px 0 0;font-size:14px;font-weight:600;">
    With love,<br>
    UNTKN
</p>

</div>

</div>

<div style="padding:25px 40px;background:#111;text-align:center;">

<div style="font-size:17px;letter-spacing:5px;color:#fff;font-weight:700;">
    UNTKN
</div>

<div style="margin-top:9px;font-size:10px;letter-spacing:2px;color:#999;">
    THANK YOU FOR SHOPPING WITH US
</div>

</div>

</div>

</div>

</body>
</html>
`;

        return sendEmail({
            to: order.shipping_email,
            subject,
            text,
            html,
            replyTo: "support@untkn.in"
        });
    };

export const sendAdminOrderNotificationEmail =
    async (orderId) => {
        const {
            order,
            items,
            delivery
        } = await getOrderData(orderId);

        const adminEmail =
            getAdminEmail();

        const itemRows = items
            .map(
                (item) =>
                    `
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eee;">
                            ${escapeHtml(
                                item.product_name
                            )}
                        </td>
                        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">
                            ${Number(
                                item.quantity
                            )}
                        </td>
                        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
                            ₹${formatMoney(
                                item.total_price
                            )}
                        </td>
                    </tr>
                    `
            )
            .join("");

        const subject =
            `New UNTKN order #${order.order_number}`;

        const text = `
New UNTKN order received.

Order: #${order.order_number}

Customer:
${order.shipping_name}
${order.shipping_email}
${order.shipping_phone}

Delivery:
${delivery.name}
${delivery.description}

Shipping address:
${order.shipping_address_line1}
${order.shipping_address_line2 || ""}
${order.shipping_city}, ${order.shipping_state}
${order.shipping_postal_code}
${order.shipping_country}

Items:
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
Total: ₹${formatMoney(order.total_amount)}

Payment status: ${order.payment_status}
Order status: ${order.order_status}
`;

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:30px;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#111;">

<div style="max-width:700px;margin:0 auto;background:#fff;padding:40px;">

<div style="text-align:center;border-bottom:1px solid #eee;padding-bottom:25px;">

<div style="font-size:28px;letter-spacing:7px;font-weight:700;">
UNTKN
</div>

<div style="margin-top:10px;font-size:11px;letter-spacing:2px;color:#888;">
NEW ORDER RECEIVED
</div>

</div>

<div style="margin-top:35px;">

<h1 style="font-size:24px;">
New Order #${escapeHtml(
    order.order_number
)}
</h1>

<p style="color:#666;">
A new order has been placed on UNTKN.
</p>

</div>

<div style="margin-top:30px;padding:20px;background:#f7f7f5;">

<h2 style="font-size:14px;letter-spacing:2px;">
CUSTOMER
</h2>

<p style="line-height:1.8;color:#555;">
<strong>${escapeHtml(
    order.shipping_name
)}</strong>
<br>
${escapeHtml(
    order.shipping_email
)}
<br>
${escapeHtml(
    order.shipping_phone
)}
</p>

</div>

<div style="margin-top:25px;padding:20px;background:#f7f7f5;">

<h2 style="font-size:14px;letter-spacing:2px;">
DELIVERY
</h2>

<p style="line-height:1.8;color:#555;">
<strong>${escapeHtml(
    delivery.name
)}</strong>
<br>
${escapeHtml(
    delivery.description
)}
</p>

</div>

<div style="margin-top:25px;padding:20px;background:#f7f7f5;">

<h2 style="font-size:14px;letter-spacing:2px;">
SHIPPING ADDRESS
</h2>

<p style="line-height:1.8;color:#555;">
${escapeHtml(
    order.shipping_address_line1
)}
<br>
${order.shipping_address_line2
    ? `${escapeHtml(
          order.shipping_address_line2
      )}<br>`
    : ""}
${escapeHtml(
    order.shipping_city
)}, ${escapeHtml(
    order.shipping_state
)}
<br>
${escapeHtml(
    order.shipping_postal_code
)}
<br>
${escapeHtml(
    order.shipping_country
)}
</p>

</div>

<div style="margin-top:30px;">

<h2 style="font-size:14px;letter-spacing:2px;">
ORDER ITEMS
</h2>

<table style="width:100%;border-collapse:collapse;">

<thead>

<tr>

<th style="padding:10px;text-align:left;">
PRODUCT
</th>

<th style="padding:10px;text-align:center;">
QTY
</th>

<th style="padding:10px;text-align:right;">
TOTAL
</th>

</tr>

</thead>

<tbody>
${itemRows}
</tbody>

</table>

</div>

<div style="margin-top:25px;border-top:1px solid #111;padding-top:20px;">

<div style="display:flex;justify-content:space-between;padding:6px 0;">
<span>Subtotal</span>
<span>₹${formatMoney(
    order.subtotal
)}</span>
</div>

<div style="display:flex;justify-content:space-between;padding:6px 0;">
<span>Shipping</span>
<span>₹${formatMoney(
    order.shipping_fee
)}</span>
</div>

<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:700;">
<span>Total</span>
<span>₹${formatMoney(
    order.total_amount
)}</span>
</div>

</div>

</div>

</body>
</html>
`;

        return sendEmail({
            to: adminEmail,
            subject,
            text,
            html,
            replyTo: "support@untkn.in"
        });
    };

export const sendOrderEmails =
    async (orderId) => {
        console.log(
            `Starting order email processing for order ${orderId}`
        );

        const results =
            await Promise.allSettled([
                sendOrderConfirmationEmail(
                    orderId
                ),
                sendAdminOrderNotificationEmail(
                    orderId
                )
            ]);

        const customerResult =
            results[0];

        const adminResult =
            results[1];

        if (
            customerResult.status ===
            "fulfilled"
        ) {
            console.log(
                `Customer order email sent for order ${orderId}`
            );
        } else {
            console.error(
                `Customer order email failed for order ${orderId}:`,
                customerResult.reason
            );
        }

        if (
            adminResult.status ===
            "fulfilled"
        ) {
            console.log(
                `Admin order email sent for order ${orderId}`
            );
        } else {
            console.error(
                `Admin order email failed for order ${orderId}:`,
                adminResult.reason
            );
        }

        return {
            customer:
                customerResult.status ===
                "fulfilled",

            admin:
                adminResult.status ===
                "fulfilled"
        };
    };