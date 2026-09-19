import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import productRoutes from "./routes/product.routes.js";
import productImageRoutes from "./routes/productImage.routes.js";
import sizeRoutes from "./routes/size.routes.js";
import colorRoutes from "./routes/color.routes.js";
import variantRoutes from "./routes/variant.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import addressRoutes from "./routes/address.routes.js";

const app = express();


// ==================================================
// SECURITY HEADERS
// ==================================================

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "https://checkout.razorpay.com",
                    "https://cdn.razorpay.com"
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https:"
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https:"
                ],

                connectSrc: [
                    "'self'",
                    "http://localhost:5000",
                    "https://checkout.razorpay.com",
                    "https://api.razorpay.com",
                    "https://cdn.razorpay.com"
                ],

                frameSrc: [
                    "'self'",
                    "https://checkout.razorpay.com",
                    "https://api.razorpay.com"
                ],

                fontSrc: [
                    "'self'",
                    "https:",
                    "data:"
                ],

                objectSrc: ["'none'"],

                baseUri: ["'self'"],

                formAction: [
                    "'self'",
                    "https://checkout.razorpay.com"
                ]
            }
        }
    })
);


// ==================================================
// CORS
// ==================================================

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);


// ==================================================
// REQUEST BODY LIMITS
// ==================================================

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);

app.use(cookieParser());


// ==================================================
// API RATE LIMITING
// ==================================================

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);


// ==================================================
// HEALTH
// ==================================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "UNTKN Backend is running"
    });
});


// ==================================================
// AUTH
// ==================================================

app.use("/api/auth", authRoutes);


// ==================================================
// CATEGORIES
// ==================================================

app.use("/api/categories", categoryRoutes);


// ==================================================
// COLLECTIONS
// ==================================================

app.use("/api/collections", collectionRoutes);


// ==================================================
// PRODUCTS
// ==================================================

app.use("/api/products", productRoutes);


// ==================================================
// PRODUCT IMAGES
// ==================================================

app.use("/api/products", productImageRoutes);


// ==================================================
// SIZES
// ==================================================

app.use("/api/sizes", sizeRoutes);


// ==================================================
// COLORS
// ==================================================

app.use("/api/colors", colorRoutes);


// ==================================================
// VARIANTS
// ==================================================

app.use("/api", variantRoutes);


// ==================================================
// CART
// ==================================================

app.use("/api/cart", cartRoutes);


// ==================================================
// WISHLIST
// ==================================================

app.use("/api/wishlist", wishlistRoutes);


// ==================================================
// ORDERS
// ==================================================

app.use("/api/orders", orderRoutes);


// ==================================================
// PAYMENTS
// ==================================================

app.use("/api/payments", paymentRoutes);


// ==================================================
// TEST PAGES
// ==================================================

app.use("/test", express.static("test"));


// =========================
// ADMIN
// =========================

app.use("/api/admin", adminRoutes);

app.use("/api/addresses", addressRoutes);

// ==================================================
// 404
// ==================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

app.use(errorHandler);

export default app;