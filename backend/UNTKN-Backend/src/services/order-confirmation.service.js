import pool from "../config/database.js";
import { sendEmail } from "./email.service.js";

const escapeHtml = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(Number(value || 0));
};

const formatDate = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getOrderData = async (orderId) => {
    const numericOrderId = Number(orderId);

    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
        throw new Error(`Invalid order ID: ${orderId}`);
    }

    const [orders] = await pool.execute(
        `
        SELECT
            id,
            user_id,
            order_number,
            subtotal,
            shipping_fee,
            discount,
            total_amount,
            currency,
            payment_status,
            order_status,
            shipping_name,
            shipping_phone,
            shipping_email,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country,
            notes,
            coupon_code,
            created_at,
            updated_at
        FROM orders
        WHERE id = ?
        LIMIT 1
        `,
        [numericOrderId]
    );

    if (orders.length === 0) {
        throw new Error(`Order ${numericOrderId} not found`);
    }

    const order = orders[0];

    const customerEmail = String(
        order.shipping_email || ""
    ).trim();

    if (!customerEmail) {
        throw new Error(
            `Shipping email is missing for order ${numericOrderId}`
        );
    }

    const [items] = await pool.execute(
        `
        SELECT
            id,
            order_id,
            product_id,
            variant_id,
            product_name,
            sku,
            size_name,
            color_name,
            quantity,
            unit_price,
            total_price,
            created_at
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
        `,
        [numericOrderId]
    );

    return {
        order,
        items
    };
};

const buildAddress = (order) => {
    return [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
    ]
        .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
        .map((value) => escapeHtml(value))
        .join("<br>");
};

const buildTextAddress = (order) => {
    return [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
    ]
        .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
        .join(", ");
};

