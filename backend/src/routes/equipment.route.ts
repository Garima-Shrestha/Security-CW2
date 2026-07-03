import { Router } from "express";
import { EquipmentController } from "../controllers/equipment.controller";
import { authorizedMiddleware, adminOnlyMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";

const equipmentController = new EquipmentController();
const router = Router();

router.use(authorizedMiddleware);

router.get("/", equipmentController.getAllEquipment);
router.get("/:id", equipmentController.getEquipmentById);

// Admin-only writes
router.post("/", adminOnlyMiddleware, uploads.array("images", 6), equipmentController.createEquipment);
router.put("/:id", adminOnlyMiddleware, equipmentController.updateEquipment);
router.delete("/:id", adminOnlyMiddleware, equipmentController.deleteEquipment);

export default router;