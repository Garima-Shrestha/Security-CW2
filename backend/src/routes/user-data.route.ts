import { Router } from "express";
import { UserDataController } from "../controllers/user-data.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";

const userDataController = new UserDataController();
const router = Router();

router.use(authorizedMiddleware);

router.get("/export", userDataController.exportMyData);
router.post("/import", userDataController.importMyData);

export default router;