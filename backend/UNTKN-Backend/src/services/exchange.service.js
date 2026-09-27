import pool from "../config/database.js";

import {
    sendEmail,
    getAdminEmail
} from "../config/services/email.service.js";

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const sendExchangeRequestEmails = async (
    exchangeRequestId
) => {
    const [requests] = await pool.execute(
        `
        SELECT
            er.id,
            er.order_id,
            er.order_item_id,
            er.reason,
            er.details,
            er.requested_size,
            er.status,
            er.created_at,

            o.order_number,
            o.shipping_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address_line1,
            o.shipping_address_line2,
            o.shipping_city,
            o.shipping_state,
            o.shipping_postal_code,
            o.shipping_country,

            oi.product_name,
            oi.sku,
            oi.size_name,
            oi.color_name,
            oi.quantity,
            oi.unit_price,
            oi.total_price

        FROM exchange_requests er

        INNER JOIN orders o
            ON er.order_id = o.id

        INNER JOIN order_items oi
            ON er.order_item_id = oi.id

        WHERE er.id = ?

        LIMIT 1
        `,
        [exchangeRequestId]
    );

    if (requests.length === 0) {
        throw new Error(
            `Exchange request ${exchangeRequestId} not found`
        );
    }

    const request = requests[0];

    const customerEmail = String(
        request.shipping_email || ""
    ).trim();

    if (!customerEmail) {
        throw new Error(
            `Customer email missing for exchange request ${exchangeRequestId}`
        );
    }

    const adminEmail = getAdminEmail();

    const customerName =
        String(
            request.shipping_name || ""
        ).trim() || "Customer";

    const orderNumber =
        request.order_number ||
        `#${request.order_id}`;

    const requestedSize =
        request.requested_size ||
        "Not specified";

    const details =
        request.details ||
        "No additional details provided.";

    const customerText = `
Hi ${customerName},

We have received your exchange request.

ORDER
-----
${orderNumber}

PRODUCT
-------
${request.product_name}

CURRENT SIZE
------------
${request.size_name || "Not specified"}

REQUESTED SIZE
--------------
${requestedSize}

REASON
------
${request.reason}

ADDITIONAL DETAILS
------------------
${details}

EXCHANGE STATUS
---------------
REQUESTED

Our team will review your request and process the exchange shortly.

You will receive another update when the exchange request progresses.

With love,
UNTKN
`.trim();

    const customerHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>UNTKN Exchange Request</title>
</head>

<body
    style="
        margin:0;
        padding:30px;
        background:#f4f4f2;
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
    width="680"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:680px;
        background:#fff;
    "
>

<tr>
<td
    align="center"
    style="
        padding:35px 25px;
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
            margin-top:10px;
            font-size:10px;
            letter-spacing:3px;
            color:#888;
        "
    >
        EXCHANGE REQUEST
    </div>
</td>
</tr>

<tr>
<td style="padding:40px 30px;">

    <h1
        style="
            margin:0;
            font-size:25px;
            font-weight:500;
        "
    >
        Exchange request received
    </h1>

    <p
        style="
            color:#666;
            line-height:1.7;
        "
    >
        Hi ${escapeHtml(customerName)}, your exchange request has been successfully submitted.
    </p>

    <div
        style="
            margin-top:25px;
            padding:20px;
            background:#f7f7f5;
        "
    >
        <strong>ORDER</strong>

        <div style="margin-top:8px;">
            #${escapeHtml(orderNumber)}
        </div>
    </div>

    <div
        style="
            margin-top:15px;
            padding:20px;
            background:#f7f7f5;
        "
    >
        <strong>PRODUCT</strong>

        <div style="margin-top:8px;">
            ${escapeHtml(request.product_name)}
        </div>

        <div
            style="
                margin-top:8px;
                color:#666;
            "
        >
            Current Size:
            ${escapeHtml(
                request.size_name || "Not specified"
            )}
        </div>

        <div
            style="
                margin-top:5px;
                color:#666;
            "
        >
            Requested Size:
            ${escapeHtml(requestedSize)}
        </div>
    </div>

    <div
        style="
            margin-top:15px;
            padding:20px;
            background:#f7f7f5;
        "
    >
        <strong>REASON</strong>

        <div style="margin-top:8px;">
            ${escapeHtml(request.reason)}
        </div>
    </div>

    <div
        style="
            margin-top:15px;
            padding:20px;
            background:#f7f7f5;
        "
    >
        <strong>DETAILS</strong>

        <div
            style="
                margin-top:8px;
                color:#666;
                line-height:1.7;
            "
        >
            ${escapeHtml(details)}
        </div>
    </div>

    <div
        style="
            margin-top:25px;
            padding:18px;
            background:#111;
            color:#fff;
            text-align:center;
            letter-spacing:2px;
            font-size:12px;
        "
    >
        EXCHANGE REQUESTED
    </div>

    <p
        style="
            margin-top:30px;
            color:#666;
            line-height:1.7;
        "
    >
        Our team will review your request and process the exchange shortly.
    </p>

</td>
</tr>

<tr>
<td
    align="center"
    style="
        padding:25px;
        background:#111;
        color:#fff;
    "
>
    <div
        style="
            font-size:17px;
            letter-spacing:5px;
            font-weight:700;
        "
    >
        UNTKN
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

    const adminText = `
NEW UNTKN EXCHANGE REQUEST

Order:
#${orderNumber}

Customer:
${customerName}

Email:
${customerEmail}

Phone:
${request.shipping_phone || ""}

Product:
${request.product_name}

SKU:
${request.sku || ""}

Current Size:
${request.size_name || "Not specified"}

Color:
${request.color_name || "Not specified"}

Requested Size:
${requestedSize}

Quantity:
${request.quantity}

Reason:
${request.reason}

Details:
${details}

Status:
REQUESTED

Shipping Address:
${request.shipping_address_line1 || ""}
${request.shipping_address_line2 || ""}
${request.shipping_city || ""}, ${request.shipping_state || ""}
${request.shipping_postal_code || ""}
${request.shipping_country || ""}
`.trim();

    const adminHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New UNTKN Exchange Request</title>
</head>

<body
    style="
        margin:0;
        padding:30px;
        background:#f4f4f2;
        font-family:Arial,Helvetica,sans-serif;
        color:#111;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
>
<tr>
<td align="center">

<table
    width="700"
    cellpadding="0"
    cellspacing="0"
    style="
        max-width:700px;
        width:100%;
        background:#fff;
    "
>

<tr>
<td
    align="center"
    style="
        padding:30px;
        background:#111;
        color:#fff;
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
            color:#aaa;
        "
    >
        NEW EXCHANGE REQUEST
    </div>
</td>
</tr>

<tr>
<td style="padding:30px;">

<h1
    style="
        margin:0;
        font-size:24px;
    "
>
    Exchange Request #${escapeHtml(
        String(request.id)
    )}
