import pool from "../config/database.js";
import { sendEmail } from "../config/services/email.service.js";

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

export const sendOrderConfirmationEmail = async (
    orderId
) => {
    const numericOrderId =
        Number(orderId);

    if (
        !Number.isInteger(numericOrderId) ||
        numericOrderId <= 0
    ) {
        throw new Error(
            "Invalid order ID for confirmation email"
        );
    }

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

                created_at
            FROM orders
            WHERE id = ?
            LIMIT 1
            `,
            [numericOrderId]
        );

    if (orders.length === 0) {
        throw new Error(
            "Order not found for confirmation email"
        );
    }

    const order =
        orders[0];

    /*
    |--------------------------------------------------------------------------
    | EMAIL SAFETY CHECK
    |--------------------------------------------------------------------------
    |
    | NEVER send a confirmation email for:
    |
    | payment_status = pending
    | payment_status = failed
    | payment_status = refunded
    |
    | Only paid + confirmed orders are allowed.
    |
    */

    if (
        order.payment_status !== "paid"
    ) {
        console.log(
            `Confirmation email skipped for order ${order.id}: payment_status=${order.payment_status}`
        );

        return {
            sent: false,
            skipped: true,
            reason:
                "Order payment is not completed"
        };
    }

    if (
        order.order_status !== "confirmed"
    ) {
        console.log(
            `Confirmation email skipped for order ${order.id}: order_status=${order.order_status}`
        );

        return {
            sent: false,
            skipped: true,
            reason:
                "Order is not confirmed"
        };
    }

    if (
        !order.shipping_email
    ) {
        throw new Error(
            "Order does not have a customer email address"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    const [items] =
        await pool.execute(
            `
            SELECT
                id,
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
            [numericOrderId]
        );

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */

    const customerName =
        order.shipping_name?.trim() ||
        "there";

    /*
    |--------------------------------------------------------------------------
    | ITEM ROWS
    |--------------------------------------------------------------------------
    */

    const itemRows =
        items
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

    /*
    |--------------------------------------------------------------------------
    | ADDRESS
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | PLAIN TEXT EMAIL
    |--------------------------------------------------------------------------
    */

    const text = `
Hi ${customerName},

Thank you for shopping with UNTKN.

Your payment has been successfully verified and your order is confirmed.

Order: #${order.order_number}

${items
    .map(
        (item) =>
            `${item.product_name} × ${item.quantity} — ₹${formatMoney(
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

Shipping address:
${order.shipping_address_line1}
${order.shipping_address_line2 || ""}
${order.shipping_city}, ${order.shipping_state}
${order.shipping_postal_code}
${order.shipping_country}

Your order is now confirmed and will be processed shortly.

Thank you for choosing UNTKN.

With love,
UNTKN
`;

    /*
    |--------------------------------------------------------------------------
    | HTML EMAIL
    |--------------------------------------------------------------------------
    */

    const html = `
<!DOCTYPE html>

<html>

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width,initial-scale=1.0"
    >

    <title>
        UNTKN Order Confirmation
    </title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f5f5f3;
        font-family:Arial,Helvetica,sans-serif;
        color:#111;
    "
>

<div
    style="
        width:100%;
        padding:40px 16px;
        box-sizing:border-box;
    "
>

<div
    style="
        max-width:680px;
        margin:0 auto;
        background:#ffffff;
    "
>

<!-- HEADER -->

<div
    style="
        padding:38px 40px;
        border-bottom:1px solid #eeeeee;
        text-align:center;
    "
>

<div
    style="
        font-size:28px;
        letter-spacing:8px;
        font-weight:700;
    "
>
    UNTKN
</div>

<div
    style="
        margin-top:10px;
        font-size:10px;
        letter-spacing:3px;
        color:#888;
    "
>
    ORDER CONFIRMATION
</div>

</div>


<!-- CONTENT -->

<div
    style="
        padding:45px 40px;
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
        width:54px;
        height:54px;
        line-height:54px;
        border-radius:50%;
        background:#111;
        color:#fff;
        font-size:25px;
    "
>
    ✓
</div>

<h1
    style="
        margin:24px 0 10px;
        font-size:28px;
        font-weight:500;
    "
>
    Thank you,
    ${escapeHtml(customerName)}.
</h1>

<p
    style="
        margin:0;
        color:#666;
        font-size:15px;
        line-height:1.7;
    "
>
    Your payment has been successfully verified.
</p>

<p
    style="
        margin:8px 0 0;
        color:#666;
        font-size:15px;
        line-height:1.7;
    "
>
    Your order is now confirmed.
</p>

</div>


<!-- ORDER NUMBER -->

<div
    style="
        margin:38px 0;
        padding:22px;
        background:#f7f7f5;
        text-align:center;
    "
>

<div
    style="
        font-size:11px;
        letter-spacing:2px;
        color:#888;
    "
>
    ORDER NUMBER
</div>

<div
    style="
        margin-top:8px;
        font-size:19px;
        font-weight:600;
    "
>
    #${escapeHtml(
        order.order_number
    )}
