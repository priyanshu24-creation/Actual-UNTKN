import dotenv from "dotenv";

dotenv.config({
    path: "./backend/UNTKN-Backend/.env"
});

import("./backend/UNTKN-Backend/src/server.js");
