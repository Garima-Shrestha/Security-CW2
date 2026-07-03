import { doubleCsrf } from "csrf-csrf";
import { Request } from "express";
import { NODE_ENV, SESSION_SECRET } from "../config";

const {
    generateCsrfToken,
    doubleCsrfProtection,
} = doubleCsrf({
    getSecret: () => SESSION_SECRET,
    getSessionIdentifier: (req: Request) => req.cookies?.["__Host-psifi.x-csrf-token"] || "anon",
    cookieName: NODE_ENV === "production" ? "__Host-psifi.x-csrf-token" : "x-csrf-token",
    cookieOptions: {
        httpOnly: true,
        sameSite: "strict",
        secure: NODE_ENV === "production",
    },
    getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"],
});

export { generateCsrfToken, doubleCsrfProtection };