</h1>

<div
    style="
        margin-top:25px;
        padding:20px;
        background:#f7f7f5;
        line-height:1.8;
    "
>
    <strong>CUSTOMER</strong>

    <br>

    ${escapeHtml(customerName)}

    <br>

    ${escapeHtml(customerEmail)}

    <br>

    ${escapeHtml(
        request.shipping_phone || ""
    )}
</div>

<div
    style="
        margin-top:15px;
        padding:20px;
        background:#f7f7f5;
        line-height:1.8;
    "
>
    <strong>ORDER</strong>

    <br>

    #${escapeHtml(orderNumber)}
</div>

<div
    style="
        margin-top:15px;
        padding:20px;
        background:#f7f7f5;
        line-height:1.8;
    "
>
    <strong>PRODUCT</strong>

    <br>

    ${escapeHtml(request.product_name)}

    <br>

    SKU:
    ${escapeHtml(request.sku || "N/A")}

    <br>

    Current Size:
    ${escapeHtml(
        request.size_name || "N/A"
    )}

    <br>

    Color:
    ${escapeHtml(
        request.color_name || "N/A"
    )}

    <br>

    Requested Size:
    ${escapeHtml(requestedSize)}
</div>

<div
    style="
        margin-top:15px;
        padding:20px;
        background:#f7f7f5;
        line-height:1.8;
    "
>
    <strong>REASON</strong>

    <br>

    ${escapeHtml(request.reason)}
</div>

<div
    style="
        margin-top:15px;
        padding:20px;
        background:#f7f7f5;
        line-height:1.8;
    "
>
    <strong>DETAILS</strong>

    <br>

    ${escapeHtml(details)}
</div>

<div
    style="
        margin-top:25px;
        padding:18px;
        background:#111;
        color:#fff;
        text-align:center;
        letter-spacing:2px;
    "
>
    ACTION REQUIRED
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

    const results = await Promise.allSettled([
        sendEmail({
            to: customerEmail,
            subject:
                `UNTKN Exchange Request Received #${orderNumber}`,
            text: customerText,
            html: customerHtml
        }),

        sendEmail({
            to: adminEmail,
            subject:
                `New UNTKN Exchange Request #${orderNumber}`,
            text: adminText,
            html: adminHtml
        })
    ]);

    return {
        customer:
            results[0].status === "fulfilled",

        admin:
            results[1].status === "fulfilled",

        customerResult:
            results[0],

        adminResult:
            results[1]
    };
};