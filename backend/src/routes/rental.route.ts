import { Router } from "express";
import { RentalController } from "../controllers/rental.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";

const rentalController = new RentalController();
const router = Router();

router.use(authorizedMiddleware);

router.post("/", rentalController.createRental);
router.get("/", rentalController.getMyRentals);
router.get("/:id", rentalController.getMyRentalById);
router.delete("/:id", rentalController.cancelRental);

router.post("/:rentalId/pay/initiate", rentalController.initiatePayment);
router.post("/pay/verify", rentalController.verifyPayment);

export default router;