import pool from "../config/database.js";
import { sendEmail } from "./email.service.js";

const getOrderData = async (orderId) => {
    if (!orderId || !Number.isInteger(Number(orderId))) {
        throw new Error("Invalid order ID");
    }

    const [orders] = await pool.execute(
        `
        SELECT
            o.id,
            o.order_number,
            o.user_id,
            o.payment_status,
            o.order_status,
            o.shipping_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_state,
            o.shipping_postal_code,
            o.shipping_country,
            o.subtotal,
            o.shipping_cost,
            o.tax,
            o.discount,
            o.total_amount,
            o.payment_method,
            o.created_at
        FROM orders o
        WHERE o.id = ?
        LIMIT 1
        `,
        [Number(orderId)]
    );

    if (orders.length === 0) {
        throw new Error(`Order ${orderId} not found`);
    }

    const order = orders[0];

    if (!order.shipping_email) {
        throw new Error(`Shipping email missing for order ${orderId}`);
    }

    const [items] = await pool.execute(
        `
        SELECT
            oi.id,
            oi.product_id,
            oi.product_name,
            oi.quantity,
            oi.price,
            oi.total_price,
            oi.size,
            oi.color
        FROM order_items oi
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC
        `,
        [Number(orderId)]
    );

    return {
        order,
        items
    };
};

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
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
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

const buildOrderItemsHtml = (items) => {
    if (!items || items.length === 0) {
        return `
            <tr>
                <td colspan="5" style="padding:20px;text-align:center;">
                    No order items found.
                </td>
            </tr>
        `;
    }

    return items
        .map((item) => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const totalPrice =
                item.total_price !== null &&
                item.total_price !== undefined
                    ? Number(item.total_price)
                    : price * quantity;

            const options = [
                item.size ? `Size: ${escapeHtml(item.size)}` : "",
                item.color ? `Color: ${escapeHtml(item.color)}` : ""
            ]
                .filter(Boolean)
                .join(" | ");

            return `
                <tr>
                    <td style="padding:12px;border-bottom:1px solid #eeeeee;">
                        <strong>${escapeHtml(item.product_name || "Product")}</strong>
                        ${
                            options
                                ? `<div style="font-size:12px;color:#777;margin-top:4px;">${options}</div>`
                                : ""
                        }
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #eeeeee;text-align:center;">
                        ${quantity}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #eeeeee;text-align:right;">
                        ${formatCurrency(price)}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #eeeeee;text-align:right;">
                        ${formatCurrency(totalPrice)}
                    </td>
                </tr>
            `;
        })
        .join("");
};

