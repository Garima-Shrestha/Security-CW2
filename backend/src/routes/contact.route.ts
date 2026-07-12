import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { generalRateLimiter } from "../middlewares/rate-limit.middleware";

const contactController = new ContactController();
const router = Router();

router.use(authorizedMiddleware);
router.post("/", generalRateLimiter, contactController.sendMessage);

export default router;