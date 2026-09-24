import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import app from "./app.js";
import pool from "./config/database.js";
import { verifyEmailConnection } from "./config/services/email.service.js";
import { ensureCouponSchema } from "./services/coupon.service.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("MySQL connected successfully");

        connection.release();

        try {
            await ensureCouponSchema();
            console.log("Coupon system database schema ready");
        } catch (error) {
            console.error("Coupon schema initialization failed:");
            console.error(error.message);
        }

        try {
    await verifyEmailConnection();
} catch (error) {
    console.error(
        "SMTP connection failed:"
    );

    console.error(
        error.message
    );
}

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`UNTKN Backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);
        // Continue without exiting; the API may still serve routes that don't need DB
    }
}


startServer();