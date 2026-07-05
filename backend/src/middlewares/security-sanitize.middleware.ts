import { Request, Response, NextFunction } from "express";

const FORBIDDEN_KEY_PATTERN = /^\$|\./;

// Remove keys that could be used for NoSQL injection (e.g. $gt, $where, or nested keys).
// Modify the existing object instead of replacing req.query, req.body, or req.params,
// since Express 5 treats req.query as read-only and reassigning it throws an error.
function stripInjectionKeys(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
        if (FORBIDDEN_KEY_PATTERN.test(key)) {
            delete obj[key];
            continue;
        }
        if (obj[key] && typeof obj[key] === "object") {
            stripInjectionKeys(obj[key]);
        }
    }
}

// Prevent HTTP Parameter Pollution (e.g. ?role=user&role=admin) by keeping only the last value.
function dedupeParams(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
            obj[key] = obj[key][obj[key].length - 1];
        }
    }
}

export function securitySanitize(req: Request, res: Response, next: NextFunction) {
    stripInjectionKeys(req.body);
    stripInjectionKeys(req.query);
    stripInjectionKeys(req.params);
    dedupeParams(req.query);
    dedupeParams(req.body);
    next();
}