import crypto from "crypto";

// Saves a hashed version of the browser’s user-agent when the user logs in.
// Helps check if the same login token is later used from a different browser or device. Not fully secure by itself, but adds an extra safety layer.
export function hashUserAgent(userAgent: string | undefined): string {
    return crypto.createHash("sha256").update(userAgent || "unknown").digest("hex");
}