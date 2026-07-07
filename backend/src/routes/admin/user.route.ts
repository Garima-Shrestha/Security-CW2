import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/user.controller";
import { authorizedMiddleware, adminOnlyMiddleware } from "../../middlewares/authorization.middleware";

const adminUserController = new AdminUserController();
const router = Router();

router.use(authorizedMiddleware);
router.use(adminOnlyMiddleware);

router.get("/", adminUserController.getAllUsers);

export default router;