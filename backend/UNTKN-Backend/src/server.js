import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import pool from "./config/database.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("MySQL connected successfully");

        connection.release();

       app.listen(PORT, "0.0.0.0", () => {
    console.log(`UNTKN Backend running on port ${PORT}`);
});
    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);
        process.exit(1);
    }
}

startServer();