const buildItemsHtml = (items) => {
    if (!items || items.length === 0) {
        return `
            <tr>
                <td colspan="5" style="padding:16px;text-align:center;">
                    No items found.
                </td>
            </tr>
        `;
    }

    return items
        .map((item) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unit_price || 0);
            const totalPrice = Number(
                item.total_price ||
                unitPrice * quantity
            );

            const options = [
                item.size_name
                    ? `Size: ${escapeHtml(item.size_name)}`
                    : "",
                item.color_name
                    ? `Color: ${escapeHtml(item.color_name)}`
                    : ""
            ]
                .filter(Boolean)
                .join(" | ");

            return `
                <tr>
                    <td style="
                        padding:12px;
                        border-bottom:1px solid #eeeeee;
                    ">
                        <strong>
                            ${escapeHtml(
                                item.product_name || "Product"
                            )}
                        </strong>

                        ${
                            item.sku
                                ? `
                                    <div style="
                                        color:#888;
                                        font-size:12px;
                                        margin-top:4px;
                                    ">
                                        SKU: ${escapeHtml(item.sku)}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            options
                                ? `
                                    <div style="
                                        color:#777;
                                        font-size:12px;
                                        margin-top:4px;
                                    ">
                                        ${options}
                                    </div>
                                `
                                : ""
                        }
                    </td>

                    <td style="
                        padding:12px;
                        text-align:center;
                        border-bottom:1px solid #eeeeee;
                    ">
                        ${quantity}
                    </td>

                    <td style="
                        padding:12px;
                        text-align:right;
                        border-bottom:1px solid #eeeeee;
                    ">
                        ${formatCurrency(unitPrice)}
                    </td>

                    <td style="
                        padding:12px;
                        text-align:right;
                        border-bottom:1px solid #eeeeee;
                    ">
                        ${formatCurrency(totalPrice)}
                    </td>
                </tr>
            `;
        })
        .join("");
};

const buildItemsText = (items) => {
    if (!items || items.length === 0) {
        return "No items found.";
    }

    return items
        .map((item) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unit_price || 0);
            const totalPrice = Number(
                item.total_price ||
                unitPrice * quantity
            );

            const options = [
                item.size_name
                    ? `Size: ${item.size_name}`
                    : "",
                item.color_name
                    ? `Color: ${item.color_name}`
                    : ""
            ]
                .filter(Boolean)
                .join(" | ");

            return [
                `${item.product_name || "Product"} x ${quantity}`,
                options ? `(${options})` : "",
                `- ${formatCurrency(totalPrice)}`
            ]
                .filter(Boolean)
                .join(" ");
        })
        .join("\n");
};

const buildCustomerEmail = ({ order, items }) => {
    const customerName =
        order.shipping_name || "Customer";

    const orderNumber =
        order.order_number || `#${order.id}`;

    const addressText =
        buildTextAddress(order);

    const addressHtml =
        buildAddress(order);

    const subtotal =
        Number(order.subtotal || 0);

    const shippingFee =
        Number(order.shipping_fee || 0);

    const discount =
        Number(order.discount || 0);

    const total =
        Number(order.total_amount || 0);

    const paymentStatus =
        order.payment_status || "pending";

    const orderStatus =
        order.order_status || "confirmed";

    const text = `
Hello ${customerName},

Thank you for shopping with UNTKN.

Your order has been confirmed successfully.

Order Number: ${orderNumber}
Order Date: ${formatDate(order.created_at)}
Order Status: ${orderStatus}
Payment Status: ${paymentStatus}

Customer:
${customerName}
${order.shipping_email || ""}
${order.shipping_phone || ""}

Shipping Address:
${addressText}

Order Items:
${buildItemsText(items)}

Subtotal: ${formatCurrency(subtotal)}
Shipping Fee: ${formatCurrency(shippingFee)}
Discount: ${formatCurrency(discount)}
Total: ${formatCurrency(total)}

Thank you for choosing UNTKN.

Regards,
UNTKN
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation - ${escapeHtml(orderNumber)}</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
    color:#222;
">

<div style="
    max-width:700px;
    margin:30px auto;
    background:#ffffff;
">

    <div style="
        background:#111111;
        color:#ffffff;
        padding:30px;
        text-align:center;
    ">
        <h1 style="
            margin:0;
            font-size:30px;
            letter-spacing:4px;
        ">
            UNTKN
        </h1>

        <p style="
            margin:10px 0 0;
            color:#cccccc;
        ">
            Order Confirmation
        </p>
    </div>

    <div style="padding:30px;">

        <h2 style="margin-top:0;">
            Thank you, ${escapeHtml(customerName)}!
        </h2>

        <p>
            Your order has been confirmed successfully.
        </p>

        <div style="
            margin:25px 0;
            padding:20px;
            background:#f7f7f7;
        ">

            <p style="margin:0 0 8px;">
                <strong>Order Number:</strong>
                ${escapeHtml(orderNumber)}
            </p>

            <p style="margin:0 0 8px;">
                <strong>Order Date:</strong>
                ${escapeHtml(formatDate(order.created_at))}
            </p>

            <p style="margin:0 0 8px;">
                <strong>Order Status:</strong>
                ${escapeHtml(orderStatus)}
            </p>

            <p style="margin:0;">
                <strong>Payment Status:</strong>
                ${escapeHtml(paymentStatus)}
            </p>

        </div>

        <h3>Order Items</h3>

        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="border-collapse:collapse;"
        >
            <thead>
                <tr style="
                    background:#111111;
                    color:#ffffff;
                ">
                    <th style="
                        padding:12px;
                        text-align:left;
                    ">
                        Product
                    </th>

                    <th style="
                        padding:12px;
                        text-align:center;
                    ">
                        Qty
                    </th>

                    <th style="
                        padding:12px;
                        text-align:right;
                    ">
                        Price
                    </th>

                    <th style="
                        padding:12px;
                        text-align:right;
                    ">
                        Total
                    </th>
                </tr>
            </thead>

            <tbody>
                ${buildItemsHtml(items)}
            </tbody>
        </table>

        <div style="
            margin-top:25px;
            text-align:right;
        ">

            <p>
                <strong>Subtotal:</strong>
                ${formatCurrency(subtotal)}
            </p>

            <p>
                <strong>Shipping Fee:</strong>
                ${formatCurrency(shippingFee)}
            </p>

            <p>
                <strong>Discount:</strong>
                ${formatCurrency(discount)}
            </p>

            <p style="font-size:20px;">
                <strong>Total:</strong>
                ${formatCurrency(total)}
            </p>

        </div>

        <div style="
            margin-top:30px;
            padding:20px;
            background:#f7f7f7;
        ">

            <h3 style="margin-top:0;">
                Shipping Address
            </h3>

            <p>
                ${addressHtml || "Address not available"}
            </p>

            ${
                order.shipping_phone
                    ? `
                        <p style="margin-bottom:0;">
                            <strong>Phone:</strong>
                            ${escapeHtml(order.shipping_phone)}
                        </p>
                    `
                    : ""
            }

        </div>

        ${
            order.coupon_code
                ? `
                    <p style="margin-top:25px;">
                        <strong>Coupon:</strong>
                        ${escapeHtml(order.coupon_code)}
                    </p>
                `
                : ""
        }

        <p style="margin-top:30px;">
            We appreciate your order and will keep you updated
            about its delivery status.
        </p>

        <p>
            Regards,<br>
            <strong>UNTKN</strong>
        </p>

    </div>

    <div style="
        background:#111111;
        color:#aaaaaa;
        padding:20px;
        text-align:center;
        font-size:12px;
    ">
        This is an automated email from UNTKN.
    </div>

</div>

</body>
</html>
    `.trim();

    return {
        text,
        html
    };
};

