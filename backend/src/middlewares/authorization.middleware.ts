import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { hashUserAgent } from "../utils/device";
import { logSecurityEvent } from "../config/logger";

let userRepository = new UserRepository();

export const authorizedMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new HttpError(401, "Unauthorized, header malformed");
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new HttpError(401, "Unauthorized, token missing");
        }

        const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
        if (!decoded || !decoded.id) {
            throw new HttpError(401, "Unauthorized, token invalid");
        }

        if (decoded.stage !== "full") {
            throw new HttpError(401, "MFA verification not completed");
        }

        const currentUaHash = hashUserAgent(req.headers["user-agent"]);
        if (decoded.ua && decoded.ua !== currentUaHash) {
            logSecurityEvent("SESSION_DEVICE_MISMATCH", { userId: decoded.id, ip: req.ip });
            throw new HttpError(401, "Session invalid for this device, please log in again");
        }

        const user = await userRepository.getUserById(decoded.id);
        if (!user) {
            throw new HttpError(401, "Unauthorized, user not found");
        }

        req.user = user;
        next();
    } catch (error: Error | any) {
        return res.status(error.statusCode || 401).json(
            { success: false, message: error.message || "Unauthorized" }
        );
    }
};

export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.user && req.user.role === "admin") {
            next();
        } else {
            throw new HttpError(403, "Forbidden, admins only");
        }
    } catch (error: Error | any) {
        return res.status(error.statusCode || 403).json(
            { success: false, message: error.message || "Forbidden" }
        );
    }
};