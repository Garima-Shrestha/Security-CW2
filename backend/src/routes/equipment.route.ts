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
router.post("/", adminOnlyMiddleware, (req, res, next) => {
    uploads.array("images", 6)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || "File upload error" });
        }
        next();
    });
}, equipmentController.createEquipment);
router.put("/:id", adminOnlyMiddleware, (req, res, next) => {
    uploads.array("images", 6)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || "File upload error" });
        }
        next();
    });
}, equipmentController.updateEquipment);
router.delete("/:id", adminOnlyMiddleware, equipmentController.deleteEquipment);

export default router;