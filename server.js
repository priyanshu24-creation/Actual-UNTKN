import dotenv from "dotenv";

dotenv.config({
    path: "./backend/UNTKN-Backend/.env"
});

await import("./backend/UNTKN-Backend/src/server.js");
