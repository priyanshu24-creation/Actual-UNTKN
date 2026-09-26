import pool from "../database.js";
import {
    sendEmail,
    getAdminEmail
} from "./email.service.js";

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
    const value =
        String(notes || "").toLowerCase();

    if (value.includes("express")) {
        return {
            name: "EXPRESS DELIVERY",
            description:
                "2–3 BUSINESS DAYS"
        };
    }

    return {
        name: "STANDARD DELIVERY",
        description:
            "5–7 BUSINESS DAYS"
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

    if (!orders.length) {
        throw new Error(
            `Order ${orderId} was not found`
        );
    }

    const order = orders[0];

    const customerEmail =
        String(
            order.shipping_email || ""
        ).trim();

    if (!customerEmail) {
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
        order: {
            ...order,
            shipping_email:
                customerEmail
        },
        items,
        delivery:
            getDeliveryDetails(order.notes)
    };
};

const createItemRows = (items) => {
    if (!items.length) {
        return `
            <tr>
                <td
                    colspan="3"
                    style="
                        padding:20px 0;
                        color:#666;
                        text-align:center;
                    "
                >
                    No order items found.
                </td>
            </tr>
        `;
    }

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
                    <td
                        style="
                            padding:16px 0;
                            border-bottom:1px solid #e8e8e8;
                            font-size:14px;
                            color:#111;
                        "
                    >
                        <strong>
                            ${escapeHtml(
                                item.product_name
                            )}
                        </strong>

                        ${
                            options
                                ? `
                                    <div
                                        style="
                                            margin-top:5px;
                                            font-size:12px;
                                            color:#777;
                                        "
                                    >
                                        ${options}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            item.sku
                                ? `
                                    <div
                                        style="
                                            margin-top:4px;
                                            font-size:11px;
                                            color:#999;
                                        "
                                    >
                                        SKU:
                                        ${escapeHtml(
                                            item.sku
                                        )}
                                    </div>
                                `
                                : ""
                        }
                    </td>

                    <td
                        style="
                            padding:16px 8px;
                            border-bottom:1px solid #e8e8e8;
                            text-align:center;
                            font-size:14px;
                            color:#555;
                        "
                    >
                        ${Number(
                            item.quantity || 0
                        )}
                    </td>

                    <td
                        style="
                            padding:16px 0;
                            border-bottom:1px solid #e8e8e8;
                            text-align:right;
                            font-size:14px;
                            font-weight:600;
                            color:#111;
                        "
                    >
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
        console.log(
            `Starting customer confirmation email for order ${orderId}`
        );

        const {
            order,
            items,
            delivery
        } =
            await getOrderData(orderId);

        const customerName =
            String(
                order.shipping_name || ""
            ).trim() || "there";

        const customerEmail =
            String(
                order.shipping_email || ""
            ).trim();

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
            `UNTKN Order Confirmation #${order.order_number}`;

        const itemText = items.length
            ? items
                  .map(
                      (item) =>
                          `${item.product_name} x ${item.quantity} - ₹${formatMoney(
                              item.total_price
                          )}`
                  )
                  .join("\n")
            : "No order items found.";

        const text = `
Hi ${customerName},

Thank you for shopping with UNTKN.

Your order has been successfully confirmed.

ORDER DETAILS
-------------
Order Number: #${order.order_number}
Payment Status: ${order.payment_status}
Order Status: ${order.order_status}

ITEMS
-----
${itemText}

Subtotal: ₹${formatMoney(
            order.subtotal
        )}
Shipping: ₹${formatMoney(
            order.shipping_fee
        )}
Discount: ₹${formatMoney(
            order.discount
        )}
Total: ₹${formatMoney(
            order.total_amount
        )}

DELIVERY
--------
${delivery.name}
${delivery.description}

SHIPPING ADDRESS
----------------
${order.shipping_address_line1 || ""}
${order.shipping_address_line2 || ""}
${order.shipping_city || ""}, ${
            order.shipping_state || ""
        }
${order.shipping_postal_code || ""}
${order.shipping_country || ""}

Thank you for choosing UNTKN.

With love,
UNTKN
`.trim();

        const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        UNTKN Order Confirmation
    </title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f4f4f2;
        font-family:Arial,Helvetica,sans-serif;
        color:#111111;
    "
>

    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            width:100%;
            background:#f4f4f2;
            margin:0;
            padding:0;
        "
    >
        <tr>
            <td
                align="center"
                style="
                    padding:30px 15px;
                "
            >

                <table
                    width="680"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        width:100%;
                        max-width:680px;
                        background:#ffffff;
                        border-collapse:collapse;
                    "
                >

                    <tr>
                        <td
                            align="center"
                            style="
                                padding:35px 25px;
                                border-bottom:1px solid #eeeeee;
                            "
                        >

                            <div
                                style="
                                    font-size:28px;
                                    line-height:32px;
                                    font-weight:700;
                                    letter-spacing:7px;
                                "
                            >
                                UNTKN
                            </div>

                            <div
                                style="
                                    margin-top:10px;
                                    font-size:10px;
                                    line-height:14px;
                                    letter-spacing:3px;
                                    color:#888888;
                                "
                            >
                                ORDER CONFIRMATION
                            </div>

                        </td>
                    </tr>

                    <tr>
                        <td
                            style="
                                padding:40px 30px;
                            "
                        >

                            <div
                                style="
                                    text-align:center;
                                "
                            >

                                <div
                                    style="
                                        display:inline-block;
                                        width:50px;
                                        height:50px;
                                        line-height:50px;
                                        border-radius:50%;
                                        background:#111111;
                                        color:#ffffff;
                                        font-size:24px;
                                        font-weight:bold;
                                    "
                                >
                                    ✓
                                </div>

                                <h1
                                    style="
                                        margin:22px 0 10px;
                                        font-size:25px;
                                        line-height:32px;
                                        font-weight:500;
                                        color:#111111;
                                    "
                                >
                                    Thank you,
                                    ${escapeHtml(
                                        customerName
                                    )}.
                                </h1>

                                <p
                                    style="
                                        margin:0;
                                        font-size:14px;
                                        line-height:22px;
                                        color:#666666;
                                    "
                                >
                                    Your order has been successfully confirmed.
                                </p>

                            </div>

                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin-top:30px;
                                    background:#f7f7f5;
                                    border-collapse:collapse;
                                "
                            >
                                <tr>
                                    <td
                                        align="center"
                                        style="
                                            padding:20px;
                                        "
                                    >

                                        <div
                                            style="
                                                font-size:10px;
                                                line-height:14px;
                                                letter-spacing:2px;
                                                color:#888888;
                                            "
                                        >
                                            ORDER NUMBER
                                        </div>

                                        <div
                                            style="
                                                margin-top:7px;
                                                font-size:18px;
                                                line-height:25px;
                                                font-weight:700;
                                                color:#111111;
                                            "
                                        >
                                            #${escapeHtml(
                                                order.order_number
                                            )}
                                        </div>

                                    </td>
                                </tr>
                            </table>

                            <h2
                                style="
                                    margin:35px 0 15px;
                                    font-size:13px;
                                    line-height:18px;
                                    letter-spacing:2px;
                                    font-weight:700;
                                    color:#111111;
                                "
                            >
                                YOUR ORDER
                            </h2>

                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    width:100%;
                                    border-collapse:collapse;
                                "
                            >

                                <tr>
                                    <th
                                        align="left"
                                        style="
                                            padding:0 0 10px;
                                            font-size:10px;
                                            color:#999999;
                                            letter-spacing:1px;
                                        "
                                    >
                                        ITEM
                                    </th>

                                    <th
                                        align="center"
                                        style="
                                            padding:0 5px 10px;
                                            font-size:10px;
                                            color:#999999;
                                            letter-spacing:1px;
                                        "
                                    >
                                        QTY
                                    </th>

                                    <th
                                        align="right"
                                        style="
                                            padding:0 0 10px;
                                            font-size:10px;
                                            color:#999999;
                                            letter-spacing:1px;
                                        "
                                    >
                                        PRICE
                                    </th>
                                </tr>

                                ${itemRows}

                            </table>

                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin-top:20px;
                                    border-collapse:collapse;
                                "
                            >

                                <tr>
                                    <td
                                        style="
                                            padding:6px 0;
                                            font-size:14px;
                                            color:#666666;
                                        "
                                    >
                                        Subtotal
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:6px 0;
                                            font-size:14px;
                                            color:#666666;
                                        "
                                    >
                                        ₹${formatMoney(
                                            order.subtotal
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td
                                        style="
                                            padding:6px 0;
                                            font-size:14px;
                                            color:#666666;
                                        "
                                    >
                                        Shipping
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:6px 0;
                                            font-size:14px;
                                            color:#666666;
                                        "
                                    >
                                        ₹${formatMoney(
                                            order.shipping_fee
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td
                                        style="
                                            padding:6px 0;
                                            font-size:14px;
                                            color:#666666;
                                        "
                                    >
                                        Discount
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:6px 0;
                                            font-size:14px;
                                            color:#666666;
                                        "
                                    >
                                        ₹${formatMoney(
                                            order.discount
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td
                                        style="
                                            padding:15px 0 5px;
                                            border-top:1px solid #111111;
                                            font-size:16px;
                                            font-weight:700;
                                        "
                                    >
                                        Total
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:15px 0 5px;
                                            border-top:1px solid #111111;
                                            font-size:16px;
                                            font-weight:700;
                                        "
                                    >
                                        ₹${formatMoney(
                                            order.total_amount
                                        )}
                                    </td>
                                </tr>

                            </table>

                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin-top:35px;
                                    border-collapse:collapse;
                                "
                            >
                                <tr>
                                    <td
                                        style="
                                            padding:20px;
                                            background:#f7f7f5;
                                        "
                                    >

                                        <div
                                            style="
                                                font-size:13px;
                                                line-height:18px;
                                                font-weight:700;
                                                letter-spacing:1px;
                                            "
                                        >
                                            DELIVERY
                                        </div>

                                        <div
                                            style="
                                                margin-top:10px;
                                                font-size:14px;
                                                line-height:22px;
                                                color:#555555;
                                            "
                                        >
                                            <strong>
                                                ${escapeHtml(
                                                    delivery.name
                                                )}
                                            </strong>

                                            <br>

                                            ${escapeHtml(
                                                delivery.description
                                            )}
                                        </div>

                                    </td>
                                </tr>
                            </table>

                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin-top:20px;
                                    border-collapse:collapse;
                                "
                            >
                                <tr>
                                    <td
                                        style="
                                            padding:20px;
                                            background:#f7f7f5;
                                        "
                                    >

                                        <div
                                            style="
                                                font-size:13px;
                                                line-height:18px;
                                                font-weight:700;
                                                letter-spacing:1px;
                                            "
                                        >
                                            SHIPPING ADDRESS
                                        </div>

                                        <div
                                            style="
                                                margin-top:10px;
                                                font-size:14px;
                                                line-height:23px;
                                                color:#555555;
                                            "
                                        >
                                            ${addressLines}
                                        </div>

                                    </td>
                                </tr>
                            </table>

                            <div
                                style="
                                    margin-top:35px;
                                    text-align:center;
                                "
                            >

                                <p
                                    style="
                                        margin:0;
                                        font-size:14px;
                                        line-height:22px;
                                        color:#555555;
                                    "
                                >
                                    Thank you for choosing UNTKN.
                                </p>

                                <p
                                    style="
                                        margin:8px 0 0;
                                        font-size:14px;
                                        line-height:22px;
                                        color:#555555;
                                    "
                                >
                                    We hope you love your order.
                                </p>

                                <p
                                    style="
                                        margin:20px 0 0;
                                        font-size:14px;
                                        line-height:22px;
                                        font-weight:700;
                                    "
                                >
                                    With love,<br>
                                    UNTKN
                                </p>

                            </div>

                        </td>
                    </tr>

                    <tr>
                        <td
                            align="center"
                            style="
                                padding:25px;
                                background:#111111;
                            "
                        >

                            <div
                                style="
                                    font-size:17px;
                                    line-height:22px;
                                    letter-spacing:5px;
                                    font-weight:700;
                                    color:#ffffff;
                                "
                            >
                                UNTKN
                            </div>

                            <div
                                style="
                                    margin-top:8px;
                                    font-size:9px;
                                    line-height:14px;
                                    letter-spacing:2px;
                                    color:#999999;
                                "
                            >
                                THANK YOU FOR SHOPPING WITH US
                            </div>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`.trim();

        console.log(
            `Sending customer order confirmation to ${customerEmail} for order ${order.order_number}`
        );

        const result =
            await sendEmail({
                to: customerEmail,
                subject,
                text,
                html
            });

        console.log(
            `Customer order confirmation completed for ${customerEmail}. Message ID: ${result.messageId}`
        );

        return result;
    };

export const sendAdminOrderNotificationEmail =
    async (orderId) => {
        const {
            order,
            items,
            delivery
        } =
            await getOrderData(orderId);

        const adminEmail =
            getAdminEmail();

        const itemRows = items
            .map(
                (item) => `
                    <tr>
                        <td
                            style="
                                padding:10px;
                                border-bottom:1px solid #eee;
                            "
                        >
                            ${escapeHtml(
                                item.product_name
                            )}
                        </td>

                        <td
                            style="
                                padding:10px;
                                border-bottom:1px solid #eee;
                                text-align:center;
                            "
                        >
                            ${Number(
                                item.quantity || 0
                            )}
                        </td>

                        <td
                            style="
                                padding:10px;
                                border-bottom:1px solid #eee;
                                text-align:right;
                            "
                        >
                            ₹${formatMoney(
                                item.total_price
                            )}
                        </td>
                    </tr>
                `
            )
            .join("");

        const subject =
            `New UNTKN Order #${order.order_number}`;

        const text = `
New UNTKN order received.

Order: #${order.order_number}

Customer:
${order.shipping_name || ""}
${order.shipping_email || ""}
${order.shipping_phone || ""}

Delivery:
${delivery.name}
${delivery.description}

Shipping Address:
${order.shipping_address_line1 || ""}
${order.shipping_address_line2 || ""}
${order.shipping_city || ""}, ${
            order.shipping_state || ""
        }
${order.shipping_postal_code || ""}
${order.shipping_country || ""}

Items:
${items
    .map(
        (item) =>
            `${item.product_name} x ${item.quantity} - ₹${formatMoney(
                item.total_price
            )}`
    )
    .join("\n")}

Subtotal: ₹${formatMoney(
            order.subtotal
        )}

Shipping: ₹${formatMoney(
            order.shipping_fee
        )}

Discount: ₹${formatMoney(
            order.discount
        )}

Total: ₹${formatMoney(
            order.total_amount
        )}

Payment status: ${order.payment_status}
Order status: ${order.order_status}
`.trim();

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>New UNTKN Order</title>
</head>

<body
    style="
        margin:0;
        padding:30px;
        background:#f5f5f3;
        font-family:Arial,Helvetica,sans-serif;
        color:#111;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
<tr>
<td align="center">

<table
    width="700"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:700px;
        background:#ffffff;
    "
>

<tr>
<td
    align="center"
    style="
        padding:30px;
        border-bottom:1px solid #eee;
    "
>
    <div
        style="
            font-size:28px;
            font-weight:700;
            letter-spacing:7px;
        "
    >
        UNTKN
    </div>

    <div
        style="
            margin-top:8px;
            font-size:10px;
            letter-spacing:2px;
            color:#888;
        "
    >
        NEW ORDER RECEIVED
    </div>
</td>
</tr>

<tr>
<td style="padding:30px;">

    <h1
        style="
            margin:0 0 10px;
            font-size:24px;
        "
    >
        New Order #${escapeHtml(
            order.order_number
        )}
    </h1>

    <p
        style="
            color:#666;
            line-height:1.7;
        "
    >
        A new order has been placed on UNTKN.
    </p>

    <h2
        style="
            margin-top:30px;
            font-size:14px;
            letter-spacing:2px;
        "
    >
        CUSTOMER
    </h2>

    <div
        style="
            padding:20px;
            background:#f7f7f5;
            line-height:1.8;
        "
    >
        <strong>
            ${escapeHtml(
                order.shipping_name
            )}
        </strong>

        <br>

        ${escapeHtml(
            order.shipping_email
        )}

        <br>

        ${escapeHtml(
            order.shipping_phone
        )}
    </div>

    <h2
        style="
            margin-top:30px;
            font-size:14px;
            letter-spacing:2px;
        "
    >
        DELIVERY
    </h2>

    <div
        style="
            padding:20px;
            background:#f7f7f5;
            line-height:1.8;
        "
    >
        <strong>
            ${escapeHtml(
                delivery.name
            )}
        </strong>

        <br>

        ${escapeHtml(
            delivery.description
        )}
    </div>

    <h2
        style="
            margin-top:30px;
            font-size:14px;
            letter-spacing:2px;
        "
    >
        SHIPPING ADDRESS
    </h2>

    <div
        style="
            padding:20px;
            background:#f7f7f5;
            line-height:1.8;
        "
    >
        ${escapeHtml(
            order.shipping_address_line1
        )}

        <br>

        ${
            order.shipping_address_line2
                ? `${escapeHtml(
                      order.shipping_address_line2
                  )}<br>`
                : ""
        }

        ${escapeHtml(
            order.shipping_city
        )},
        ${escapeHtml(
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
    </div>

    <h2
        style="
            margin-top:30px;
            font-size:14px;
            letter-spacing:2px;
        "
    >
        ORDER ITEMS
    </h2>

    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            width:100%;
            border-collapse:collapse;
        "
    >

        <tr>
            <th
                align="left"
                style="padding:10px;"
            >
                PRODUCT
            </th>

            <th
                align="center"
                style="padding:10px;"
            >
                QTY
            </th>

            <th
                align="right"
                style="padding:10px;"
            >
                TOTAL
            </th>
        </tr>

        ${itemRows}

    </table>

    <div
        style="
            margin-top:25px;
            border-top:1px solid #111;
            padding-top:20px;
            font-size:16px;
            font-weight:700;
        "
    >
        Total:
        ₹${formatMoney(
            order.total_amount
        )}
    </div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`.trim();

        return sendEmail({
            to: adminEmail,
            subject,
            text,
            html
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