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

const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

const getDeliveryDetails = (deliveryMethod) => {
    if (
        String(deliveryMethod || "").toLowerCase() === "express"
    ) {
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

const getOrder = async (orderId) => {
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
        throw new Error("Order not found");
    }

    const order = orders[0];

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

    return {
        ...order,
        items
    };
};

const buildItemRows = (items) => {
    return items
        .map((item) => {
            const options = [
                item.size_name
                    ? `Size: ${escapeHtml(item.size_name)}`
                    : "",
                item.color_name
                    ? `Color: ${escapeHtml(item.color_name)}`
                    : ""
            ]
                .filter(Boolean)
                .join(" · ");

            return `
                <tr>
                    <td style="padding:18px 0;border-bottom:1px solid #e8e8e8;">
                        <div style="font-size:15px;font-weight:600;color:#111;">
                            ${escapeHtml(item.product_name)}
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
                                        SKU: ${escapeHtml(item.sku)}
                                    </div>
                                `
                                : ""
                        }
                    </td>

                    <td style="padding:18px 0;border-bottom:1px solid #e8e8e8;text-align:center;color:#555;">
                        ${Number(item.quantity || 0)}
                    </td>

                    <td style="padding:18px 0;border-bottom:1px solid #e8e8e8;text-align:right;font-weight:600;color:#111;">
                        ₹${formatMoney(item.total_price)}
                    </td>
                </tr>
            `;
        })
        .join("");
};

const buildTextItems = (items) => {
    return items
        .map(
            (item) =>
                `${item.product_name} × ${item.quantity} — ₹${formatMoney(item.total_price)}`
        )
        .join("\n");
};

const buildAddressHtml = (order) => {
    return [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
    ]
        .filter(Boolean)
        .map((line) => escapeHtml(line))
        .join("<br>");
};

const buildAddressText = (order) => {
    return [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
    ]
        .filter(Boolean)
        .join("\n");
};

export const sendOrderConfirmationEmail = async (orderId) => {
    const order = await getOrder(orderId);

    if (!order.shipping_email) {
        throw new Error(
            "Order does not have a customer email address"
        );
    }

    const customerName =
        order.shipping_name?.trim() || "there";

    const delivery = getDeliveryDetails(
        order.delivery_method
    );

    const itemRows = buildItemRows(order.items);

    const addressHtml =
        buildAddressHtml(order);

    const subject =
        `Your UNTKN order #${order.order_number} is confirmed ✓`;

    const text = `
Hi ${customerName},

Thank you for shopping with UNTKN.

Your order has been successfully confirmed and we're getting it ready for you.

Order: #${order.order_number}

${buildTextItems(order.items)}

Subtotal: ₹${formatMoney(order.subtotal)}
Shipping: ₹${formatMoney(order.shipping_fee)}
Discount: ₹${formatMoney(order.discount)}
Total: ₹${formatMoney(order.total_amount)}

Delivery: ${delivery.name}
Estimated delivery: ${delivery.description}

Shipping address:
${buildAddressText(order)}

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

<body style="margin:0;padding:0;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#111;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;padding:40px 15px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;">

<tr>
<td style="padding:38px 40px 28px;text-align:center;border-bottom:1px solid #eeeeee;">
    <div style="font-size:30px;letter-spacing:7px;font-weight:700;">
        UNTKN
    </div>

    <div style="margin-top:8px;font-size:11px;letter-spacing:3px;color:#999;">
        ORDER CONFIRMATION
    </div>
</td>
</tr>

<tr>
<td style="padding:40px;">

<div style="font-size:26px;font-weight:600;margin-bottom:12px;">
    Thank you, ${escapeHtml(customerName)}.
</div>

<div style="font-size:15px;line-height:1.7;color:#666;margin-bottom:30px;">
    Your order has been successfully confirmed.
    We're getting everything ready for you.
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f6;">
<tr>
<td style="padding:22px;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:8px;">
    ORDER NUMBER
</div>

<div style="font-size:20px;font-weight:600;">
    #${escapeHtml(order.order_number)}
</div>

</td>

<td style="padding:22px;text-align:right;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:8px;">
    STATUS
</div>

<div style="font-size:13px;font-weight:600;text-transform:uppercase;">
    CONFIRMED
</div>

</td>
</tr>
</table>

<div style="margin-top:35px;font-size:12px;letter-spacing:2px;font-weight:600;">
    YOUR ITEMS
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
<thead>
<tr>
<th align="left" style="padding:10px 0;font-size:11px;color:#999;font-weight:500;">
    PRODUCT
</th>

<th align="center" style="padding:10px 0;font-size:11px;color:#999;font-weight:500;">
    QTY
</th>

<th align="right" style="padding:10px 0;font-size:11px;color:#999;font-weight:500;">
    TOTAL
</th>
</tr>
</thead>

<tbody>
${itemRows}
</tbody>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:25px;">

<tr>
<td style="padding:7px 0;color:#777;font-size:14px;">
    Subtotal
</td>

<td align="right" style="padding:7px 0;font-size:14px;">
    ₹${formatMoney(order.subtotal)}
</td>
</tr>

<tr>
<td style="padding:7px 0;color:#777;font-size:14px;">
    Shipping
</td>

<td align="right" style="padding:7px 0;font-size:14px;">
    ₹${formatMoney(order.shipping_fee)}
</td>
</tr>

<tr>
<td style="padding:7px 0;color:#777;font-size:14px;">
    Discount
</td>

<td align="right" style="padding:7px 0;font-size:14px;">
    ₹${formatMoney(order.discount)}
</td>
</tr>

<tr>
<td style="padding:18px 0 7px;border-top:1px solid #dddddd;font-size:16px;font-weight:600;">
    Total
</td>

<td align="right" style="padding:18px 0 7px;border-top:1px solid #dddddd;font-size:18px;font-weight:700;">
    ₹${formatMoney(order.total_amount)}
</td>
</tr>

</table>

<div style="margin-top:35px;padding:25px;background:#f8f8f6;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:10px;">
    DELIVERY
</div>

<div style="font-size:15px;font-weight:600;">
    ${delivery.name}
</div>

<div style="font-size:13px;color:#777;margin-top:5px;">
    ${delivery.description}
</div>

</div>

<div style="margin-top:30px;padding:25px;border:1px solid #eeeeee;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:12px;">
    SHIPPING ADDRESS
</div>

<div style="font-size:14px;line-height:1.7;color:#444;">
    ${addressHtml}
</div>

</div>

<div style="margin-top:35px;text-align:center;font-size:13px;line-height:1.7;color:#777;">
    Thank you for choosing UNTKN.<br>
    We hope you love your order as much as we loved creating it.
</div>

</td>
</tr>

<tr>
<td style="padding:25px 40px;background:#111;text-align:center;color:#fff;">

<div style="font-size:22px;letter-spacing:5px;font-weight:700;">
    UNTKN
</div>

<div style="margin-top:10px;font-size:11px;color:#aaa;letter-spacing:1px;">
    MODERN FASHION. TIMELESS ATTITUDE.
</div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    return sendEmail({
        to: order.shipping_email,
        subject,
        text,
        html
    });
};

export const sendAdminOrderNotificationEmail = async (
    orderId
) => {
    const order = await getOrder(orderId);

    const adminEmail =
        process.env.ADMIN_EMAIL ||
        "contact@untkn.in";

    const delivery = getDeliveryDetails(
        order.delivery_method
    );

    const itemRows = buildItemRows(
        order.items
    );

    const addressHtml =
        buildAddressHtml(order);

    const subject =
        `New UNTKN Order #${order.order_number}`;

    const text = `
New UNTKN order received.

Order: #${order.order_number}

Customer:
${order.shipping_name || "N/A"}

Email:
${order.shipping_email || "N/A"}

Phone:
${order.shipping_phone || "N/A"}

Items:
${buildTextItems(order.items)}

Subtotal: ₹${formatMoney(order.subtotal)}
Shipping: ₹${formatMoney(order.shipping_fee)}
Discount: ₹${formatMoney(order.discount)}
Total: ₹${formatMoney(order.total_amount)}

Payment Status:
${order.payment_status}

Order Status:
${order.order_status}

Delivery:
${delivery.name}

Shipping Address:
${buildAddressText(order)}
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New UNTKN Order</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#111;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;padding:40px 15px;">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0" border="0" style="max-width:650px;background:#ffffff;">

<tr>
<td style="padding:35px 40px;background:#111;color:#fff;text-align:center;">

<div style="font-size:30px;letter-spacing:7px;font-weight:700;">
    UNTKN
</div>

<div style="margin-top:8px;font-size:11px;letter-spacing:3px;color:#aaa;">
    NEW ORDER RECEIVED
</div>

</td>
</tr>

<tr>
<td style="padding:40px;">

<div style="font-size:24px;font-weight:600;margin-bottom:25px;">
    New Order #${escapeHtml(order.order_number)}
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f6;">

<tr>
<td style="padding:20px;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:8px;">
    CUSTOMER
</div>

<div style="font-size:15px;font-weight:600;">
    ${escapeHtml(order.shipping_name || "N/A")}
</div>

<div style="font-size:13px;color:#666;margin-top:5px;">
    ${escapeHtml(order.shipping_email || "N/A")}
</div>

<div style="font-size:13px;color:#666;margin-top:3px;">
    ${escapeHtml(order.shipping_phone || "N/A")}
</div>

</td>
</tr>

</table>

<div style="margin-top:30px;font-size:12px;letter-spacing:2px;font-weight:600;">
    ORDER ITEMS
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
<thead>
<tr>
<th align="left" style="padding:10px 0;font-size:11px;color:#999;font-weight:500;">
    PRODUCT
</th>

<th align="center" style="padding:10px 0;font-size:11px;color:#999;font-weight:500;">
    QTY
</th>

<th align="right" style="padding:10px 0;font-size:11px;color:#999;font-weight:500;">
    TOTAL
</th>
</tr>
</thead>

<tbody>
${itemRows}
</tbody>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:25px;">

<tr>
<td style="padding:7px 0;color:#777;">
    Subtotal
</td>

<td align="right" style="padding:7px 0;">
    ₹${formatMoney(order.subtotal)}
</td>
</tr>

<tr>
<td style="padding:7px 0;color:#777;">
    Shipping
</td>

<td align="right" style="padding:7px 0;">
    ₹${formatMoney(order.shipping_fee)}
</td>
</tr>

<tr>
<td style="padding:7px 0;color:#777;">
    Discount
</td>

<td align="right" style="padding:7px 0;">
    ₹${formatMoney(order.discount)}
</td>
</tr>

<tr>
<td style="padding:18px 0 7px;border-top:1px solid #ddd;font-size:16px;font-weight:600;">
    Total
</td>

<td align="right" style="padding:18px 0 7px;border-top:1px solid #ddd;font-size:18px;font-weight:700;">
    ₹${formatMoney(order.total_amount)}
</td>
</tr>

</table>

<div style="margin-top:30px;padding:20px;background:#f8f8f6;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:8px;">
    DELIVERY
</div>

<div style="font-size:14px;font-weight:600;">
    ${delivery.name}
</div>

<div style="font-size:13px;color:#777;margin-top:4px;">
    ${delivery.description}
</div>

</div>

<div style="margin-top:25px;padding:20px;border:1px solid #eee;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:10px;">
    SHIPPING ADDRESS
</div>

<div style="font-size:14px;line-height:1.7;color:#444;">
    ${addressHtml}
</div>

</div>

<div style="margin-top:25px;padding:20px;background:#f8f8f6;">

<div style="font-size:11px;letter-spacing:2px;color:#999;margin-bottom:8px;">
    PAYMENT STATUS
</div>

<div style="font-size:14px;font-weight:600;text-transform:uppercase;">
    ${escapeHtml(order.payment_status || "pending")}
</div>

</div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    return sendEmail({
        to: adminEmail,
        subject,
        text,
        html
    });
};

export const sendOrderEmails = async (
    orderId
) => {
    const results =
        await Promise.allSettled([
            sendOrderConfirmationEmail(
                orderId
            ),

            sendAdminOrderNotificationEmail(
                orderId
            )
        ]);

    for (const result of results) {
        if (
            result.status ===
            "rejected"
        ) {
            console.error(
                "Order email failed:",
                result.reason
            );
        }
    }

    return results;
};
