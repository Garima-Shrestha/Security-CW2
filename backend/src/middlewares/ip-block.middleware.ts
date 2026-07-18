import { Request, Response, NextFunction } from "express";

// Simple IP-based blocking with an allow-list override.
// Blocked IPs are denied outright; allow-listed IPs always pass through
// even if they'd otherwise be blocked (e.g. trusted office or admin IPs).
const BLOCKED_IPS = new Set(
    (process.env.BLOCKED_IPS || "").split(",").map(ip => ip.trim()).filter(Boolean)
);
const ALLOWED_IPS = new Set(
    (process.env.ALLOWED_IPS || "").split(",").map(ip => ip.trim()).filter(Boolean)
);

export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
    // const clientIp = req.ip || req.socket.remoteAddress || "";
    let clientIp = req.ip || req.socket.remoteAddress || "";
    clientIp = clientIp.replace(/^::ffff:/, ""); 

    if (ALLOWED_IPS.size > 0 && ALLOWED_IPS.has(clientIp)) {
        return next();
    }

    if (BLOCKED_IPS.has(clientIp)) {
        return res.status(403).json({ success: false, message: "Access denied from this network" });
    }

    next();
}