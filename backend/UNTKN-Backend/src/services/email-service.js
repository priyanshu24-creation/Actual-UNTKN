import nodemailer from "nodemailer";

const getSmtpConfig = () => {
    const host =
        process.env.SMTP_HOST ||
        "smtp.hostinger.com";

    const port =
        Number(process.env.SMTP_PORT || 465);

    const user =
        process.env.SMTP_USER;

    const password =
        process.env.SMTP_PASSWORD;

    const fromEmail =
        process.env.SMTP_FROM_EMAIL ||
        user;

    const fromName =
        process.env.SMTP_FROM_NAME ||
        "UNTKN";

    if (!user) {
        throw new Error(
            "SMTP_USER is not configured."
        );
    }

    if (!password) {
        throw new Error(
            "SMTP_PASSWORD is not configured."
        );
    }

    if (!fromEmail) {
        throw new Error(
            "SMTP_FROM_EMAIL is not configured."
        );
    }

    return {
        host,
        port,
        secure: port === 465,
        user,
        password,
        fromEmail,
        fromName
    };
};

const createTransporter = () => {
    const config =
        getSmtpConfig();

    return nodemailer.createTransport({
        host:
            config.host,

        port:
            config.port,

        secure:
            config.secure,

        auth: {
            user:
                config.user,

            pass:
                config.password
        },

        tls: {
            minVersion:
                "TLSv1.2"
        },

        connectionTimeout:
            30000,

        greetingTimeout:
            30000,

        socketTimeout:
            30000
    });
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html
}) => {
    const config =
        getSmtpConfig();

    if (!to) {
        throw new Error(
            "Customer email address is missing."
        );
    }

    const recipient =
        String(to).trim();

    if (!recipient) {
        throw new Error(
            "Customer email address is empty."
        );
    }

    console.log(
        "Preparing customer email:",
        {
            to: recipient,
            subject
        }
    );

    const transporter =
        createTransporter();

    const mail = {
        from:
            `"${config.fromName}" <${config.fromEmail}>`,

        to:
            recipient,

        envelope: {
            from:
                config.fromEmail,

            to:
                recipient
        },

        replyTo:
            config.fromEmail,

        subject:
            subject || "UNTKN",

        text:
            text || "",

        html:
            html || text || ""
    };

    const info =
        await transporter.sendMail(
            mail
        );

    console.log(
        "Customer email accepted by SMTP:",
        {
            to: recipient,
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        }
    );

    if (
        !info.accepted ||
        info.accepted.length === 0
    ) {
        throw new Error(
            `SMTP did not accept customer email for ${recipient}`
        );
    }

    return info;
};

export const verifyEmailConnection =
    async () => {
        const transporter =
            createTransporter();

        await transporter.verify();

        console.log(
            "SMTP connection verified successfully."
        );

        return true;
    };

export default createTransporter;