import rateLimit from "express-rate-limit";

// tighter limit on auth endpoints since these are the actual brute-force targets
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    message: { success: false, message: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// looser limit for general api routes, just to blunt automated abuse/scraping
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: { success: false, message: "Too many requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false,
});