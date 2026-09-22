import nodemailer from "nodemailer";

const SMTP_HOST =
    process.env.SMTP_HOST || "smtp.hostinger.com";

const SMTP_PORT =
    Number(process.env.SMTP_PORT || 465);

const SMTP_USER =
    process.env.SMTP_USER;

const SMTP_PASSWORD =
    process.env.SMTP_PASSWORD;

const SMTP_FROM_EMAIL =
    process.env.SMTP_FROM_EMAIL ||
    SMTP_USER;

const SMTP_FROM_NAME =
    process.env.SMTP_FROM_NAME ||
    "UNTKN";

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    "contact@untkn.in";

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

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
    }
});

export const sendEmail = async ({
    to,
    subject,
    html,
    text,
    replyTo
}) => {
    if (!to) {
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

    const mail = {
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to,
        subject,
        text,
        html
    };

    if (replyTo) {
        mail.replyTo = replyTo;
    }

    console.log(
        `Sending email to ${to} with subject "${subject}"`
    );

    const info =
        await transporter.sendMail(mail);

    console.log(
        `Email sent successfully to ${to}. Message ID: ${info.messageId}`
    );

    return info;
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