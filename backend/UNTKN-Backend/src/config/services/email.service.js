import nodemailer from "nodemailer";

const SMTP_HOST =
    process.env.SMTP_HOST || "smtp.hostinger.com";

const SMTP_PORT =
    Number(process.env.SMTP_PORT || 465);

const SMTP_USER =
    String(process.env.SMTP_USER || "").trim();

const SMTP_PASSWORD =
    String(process.env.SMTP_PASSWORD || "");

const SMTP_FROM_EMAIL =
    String(
        process.env.SMTP_FROM_EMAIL ||
        SMTP_USER
    ).trim();

const SMTP_FROM_NAME =
    String(
        process.env.SMTP_FROM_NAME ||
        "UNTKN"
    ).trim();

const ADMIN_EMAIL =
    String(
        process.env.ADMIN_EMAIL ||
        "contact@untkn.in"
    ).trim();

if (!SMTP_USER) {
    console.error(
        "SMTP CONFIG ERROR: SMTP_USER is missing"
    );
}

if (!SMTP_PASSWORD) {
    console.error(
        "SMTP CONFIG ERROR: SMTP_PASSWORD is missing"
    );
}

if (!SMTP_FROM_EMAIL) {
    console.error(
        "SMTP CONFIG ERROR: SMTP_FROM_EMAIL is missing"
    );
}

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,

    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
});

export const sendEmail = async ({
    to,
    subject,
    html,
    text,
    replyTo
}) => {
    const recipient = String(to || "").trim();

    if (!recipient) {
        throw new Error(
            "Email recipient is missing"
        );
    }

    if (!SMTP_USER) {
        throw new Error(
            "SMTP_USER environment variable is missing"
        );
    }

    if (!SMTP_PASSWORD) {
        throw new Error(
            "SMTP_PASSWORD environment variable is missing"
        );
    }

    if (!SMTP_FROM_EMAIL) {
        throw new Error(
            "SMTP_FROM_EMAIL is missing"
        );
    }

    const cleanSubject =
        String(subject || "UNTKN").trim();

    const plainText =
        String(text || "").trim();

    const htmlContent =
        String(html || "").trim();

    if (!plainText && !htmlContent) {
        throw new Error(
            "Email body is empty"
        );
    }

    const mail = {
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,

        to: recipient,

        envelope: {
            from: SMTP_FROM_EMAIL,
            to: [recipient]
        },

        subject: cleanSubject,

        text:
            plainText ||
            "Please view this email in an HTML-compatible email client.",

        html:
            htmlContent ||
            `<p>${plainText.replace(/\n/g, "<br>")}</p>`,

        date: new Date(),

        headers: {
            "X-Mailer": "UNTKN Ecommerce",
            "X-Auto-Response-Suppress":
                "All"
        }
    };

    if (replyTo) {
        const cleanReplyTo =
            String(replyTo).trim();

        if (cleanReplyTo) {
            mail.replyTo = cleanReplyTo;
        }
    }

    console.log(
        "========================================"
    );

    console.log(
        "UNTKN EMAIL SEND"
    );

    console.log(
        `To: ${recipient}`
    );

    console.log(
        `From: ${SMTP_FROM_EMAIL}`
    );

    console.log(
        `Subject: ${cleanSubject}`
    );

    console.log(
        "Sending email..."
    );

    console.log(
        "========================================"
    );

    try {
        const info =
            await transporter.sendMail(mail);

        const accepted =
            Array.isArray(info.accepted)
                ? info.accepted
                : [];

        const rejected =
            Array.isArray(info.rejected)
                ? info.rejected
                : [];

        console.log(
            "========================================"
        );

        console.log(
            "UNTKN EMAIL RESULT"
        );

        console.log(
            `Message ID: ${info.messageId || "N/A"}`
        );

        console.log(
            `Accepted: ${JSON.stringify(accepted)}`
        );

        console.log(
            `Rejected: ${JSON.stringify(rejected)}`
        );

        console.log(
            `Response: ${info.response || "N/A"}`
        );

        console.log(
            `Envelope: ${JSON.stringify(info.envelope || {})}`
        );

        console.log(
            "========================================"
        );

        const recipientAccepted =
            accepted.some(
                (email) =>
                    String(email).toLowerCase() ===
                    recipient.toLowerCase()
            );

        const recipientRejected =
            rejected.some(
                (email) =>
                    String(email).toLowerCase() ===
                    recipient.toLowerCase()
            );

        if (
            recipientRejected ||
            !recipientAccepted
        ) {
            throw new Error(
                `SMTP did not accept recipient ${recipient}. ` +
                `Accepted: ${JSON.stringify(accepted)} ` +
                `Rejected: ${JSON.stringify(rejected)}`
            );
        }

        return {
            success: true,
            messageId:
                info.messageId || null,
            accepted,
            rejected,
            response:
                info.response || null,
            envelope:
                info.envelope || null
        };

    } catch (error) {
        console.error(
            "========================================"
        );

        console.error(
            "UNTKN EMAIL FAILED"
        );

        console.error(
            `To: ${recipient}`
        );

        console.error(
            `Subject: ${cleanSubject}`
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );

        throw error;
    }
};

export const verifyEmailConnection =
    async () => {
        if (!SMTP_USER) {
            throw new Error(
                "SMTP_USER environment variable is missing"
            );
        }

        if (!SMTP_PASSWORD) {
            throw new Error(
                "SMTP_PASSWORD environment variable is missing"
            );
        }

        await transporter.verify();

        console.log(
            "SMTP connection verified successfully"
        );

        return true;
    };

export const getAdminEmail = () =>
    ADMIN_EMAIL;

export default transporter;