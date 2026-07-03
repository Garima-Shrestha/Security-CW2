import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import passport from "./config/passport";
import { SESSION_SECRET, NODE_ENV, CLIENT_URL } from "./config";
import { generalRateLimiter } from "./middlewares/rate-limit.middleware";
import { doubleCsrfProtection, generateCsrfToken } from "./middlewares/csrf.middleware";
import { logger } from "./config/logger";

import authRoutes from "./routes/auth.route";
import equipmentCategoryRoutes from "./routes/equipment-category.route";
import equipmentRoutes from "./routes/equipment.route";

dotenv.config();

const app: Application = express();

// security headers - CSP, disables x-powered-by, etc
app.use(helmet());

app.use(
    cors({
        origin: [CLIENT_URL, "http://localhost:3000", "http://localhost:3003"],
        credentials: true,
    })
);

app.use(bodyParser.json({ limit: "2mb" }));
app.use(cookieParser());

// Removes $ and . from requests so MongoDB operators can’t be injected
app.use(mongoSanitize());

// blocks http parameter pollution, eg ?role=user&role=admin resolving to an array
app.use(hpp());

// Only used briefly during Google OAuth login, not needed anywhere else
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000, // 10 min, only needs to survive the redirect flow
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(generalRateLimiter);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Generates a CSRF token, frontend sends it back in X-CSRF-Token header
app.get("/api/csrf-token", (req, res) => {
    const token = generateCsrfToken(req, res);
    res.json({ csrfToken: token });
});

// Enables CSRF protection for state changing routes, skipped for pure JWT API calls
// OAuth flow uses cookies so it must be protected
app.use("/api/auth/google", doubleCsrfProtection);

app.use("/api/auth", authRoutes);
app.use("/api/equipment-categories", equipmentCategoryRoutes);
app.use("/api/equipment", equipmentRoutes);

// Final error handler that catches anything not handled in controllers
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === "EBADCSRFTOKEN" || err.message === "invalid csrf token") {
        logger.warn("CSRF token validation failed", { path: req.path, ip: req.ip });
        return res.status(403).json({ success: false, message: "Invalid or missing CSRF token" });
    }
    logger.error(err.message, { stack: err.stack, path: req.path });
    res.status(err.statusCode || 500).json({
        success: false,
        message: NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
});

export default app;