export const sendOrderConfirmationEmail = async (orderId) => {
    console.log(
        `Starting customer order confirmation email for order ${orderId}`
    );

    const { order, items } =
        await getOrderData(orderId);

    const customerEmail =
        String(order.shipping_email || "").trim();

    if (!customerEmail) {
        throw new Error(
            `Customer email is missing for order ${orderId}`
        );
    }

    const orderNumber =
        order.order_number || `#${order.id}`;

    const subject =
        `Order Confirmed - ${orderNumber} | UNTKN`;

    const { text, html } =
        buildCustomerEmail({
            order,
            items
        });

    console.log(
        `Sending order confirmation email for order ${orderId} to ${customerEmail}`
    );

    const result = await sendEmail({
        to: customerEmail,
        subject,
        text,
        html
    });

    if (!result || !result.messageId) {
        throw new Error(
            `SMTP did not return a message ID for order ${orderId}`
        );
    }

    console.log(
        `Customer order confirmation sent successfully to ${customerEmail}. Message ID: ${result.messageId}`
    );

    return result;
};

export const sendAdminOrderNotificationEmail =
    async (orderId) => {
        try {
            const adminEmail =
                String(
                    process.env.ADMIN_EMAIL || ""
                ).trim();

            if (!adminEmail) {
                console.warn(
                    "ADMIN_EMAIL is not configured"
                );

                return null;
            }

            const { order, items } =
                await getOrderData(orderId);

            const orderNumber =
                order.order_number ||
                `#${order.id}`;

            const subject =
                `New Order ${orderNumber} | UNTKN`;

            const text = `
New order received.

Order Number: ${orderNumber}
Customer: ${order.shipping_name || ""}
Email: ${order.shipping_email || ""}
Phone: ${order.shipping_phone || ""}

Order Status: ${order.order_status || ""}
Payment Status: ${order.payment_status || ""}

Subtotal: ${formatCurrency(order.subtotal)}
Shipping Fee: ${formatCurrency(order.shipping_fee)}
Discount: ${formatCurrency(order.discount)}
Total: ${formatCurrency(order.total_amount)}

Shipping Address:
${buildTextAddress(order)}

Items:
${buildItemsText(items)}
            `.trim();

            const html = `
<!DOCTYPE html>
<html>
<body style="
    font-family:Arial,Helvetica,sans-serif;
    color:#222;
">

<h2>New Order Received</h2>

<p>
    <strong>Order Number:</strong>
    ${escapeHtml(orderNumber)}
</p>

<p>
    <strong>Customer:</strong>
    ${escapeHtml(order.shipping_name || "")}
</p>

<p>
    <strong>Email:</strong>
    ${escapeHtml(order.shipping_email || "")}
</p>

<p>
    <strong>Phone:</strong>
    ${escapeHtml(order.shipping_phone || "")}
</p>

<p>
    <strong>Order Status:</strong>
    ${escapeHtml(order.order_status || "")}
</p>

<p>
    <strong>Payment Status:</strong>
    ${escapeHtml(order.payment_status || "")}
</p>

<p>
    <strong>Total:</strong>
    ${formatCurrency(order.total_amount)}
</p>

<h3>Items</h3>

<pre style="
    font-family:Arial,Helvetica,sans-serif;
    white-space:pre-wrap;
">
${escapeHtml(buildItemsText(items))}
</pre>

</body>
</html>
            `.trim();

            const result = await sendEmail({
                to: adminEmail,
                subject,
                text,
                html
            });

            if (!result || !result.messageId) {
                throw new Error(
                    `SMTP did not return a message ID for admin order ${orderId}`
                );
            }

            console.log(
                `Admin order notification sent for order ${orderId}. Message ID: ${result.messageId}`
            );

            return result;
        } catch (error) {
            console.error(
                `Admin order notification failed for order ${orderId}`
            );
            console.error(error);

            return null;
        }
    };

export const sendOrderEmails = async (orderId) => {
    const customer =
        await sendOrderConfirmationEmail(orderId);

    const admin =
        await sendAdminOrderNotificationEmail(orderId);

    return {
        customer,
        admin
    };
};

