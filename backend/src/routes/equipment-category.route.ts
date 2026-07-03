import { Router } from "express";
import { EquipmentCategoryController } from "../controllers/equipment-category.controller";
import { authorizedMiddleware, adminOnlyMiddleware } from "../middlewares/authorization.middleware";

const categoryController = new EquipmentCategoryController();
const router = Router();

// Public read access for browsing categories
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Admin-only 
router.post("/", authorizedMiddleware, adminOnlyMiddleware, categoryController.createCategory);
router.put("/:id", authorizedMiddleware, adminOnlyMiddleware, categoryController.updateCategory);
router.delete("/:id", authorizedMiddleware, adminOnlyMiddleware, categoryController.deleteCategory);

export default router;