import { Router } from "express";
import { AdminRentalController } from "../../controllers/admin/rental.controller";
import { authorizedMiddleware, adminOnlyMiddleware } from "../../middlewares/authorization.middleware";

const adminRentalController = new AdminRentalController();
const router = Router();

router.use(authorizedMiddleware);
router.use(adminOnlyMiddleware);

router.get("/", adminRentalController.getAllRentals);
router.put("/:id/confirm-pickup", adminRentalController.confirmPickup);
router.put("/:id/process-return", adminRentalController.processReturn);

export default router;