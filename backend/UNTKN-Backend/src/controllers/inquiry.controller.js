import pool from "../config/database.js";
import { sendEmail } from "../services/email.service.js";

const escapeHtml = (value) => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const createInquiry = async (req, res) => {
    try {
        const {
            name,
            email,
            subject,
            message
        } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, subject and message are required"
            });
        }

        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email"
            });
        }

        const cleanName = String(name).trim();
        const cleanSubject = String(subject).trim();
        const cleanMessage = String(message).trim();

        const [result] = await pool.execute(
            `
            INSERT INTO inquiries
                (name, email, subject, message)
            VALUES
                (?, ?, ?, ?)
            `,
            [
                cleanName,
                normalizedEmail,
                cleanSubject,
                cleanMessage
            ]
        );

        try {
            await sendEmail({
                to: process.env.SMTP_FROM_EMAIL,
                subject: `New Inquiry - ${cleanSubject}`,
                text: `
New inquiry received on UNTKN.

Name: ${cleanName}
Email: ${normalizedEmail}
Subject: ${cleanSubject}

Message:
${cleanMessage}

Inquiry ID: ${Number(result.insertId)}
                `.trim(),
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                        <h2>New Inquiry Received</h2>
                        <p><strong>Inquiry ID:</strong> ${Number(result.insertId)}</p>
                        <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(normalizedEmail)}</p>
                        <p><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
                        <h3>Message</h3>
                        <p style="white-space: pre-line;">${escapeHtml(cleanMessage)}</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Inquiry notification email error:", emailError);
        }

        return res.status(201).json({
            success: true,
            message: "Your inquiry has been submitted successfully",
            inquiry_id: Number(result.insertId)
        });
    } catch (error) {
        console.error("Create inquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit inquiry"
        });
    }
};

export const getAdminInquiries = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                id,
                name,
                email,
                subject,
                message,
                status,
                admin_response,
                created_at,
                updated_at
            FROM inquiries
            ORDER BY created_at DESC
        `);

        const inquiries = rows.map((inquiry) => ({
            id: Number(inquiry.id),
            name: inquiry.name,
            email: inquiry.email,
            subject: inquiry.subject,
            message: inquiry.message,
            status: inquiry.status,
            admin_response: inquiry.admin_response || "",
            created_at: inquiry.created_at,
            updated_at: inquiry.updated_at
        }));

        return res.status(200).json({
            success: true,
            count: inquiries.length,
            inquiries
        });
    } catch (error) {
        console.error("Get admin inquiries error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch inquiries"
        });
    }
};

export const getAdminInquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid inquiry ID is required"
            });
        }

        const [rows] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                subject,
                message,
                status,
                admin_response,
                created_at,
                updated_at
            FROM inquiries
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found"
            });
        }

        const inquiry = rows[0];

        return res.status(200).json({
            success: true,
            inquiry: {
                id: Number(inquiry.id),
                name: inquiry.name,
                email: inquiry.email,
                subject: inquiry.subject,
                message: inquiry.message,
                status: inquiry.status,
                admin_response: inquiry.admin_response || "",
                created_at: inquiry.created_at,
                updated_at: inquiry.updated_at
            }
        });
    } catch (error) {
        console.error("Get inquiry details error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch inquiry"
        });
    }
};

export const updateAdminInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status,
            admin_response
        } = req.body;

        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid inquiry ID is required"
            });
        }

        const allowedStatuses = [
            "New",
            "In Progress",
            "Resolved",
            "Closed"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid inquiry status"
            });
        }

        const [existing] = await pool.execute(
            `
            SELECT
                id,
                name,
                email,
                subject
            FROM inquiries
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found"
            });
        }

        const inquiry = existing[0];

        const cleanResponse = admin_response
            ? String(admin_response).trim()
            : null;

        await pool.execute(
            `
            UPDATE inquiries
            SET
                status = ?,
                admin_response = ?
            WHERE id = ?
            `,
            [
                status,
                cleanResponse,
                id
            ]
        );

        if (cleanResponse) {
            try {
                await sendEmail({
                    to: inquiry.email,
                    subject: `UNTKN Support - ${inquiry.subject}`,
                    text: `
Hello ${inquiry.name},

Thank you for contacting UNTKN.

We have reviewed your inquiry.

Status: ${status}

Response:
${cleanResponse}

Regards,
UNTKN Support
                    `.trim(),
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                            <h2>UNTKN Support</h2>
                            <p>Hello ${escapeHtml(inquiry.name)},</p>
                            <p>Thank you for contacting UNTKN.</p>
                            <p><strong>Status:</strong> ${escapeHtml(status)}</p>
                            <h3>Our Response</h3>
                            <p style="white-space: pre-line;">${escapeHtml(cleanResponse)}</p>
                            <p>Regards,<br>UNTKN Support</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error("Inquiry response email error:", emailError);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Inquiry updated successfully"
        });
    } catch (error) {
        console.error("Update inquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update inquiry"
        });
    }
};

export const deleteAdminInquiry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid inquiry ID is required"
            });
        }

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM inquiries
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found"
            });
        }

        await pool.execute(
            `
            DELETE FROM inquiries
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Inquiry deleted successfully"
        });
    } catch (error) {
        console.error("Delete inquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete inquiry"
        });
    }
};