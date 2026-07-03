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

import authRoutes from "./routes/auth.route";

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

// strips out $ and . operators from req.body/query/params so they can't be used
// to inject mongo operators (eg { "email": { "$ne": null } })
app.use(mongoSanitize());

// blocks http parameter pollution, eg ?role=user&role=admin resolving to an array
app.use(hpp());

// only needed for the brief moment during the google oauth handshake, not used elsewhere
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

app.use("/api/auth", authRoutes);

// catch-all error handler, last resort if something throws outside a controller's try/catch
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
});

export default app;