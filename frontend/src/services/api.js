import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.DEV
        ? "http://localhost:5000/api"
        : "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export default api;