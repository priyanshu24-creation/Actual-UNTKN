import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

export const sendEmail = async ({
    to,
    subject,
    html,
    text
}) => {
    if (!to) {
        throw new Error("Recipient email is required");
    }

    const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || "UNTKN"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
    });

    return info;
};

export const verifyEmailConnection = async () => {
    await transporter.verify();
    return true;
};

export default transporter;