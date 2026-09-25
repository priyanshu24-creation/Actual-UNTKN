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
    "../dist"
);

const uploadsPath = path.resolve(
    __dirname,
    "../uploads"
);

const testPath = path.resolve(
    __dirname,
    "../test"
);

/* =========================================================
   CORS CONFIGURATION
========================================================= */

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
    "https://www.untkn.in",

    "https://bisque-leopard-416747.hostingersite.com"
];

const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }

    if (
        origin === "null" ||
        origin.startsWith("file://")
    ) {
        return true;
    }

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    /*
     * Allow Hostinger preview domains such as:
     *
     * https://bisque-leopard-416747.hostingersite.com
     *
     * and other Hostinger generated preview domains.
     */
    if (
        /^https:\/\/[a-z0-9-]+\.hostingersite\.com$/i.test(
            origin
        )
    ) {
        return true;
    }

    return false;
};

/* =========================================================
   HELMET
========================================================= */

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [
                    "'self'"
                ],

                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
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

                    "https://*.hostingersite.com",

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

/* =========================================================
   CORS
========================================================= */

app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
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

/* =========================================================
   BODY PARSERS
========================================================= */

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

/* =========================================================
   API RATE LIMITER
========================================================= */

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

/* =========================================================
   UPLOADS
========================================================= */

app.use(
    "/uploads",
    express.static(uploadsPath)
);

/* =========================================================
   HEALTH CHECK
========================================================= */

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

/* =========================================================
   API ROUTES
========================================================= */

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

/*
 * IMPORTANT:
 * Delivery methods are controlled by the database.
 *
 * DO NOT add a hard-coded:
 *
 * app.get("/api/delivery-methods", ...)
 *
 * here because it would override the database-driven
 * delivery-method route.
 */


app.use(
    "/api/settings/running-banner",
    runningBannerRoutes
);

/* =========================================================
   FRONTEND STATIC FILES
========================================================= */

app.use(
    express.static(frontendPath, {
        index: false,
        fallthrough: true,

        setHeaders: (res, filePath) => {
            if (filePath.endsWith(".css")) {
                res.setHeader(
                    "Content-Type",
                    "text/css; charset=UTF-8"
                );
            }

            if (filePath.endsWith(".js")) {
                res.setHeader(
                    "Content-Type",
                    "text/javascript; charset=UTF-8"
                );
            }

            if (filePath.endsWith(".json")) {
                res.setHeader(
                    "Content-Type",
                    "application/json; charset=UTF-8"
                );
            }

            if (
                filePath.endsWith(".png") ||
                filePath.endsWith(".jpg") ||
                filePath.endsWith(".jpeg") ||
                filePath.endsWith(".webp") ||
                filePath.endsWith(".svg") ||
                filePath.endsWith(".ico")
            ) {
                res.setHeader(
                    "Cache-Control",
                    "public, max-age=31536000, immutable"
                );
            }

            if (
                filePath.endsWith(".woff") ||
                filePath.endsWith(".woff2") ||
                filePath.endsWith(".ttf") ||
                filePath.endsWith(".otf")
            ) {
                res.setHeader(
                    "Cache-Control",
                    "public, max-age=31536000, immutable"
                );
            }
        }
    })
);

/* =========================================================
   FRONTEND SPA FALLBACK
========================================================= */

app.use(
    (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        /*
         * API requests must never receive
         * the frontend index.html.
         */
        if (
            req.path === "/api" ||
            req.path.startsWith("/api/")
        ) {
            return next();
        }

        /*
         * Upload requests must never receive
         * the frontend index.html.
         */
        if (
            req.path === "/uploads" ||
            req.path.startsWith("/uploads/")
        ) {
            return next();
        }

        /*
         * Test files must never receive
         * the frontend index.html.
         */
        if (
            req.path === "/test" ||
            req.path.startsWith("/test/")
        ) {
            return next();
        }

        /*
         * Never return index.html for missing
         * Vite assets.
         */
        if (
            req.path === "/assets" ||
            req.path.startsWith("/assets/")
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Frontend asset not found",
                path: req.originalUrl
            });
        }

        /*
         * Requests containing a file extension
         * should not receive SPA fallback.
         *
         * Example:
         * /favicon.ico
         * /robots.txt
         * /sitemap.xml
         * /manifest.json
         */
        if (
            req.path.includes(".")
        ) {
            return next();
        }

        /*
         * React Router SPA fallback.
         */
        return res.sendFile(
            path.join(
                frontendPath,
                "index.html"
            ),
            (error) => {
                if (error) {
                    return next(error);
                }
            }
        );
    }
);

/* =========================================================
   404 HANDLER
========================================================= */

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

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(errorHandler);

export default app;