</div>

</div>


<!-- ITEMS -->

<h2
    style="
        margin:0 0 18px;
        font-size:14px;
        letter-spacing:2px;
        font-weight:600;
    "
>
    YOUR ORDER
</h2>


<table
    style="
        width:100%;
        border-collapse:collapse;
    "
>

<thead>

<tr>

<th
    style="
        padding:0 0 12px;
        text-align:left;
        font-size:10px;
        letter-spacing:1.5px;
        color:#999;
        font-weight:500;
    "
>
    ITEM
</th>

<th
    style="
        padding:0 0 12px;
        text-align:center;
        font-size:10px;
        letter-spacing:1.5px;
        color:#999;
        font-weight:500;
    "
>
    QTY
</th>

<th
    style="
        padding:0 0 12px;
        text-align:right;
        font-size:10px;
        letter-spacing:1.5px;
        color:#999;
        font-weight:500;
    "
>
    PRICE
</th>

</tr>

</thead>

<tbody>

${itemRows}

</tbody>

</table>


<!-- TOTALS -->

<div
    style="
        margin-top:25px;
    "
>

<div
    style="
        display:flex;
        justify-content:space-between;
        padding:7px 0;
        font-size:14px;
        color:#666;
    "
>

<span>
    Subtotal
</span>

<span>
    ₹${formatMoney(order.subtotal)}
</span>

</div>


<div
    style="
        display:flex;
        justify-content:space-between;
        padding:7px 0;
        font-size:14px;
        color:#666;
    "
>

<span>
    Shipping
</span>

<span>
    ₹${formatMoney(
        order.shipping_fee
    )}
</span>

</div>


${
    Number(order.discount || 0) > 0
        ? `
<div
    style="
        display:flex;
        justify-content:space-between;
        padding:7px 0;
        font-size:14px;
        color:#666;
    "
>

<span>
    Discount
</span>

<span>
    -₹${formatMoney(
        order.discount
    )}
</span>

</div>
`
        : ""
}


<div
    style="
        margin-top:10px;
        padding-top:18px;
        border-top:1px solid #111;
        display:flex;
        justify-content:space-between;
        font-size:17px;
        font-weight:700;
    "
>

<span>
    Total
</span>

<span>
    ₹${formatMoney(
        order.total_amount
    )}
</span>

</div>

</div>


<!-- SHIPPING -->

<div
    style="
        margin-top:42px;
        padding-top:30px;
        border-top:1px solid #eeeeee;
    "
>

<h2
    style="
        margin:0 0 16px;
        font-size:14px;
        letter-spacing:2px;
        font-weight:600;
    "
>
    SHIPPING
</h2>

<div
    style="
        font-size:14px;
        color:#333;
        line-height:1.8;
    "
>
    Shipping included with your order.
</div>

</div>


<!-- ADDRESS -->

<div
    style="
        margin-top:32px;
        padding:25px;
        background:#f7f7f5;
    "
>

<h2
    style="
        margin:0 0 15px;
        font-size:14px;
        letter-spacing:2px;
        font-weight:600;
    "
>
    SHIPPING ADDRESS
</h2>

<div
    style="
        font-size:14px;
        line-height:1.8;
        color:#555;
    "
>
    ${addressLines}
</div>

</div>


<!-- FOOTER MESSAGE -->

<div
    style="
        margin-top:42px;
        text-align:center;
    "
>

<p
    style="
        margin:0;
        color:#555;
        font-size:14px;
        line-height:1.8;
    "
>
    Thank you for choosing UNTKN.
</p>

<p
    style="
        margin:7px 0 0;
        color:#555;
        font-size:14px;
        line-height:1.8;
    "
>
    We hope you love your order.
</p>

<p
    style="
        margin:22px 0 0;
        font-size:14px;
        font-weight:600;
    "
>
    With love,<br>
    UNTKN
</p>

</div>

</div>


<!-- DARK FOOTER -->

<div
    style="
        padding:25px 40px;
        background:#111;
        text-align:center;
    "
>

<div
    style="
        font-size:17px;
        letter-spacing:5px;
        color:#fff;
        font-weight:700;
    "
>
    UNTKN
</div>

<div
    style="
        margin-top:9px;
        font-size:10px;
        letter-spacing:2px;
        color:#999;
    "
>
    THANK YOU FOR SHOPPING WITH US
</div>

</div>

</div>

</div>

</body>

</html>
`;

    /*
    |--------------------------------------------------------------------------
    | SEND
    |--------------------------------------------------------------------------
    */

    const info =
        await sendEmail({
            to:
                order.shipping_email,

            subject:
                `Your UNTKN order #${order.order_number} is confirmed ✓`,

            text,

            html
        });

    console.log(
        `Order confirmation email sent for order ${order.id}`,
        {
            messageId:
                info?.messageId,

            accepted:
                info?.accepted,

            rejected:
                info?.rejected
        }
    );

    return {
        sent: true,
        messageId:
            info?.messageId || null
    };
};