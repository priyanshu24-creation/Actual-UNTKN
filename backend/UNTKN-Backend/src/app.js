import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

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
import addressRoutes from "./routes/address.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import inquiryRoutes from "./routes/inquiry.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import lookbookRoutes from "./routes/lookbook.routes.js";
import deliveryMethodRoutes from "./routes/deliveryMethod.routes.js";
import runningBannerRoutes from "./routes/runningBanner.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import couponRoutes from "./routes/coupon.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

const frontendPath = path.resolve(
    __dirname,
    "../../../frontend/dist"
);

const uploadsPath = path.resolve(
    __dirname,
    "../uploads"
);

const testPath = path.resolve(
    __dirname,
    "../test"
);

const allowedOrigins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",

    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:4173",
    "http://127.0.0.1:4173",

    "http://localhost:3000",
    "http://127.0.0.1:3000",

    "https://untkn.in",
    "https://www.untkn.in"
];

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
                    "http://127.0.0.1:5000",

                    "http://localhost:5173",
                    "http://127.0.0.1:5173",

                    "http://localhost:4173",
                    "http://127.0.0.1:4173",

                    "http://localhost:3000",
                    "http://127.0.0.1:3000",

                    "https://untkn.in",
                    "https://www.untkn.in",

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

                objectSrc: [
                    "'none'"
                ],

                baseUri: [
                    "'self'"
                ],

                formAction: [
                    "'self'",
                    "https://checkout.razorpay.com"
                ]
            }
        },

        crossOriginResourcePolicy: false
    })
);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            if (
                allowedOrigins.includes(origin) ||
                origin.startsWith("file://") ||
                origin === "null"
            ) {
                return callback(null, true);
            }

            console.warn(
                `CORS blocked origin: ${origin}`
            );

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Cache-Control",
            "Pragma"
        ],

        optionsSuccessStatus: 204
    })
);

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

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 200,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many requests. Please try again later."
    }
});

app.use(
    "/api",
    apiLimiter
);

app.use(
    "/uploads",
    express.static(uploadsPath)
);

app.get(
    "/api/health",
    (req, res) => {
        res.status(200).json({
            success: true,
            message:
                "UNTKN Backend is running"
        });
    }
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/collections",
    collectionRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/products",
    productImageRoutes
);

app.use(
    "/api/products",
    reviewRoutes
);

app.use(
    "/api/sizes",
    sizeRoutes
);

app.use(
    "/api/colors",
    colorRoutes
);

app.use(
    "/api",
    variantRoutes
);

app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/wishlist",
    wishlistRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/test",
    express.static(testPath)
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/addresses",
    addressRoutes
);

app.use(
    "/api/newsletter",
    newsletterRoutes
);

app.use(
    "/api/inquiries",
    inquiryRoutes
);

app.use(
    "/api/settings",
    settingsRoutes
);

app.use(
    "/api/lookbook",
    lookbookRoutes
);

app.use(
    "/api/coupons",
    couponRoutes
);

app.get(
    "/api/delivery-methods",
    (req, res) => {
        res.status(200).json({
            success: true,

            deliveryMethods: [
                {
                    id: "standard",
                    name: "STANDARD DELIVERY",
                    description:
                        "5–7 BUSINESS DAYS",
                    price: 99,
                    isActive: true
                },

                {
                    id: "express",
                    name: "EXPRESS DELIVERY",
                    description:
                        "2–3 BUSINESS DAYS",
                    price: 199,
                    isActive: true
                }
            ]
        });
    }
);

app.use(
    "/api/delivery-methods",
    deliveryMethodRoutes
);

/*
 * Running Banner
 *
 * Keep this route mounted only once.
 * The actual GET/PUT logic is handled by
 * runningBanner.routes.js/controller.js.
 */
app.use(
    "/api/settings/running-banner",
    runningBannerRoutes
);

app.use(
    express.static(frontendPath)
);

app.use(
    (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        if (
            req.path.startsWith("/api/")
        ) {
            return next();
        }

        if (
            req.path.includes(".")
        ) {
            return next();
        }

        return res.sendFile(
            path.join(
                frontendPath,
                "index.html"
            )
        );
    }
);

app.use(
    (req, res) => {
        res.status(404).json({
            success: false,
            message:
                "API route not found",
            path: req.originalUrl
        });
    }
);

app.use(errorHandler);

export default app;