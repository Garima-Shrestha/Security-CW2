import winston from "winston";
import path from "path";
import { NODE_ENV } from "./index";

const logDir = path.join(__dirname, "../../logs");

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDir, "activity.log") }),
        new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
    ],
});

if (NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Log important security events like login, lockouts, password and MFA changes.
// Never store sensitive info like passwords or tokens.
export function logActivity(event: string, meta: Record<string, any> = {}) {
    logger.info(event, { ...meta, timestamp: new Date().toISOString() });
}

export function logSecurityEvent(event: string, meta: Record<string, any> = {}) {
    logger.warn(`SECURITY: ${event}`, { ...meta, timestamp: new Date().toISOString() });
}