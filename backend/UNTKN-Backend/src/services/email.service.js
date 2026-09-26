import nodemailer from "nodemailer";

const SMTP_HOST =
    String(process.env.SMTP_HOST || "smtp.hostinger.com").trim();

const SMTP_PORT =
    Number(process.env.SMTP_PORT || 465);

const SMTP_USER =
    String(process.env.SMTP_USER || "").trim();

const SMTP_PASSWORD =
    String(process.env.SMTP_PASSWORD || "");

const SMTP_FROM_EMAIL =
    String(
        process.env.SMTP_FROM_EMAIL || SMTP_USER
    ).trim();

const SMTP_FROM_NAME =
    String(
        process.env.SMTP_FROM_NAME || "UNTKN"
    ).trim();

if (!SMTP_USER) {
    console.error("EMAIL CONFIG ERROR: SMTP_USER is missing");
}

if (!SMTP_PASSWORD) {
    console.error("EMAIL CONFIG ERROR: SMTP_PASSWORD is missing");
}

if (!SMTP_FROM_EMAIL) {
    console.error("EMAIL CONFIG ERROR: SMTP_FROM_EMAIL is missing");
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
    socketTimeout: 20000
});

export const getEmailConfig = () => ({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    user: SMTP_USER,
    from: SMTP_FROM_EMAIL
});

export const verifyEmailConnection = async () => {
    try {
        await transporter.verify();

        console.log(
            `EMAIL: SMTP connection verified successfully (${SMTP_HOST}:${SMTP_PORT})`
        );

        return true;
    } catch (error) {
        console.error("EMAIL: SMTP verification failed");
        console.error(error);

        return false;
    }
};

export const sendEmail = async ({
    to,
    subject,
    text = "",
    html = "",
    cc,
    bcc,
    replyTo
}) => {
    const recipient = String(to || "").trim();

    if (!recipient) {
        throw new Error("Email recipient is required");
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
            "SMTP_FROM_EMAIL environment variable is missing"
        );
    }

    const mail = {
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: recipient,
        subject: String(subject || "UNTKN"),
        text: String(text || ""),
        html: String(html || "")
    };

    if (cc) {
        mail.cc = cc;
    }

    if (bcc) {
        mail.bcc = bcc;
    }

    if (replyTo) {
        mail.replyTo = replyTo;
    }

    console.log("EMAIL: preparing message");
    console.log(`EMAIL: recipient = ${recipient}`);
    console.log(`EMAIL: subject = ${mail.subject}`);
    console.log(`EMAIL: SMTP host = ${SMTP_HOST}`);
    console.log(`EMAIL: SMTP port = ${SMTP_PORT}`);
    console.log(`EMAIL: from = ${SMTP_FROM_EMAIL}`);

    try {
        const info = await transporter.sendMail(mail);

        console.log("EMAIL: SMTP accepted message");
        console.log(`EMAIL: messageId = ${info.messageId}`);

        if (info.accepted) {
            console.log(
                `EMAIL: accepted recipients = ${info.accepted.join(", ")}`
            );
        }

        if (info.rejected && info.rejected.length > 0) {
            console.error(
                `EMAIL: rejected recipients = ${info.rejected.join(", ")}`
            );
        }

        return info;
    } catch (error) {
        console.error("EMAIL: send failed");
        console.error("EMAIL: recipient =", recipient);
        console.error("EMAIL: subject =", mail.subject);
        console.error(error);

        throw error;
    }
};

export default transporter;
