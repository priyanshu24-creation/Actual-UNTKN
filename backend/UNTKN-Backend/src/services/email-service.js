import nodemailer from "nodemailer";

const getSmtpConfig = () => {
    const host =
        process.env.SMTP_HOST ||
        "smtp.hostinger.com";

    const port =
        Number(
            process.env.SMTP_PORT || 465
        );

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
            "SMTP_USER environment variable is missing"
        );
    }

    if (!password) {
        throw new Error(
            "SMTP_PASSWORD environment variable is missing"
        );
    }

    if (!fromEmail) {
        throw new Error(
            "SMTP_FROM_EMAIL could not be determined"
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
        host: config.host,

        port: config.port,

        secure: config.secure,

        auth: {
            user: config.user,
            pass: config.password
        },

        connectionTimeout: 15000,

        greetingTimeout: 15000,

        socketTimeout: 20000
    });
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html
}) => {
    if (!to) {
        throw new Error(
            "Recipient email is required"
        );
    }

    if (!subject) {
        throw new Error(
            "Email subject is required"
        );
    }

    const config =
        getSmtpConfig();

    const transporter =
        createTransporter();

    const mail = {
        from:
            `"${config.fromName}" <${config.fromEmail}>`,

        to,

        subject,

        text:
            text || undefined,

        html:
            html || undefined
    };

    const info =
        await transporter.sendMail(
            mail
        );

    console.log(
        "Email sent successfully:",
        {
            messageId:
                info.messageId,

            accepted:
                info.accepted,

            rejected:
                info.rejected
        }
    );

    return info;
};

export const verifyEmailConnection =
    async () => {
        const transporter =
            createTransporter();

        await transporter.verify();

        console.log(
            "SMTP connection verified successfully"
        );

        return true;
    };

export default createTransporter;