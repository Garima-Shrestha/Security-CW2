import { Request, Response, NextFunction } from "express";
import { NODE_ENV } from "../config";

export function enforceHttps(req: Request, res: Response, next: NextFunction) {
    if (NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
}