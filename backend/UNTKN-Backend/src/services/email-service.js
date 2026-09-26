import nodemailer from "nodemailer";

const getSmtpConfig = () => {
    const host =
        process.env.SMTP_HOST ||
        "smtp.hostinger.com";

    const port =
        Number(
            process.env.SMTP_PORT ||
            465
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

    if (!config.user) {
        throw new Error(
            "SMTP_USER is missing"
        );
    }

    if (!config.password) {
        throw new Error(
            "SMTP_PASSWORD is missing"
        );
    }

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.password
        }
    });
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
    cc,
    bcc,
    replyTo
}) => {
    const recipient =
        String(to || "")
            .trim();

    if (!recipient) {
        throw new Error(
            "Email recipient is missing"
        );
    }

    if (!subject) {
        throw new Error(
            "Email subject is missing"
        );
    }

    if (!text && !html) {
        throw new Error(
            "Email content is missing"
        );
    }

    const config =
        getSmtpConfig();

    const transporter =
        createTransporter();

    const mail = {
        from:
            `"${config.fromName}" <${config.fromEmail}>`,
        to: recipient,
        subject,
        text:
            text || undefined,
        html:
            html || undefined,
        cc:
            cc || undefined,
        bcc:
            bcc || undefined,
        replyTo:
            replyTo || undefined
    };

    console.log(
        "[UNTKN EMAIL] Sending:",
        {
            from: config.fromEmail,
            to: recipient,
            subject
        }
    );

    const info =
        await transporter.sendMail(
            mail
        );

    console.log(
        "[UNTKN EMAIL] Accepted:",
        info.accepted
    );

    console.log(
        "[UNTKN EMAIL] Rejected:",
        info.rejected
    );

    console.log(
        "[UNTKN EMAIL] Message ID:",
        info.messageId
    );

    console.log(
        "[UNTKN EMAIL] Response:",
        info.response
    );

    return info;
};

export const verifyEmailConnection =
    async () => {
        const transporter =
            createTransporter();

        await transporter.verify();

        console.log(
            "[UNTKN EMAIL] SMTP connection verified successfully"
        );

        return true;
    };

export default createTransporter;
