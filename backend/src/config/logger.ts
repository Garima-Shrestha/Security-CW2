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

import { sendEmail } from "./email";
import { ADMIN_ALERT_EMAIL } from "./index";

// Events severe enough to page an admin immediately, not just log.
const CRITICAL_EVENTS = new Set([
    "ACCOUNT_LOCKED",
    "IDOR_ATTEMPT_RENTAL",
    "IDOR_ATTEMPT_PAYMENT",
    "IDOR_ATTEMPT_PAYMENT_VERIFY",
    "SESSION_DEVICE_MISMATCH",
]);

export function logSecurityEvent(event: string, meta: Record<string, any> = {}) {
    logger.warn(`SECURITY: ${event}`, { ...meta, timestamp: new Date().toISOString() });

    if (CRITICAL_EVENTS.has(event) && ADMIN_ALERT_EMAIL) {
        const html = `<p><strong>Security Alert: ${event}</strong></p><pre>${JSON.stringify(meta, null, 2)}</pre><p>${new Date().toISOString()}</p>`;
        sendEmail(ADMIN_ALERT_EMAIL, `[Shutter Security Alert] ${event}`, html).catch((err) =>
            logger.error("Failed to send security alert email", { err: err.message })
        );
    }
}