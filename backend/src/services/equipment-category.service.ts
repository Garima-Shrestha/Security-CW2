import { EquipmentCategoryRepository } from "../repositories/equipment-category.repository";
import { CreateEquipmentCategoryDto, UpdateEquipmentCategoryDto } from "../dtos/equipment-category.dto";
import { HttpError } from "../errors/http-error";
import { sanitizeText, sanitizeRichText } from "../utils/sanitize";
import { logActivity } from "../config/logger";

const categoryRepository = new EquipmentCategoryRepository();

export class EquipmentCategoryService {
    async createCategory(data: CreateEquipmentCategoryDto, adminId: string) {
        const cleanName = sanitizeText(data.name);
        const existing = await categoryRepository.getCategoryByName(cleanName);
        if (existing) throw new HttpError(409, "Category name already exists");

        const newCategory = await categoryRepository.createCategory({
            name: cleanName,
            description: data.description ? sanitizeRichText(data.description) : undefined,
        });

        logActivity("EQUIPMENT_CATEGORY_CREATED", { adminId, categoryId: newCategory._id.toString() });
        return newCategory;
    }

    async updateCategory(id: string, data: UpdateEquipmentCategoryDto, adminId: string) {
        const category = await categoryRepository.getCategoryById(id);
        if (!category) throw new HttpError(404, "Category not found");

        const updates: any = { ...data };
        if (data.name) {
            const cleanName = sanitizeText(data.name);
            if (cleanName.toLowerCase() !== category.name.toLowerCase()) {
                const existing = await categoryRepository.getCategoryByName(cleanName);
                if (existing) throw new HttpError(409, "Category name already exists");
            }
            updates.name = cleanName;
        }
        if (data.description) {
            updates.description = sanitizeRichText(data.description);
        }

        const updated = await categoryRepository.updateOneCategory(id, updates);
        logActivity("EQUIPMENT_CATEGORY_UPDATED", { adminId, categoryId: id });
        return updated;
    }

    async deleteCategory(id: string, adminId: string) {
        const category = await categoryRepository.getCategoryById(id);
        if (!category) throw new HttpError(404, "Category not found");

        const deleted = await categoryRepository.deleteOneCategory(id);
        logActivity("EQUIPMENT_CATEGORY_DELETED", { adminId, categoryId: id });
        return deleted;
    }

    async getAllCategories() {
        const categories = await categoryRepository.getAllCategories();
        return categories.filter(c => c.isActive);
    }

    async getCategoryById(id: string) {
        const category = await categoryRepository.getCategoryById(id);
        if (!category || !category.isActive) throw new HttpError(404, "Category not found");
        return category;
    }
}