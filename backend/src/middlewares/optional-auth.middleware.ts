import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config";
import { UserRepository } from "../repositories/user.repository";

const userRepository = new UserRepository();

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
            if (decoded?.stage === "full" && decoded?.id) {
                const user = await userRepository.getUserById(decoded.id);
                if (user) req.user = user;
            }
        }
    } catch {
        // invalid/missing token, just proceed as unauthenticated
    }
    next();
};