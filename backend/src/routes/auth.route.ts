import { Router } from "express";
import passport from "../config/passport";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware";

const authController = new AuthController();
const router = Router();

router.post("/register", loginRateLimiter, authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/verify-totp", loginRateLimiter, authController.verifyTotp);

router.get("/whoami", authorizedMiddleware, authController.getProfile);
router.post("/totp/setup", authorizedMiddleware, authController.setupTotp);
router.post("/totp/enable", authorizedMiddleware, authController.enableTotp);
router.put("/change-password", authorizedMiddleware, authController.changePassword);

// google oauth flow
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    authController.googleCallback
);

export default router;