const buildCustomerEmail = ({ order, items }) => {
    const customerName = escapeHtml(
        order.shipping_name || "Customer"
    );

    const orderNumber = escapeHtml(
        order.order_number || `#${order.id}`
    );

    const paymentMethod = escapeHtml(
        order.payment_method || "Cash on Delivery"
    );

    const paymentStatus = escapeHtml(
        order.payment_status || "pending"
    );

    const orderStatus = escapeHtml(
        order.order_status || "confirmed"
    );

    const shippingAddress = [
        order.shipping_address,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(", ");

    const subtotal = Number(order.subtotal || 0);
    const shippingCost = Number(order.shipping_cost || 0);
    const tax = Number(order.tax || 0);
    const discount = Number(order.discount || 0);
    const total = Number(order.total_amount || 0);

    const text = `
Hello ${order.shipping_name || "Customer"},

Thank you for shopping with UNTKN.

Your order has been confirmed successfully.

Order Number: ${order.order_number || `#${order.id}`}
Order Date: ${formatDate(order.created_at)}
Order Status: ${order.order_status || "confirmed"}
Payment Method: ${order.payment_method || "Cash on Delivery"}
Payment Status: ${order.payment_status || "pending"}

Shipping Address:
${shippingAddress}

Order Items:
${items
    .map(
        (item) =>
            `${item.product_name} x ${item.quantity} - ${formatCurrency(
                item.total_price || Number(item.price || 0) * Number(item.quantity || 0)
            )}`
    )
    .join("\n")}

Subtotal: ${formatCurrency(subtotal)}
Shipping: ${formatCurrency(shippingCost)}
Tax: ${formatCurrency(tax)}
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
    <title>Order Confirmation</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">

    <div style="max-width:700px;margin:30px auto;background:#ffffff;">

        <div style="background:#111111;color:#ffffff;padding:30px;text-align:center;">
            <h1 style="margin:0;font-size:30px;letter-spacing:3px;">
                UNTKN
            </h1>

            <p style="margin:10px 0 0;color:#dddddd;">
                Order Confirmation
            </p>
        </div>

        <div style="padding:30px;">

            <h2 style="margin-top:0;">
                Thank you, ${customerName}!
            </h2>

            <p>
                Your order has been successfully confirmed.
            </p>

            <div style="background:#f7f7f7;padding:20px;margin:25px 0;">
                <p style="margin:0 0 8px;">
                    <strong>Order Number:</strong> ${orderNumber}
                </p>

                <p style="margin:0 0 8px;">
                    <strong>Order Date:</strong>
                    ${formatDate(order.created_at)}
                </p>

                <p style="margin:0 0 8px;">
                    <strong>Order Status:</strong>
                    ${orderStatus}
                </p>

                <p style="margin:0 0 8px;">
                    <strong>Payment Method:</strong>
                    ${paymentMethod}
                </p>

                <p style="margin:0;">
                    <strong>Payment Status:</strong>
                    ${paymentStatus}
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
                    <tr style="background:#111111;color:#ffffff;">
                        <th style="padding:12px;text-align:left;">
                            Product
                        </th>

                        <th style="padding:12px;text-align:center;">
                            Qty
                        </th>

                        <th style="padding:12px;text-align:right;">
                            Price
                        </th>

                        <th style="padding:12px;text-align:right;">
                            Total
                        </th>
                    </tr>
                </thead>

                <tbody>
                    ${buildOrderItemsHtml(items)}
                </tbody>
            </table>

            <div style="margin-top:25px;text-align:right;">

                <p>
                    <strong>Subtotal:</strong>
                    ${formatCurrency(subtotal)}
                </p>

                <p>
                    <strong>Shipping:</strong>
                    ${formatCurrency(shippingCost)}
                </p>

                <p>
                    <strong>Tax:</strong>
                    ${formatCurrency(tax)}
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

            <div style="margin-top:30px;padding:20px;background:#f7f7f7;">

                <h3 style="margin-top:0;">
                    Shipping Address
                </h3>

                <p style="margin-bottom:0;">
                    ${shippingAddress || "Address not available"}
                </p>

            </div>

            <p style="margin-top:30px;">
                We appreciate your order and will keep you updated about
                its progress.
            </p>

            <p>
                Regards,<br>
                <strong>UNTKN</strong>
            </p>

        </div>

        <div style="background:#111111;color:#aaaaaa;padding:20px;text-align:center;font-size:12px;">
            This is an automated order confirmation email from UNTKN.
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

    const { order, items } = await getOrderData(orderId);

    const customerEmail = order.shipping_email;

    const orderNumber =
        order.order_number || `#${order.id}`;

    const subject =
        `Order Confirmed - ${orderNumber} | UNTKN`;

    const { text, html } = buildCustomerEmail({
        order,
        items
    });

    const result = await sendEmail({
        to: customerEmail,
        subject,
        text,
        html
    });

    if (!result || !result.messageId) {
        throw new Error(
            `Email service did not return a valid message ID for order ${orderId}`
        );
    }

    console.log(
        `Customer order confirmation sent successfully to ${customerEmail}. Message ID: ${result.messageId}`
    );

    return result;
};

export const sendAdminOrderNotification = async (orderId) => {
    try {
        const { order, items } = await getOrderData(orderId);

const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.MAIL_FROM ||
    process.env.SMTP_USER;

        if (!adminEmail) {
            console.warn(
                `Admin email not configured for order ${orderId}`
            );

            return null;
        }

        const orderNumber =
            order.order_number || `#${order.id}`;

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
Payment Method: ${order.payment_method || ""}

Total: ${formatCurrency(order.total_amount)}

Items:
${items
    .map(
        (item) =>
            `${item.product_name} x ${item.quantity} - ${formatCurrency(
                item.total_price || Number(item.price || 0) * Number(item.quantity || 0)
            )}`
    )
    .join("\n")}
        `.trim();

        const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;">

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
        <strong>Payment Method:</strong>
        ${escapeHtml(order.payment_method || "")}
    </p>

    <p>
        <strong>Total:</strong>
        ${formatCurrency(order.total_amount)}
    </p>

    <h3>Items</h3>

    <ul>
        ${items
            .map(
                (item) =>
                    `<li>${escapeHtml(item.product_name)} x ${Number(
                        item.quantity || 0
                    )} - ${formatCurrency(
                        item.total_price ||
                            Number(item.price || 0) *
                                Number(item.quantity || 0)
                    )}</li>`
            )
            .join("")}
    </ul>

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
                `Email service did not return a valid message ID for admin notification of order ${orderId}`
            );
        }

        console.log(
            `Admin order notification sent successfully for order ${orderId}. Message ID: ${result.messageId}`
        );

        return result;
    } catch (error) {
        console.error(
            `Admin order notification failed for order ${orderId}:`
        );
        console.error(error);

        return null;
    }
};

export const sendOrderEmails = async (orderId) => {
    const customerResult =
        await sendOrderConfirmationEmail(orderId);

    const adminResult =
        await sendAdminOrderNotification(orderId);

    return {
        customer: customerResult,
        admin: adminResult
    };
};
