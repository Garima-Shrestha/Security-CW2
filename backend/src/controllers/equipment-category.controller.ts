import { Request, Response } from "express";
import z from "zod";
import { EquipmentCategoryService } from "../services/equipment-category.service";
import { CreateEquipmentCategoryDto, UpdateEquipmentCategoryDto } from "../dtos/equipment-category.dto";

const categoryService = new EquipmentCategoryService();

export class EquipmentCategoryController {
    async createCategory(req: Request, res: Response) {
        try {
            const parsed = CreateEquipmentCategoryDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const adminId = req.user?._id?.toString() || "unknown";
            const newCategory = await categoryService.createCategory(parsed.data, adminId);
            return res.status(201).json({ success: true, data: newCategory, message: "Category created successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async updateCategory(req: Request, res: Response) {
        try {
            const parsed = UpdateEquipmentCategoryDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const adminId = req.user?._id?.toString() || "unknown";
            const updated = await categoryService.updateCategory(req.params.id as string, parsed.data, adminId);
            return res.status(200).json({ success: true, data: updated, message: "Category updated successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async deleteCategory(req: Request, res: Response) {
        try {
            const adminId = req.user?._id?.toString() || "unknown";
            await categoryService.deleteCategory(req.params.id as string, adminId);
            return res.status(200).json({ success: true, message: "Category deleted successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getAllCategories(req: Request, res: Response) {
        try {
            const categories = await categoryService.getAllCategories();
            return res.status(200).json({ success: true, data: categories, message: "Categories fetched successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getCategoryById(req: Request, res: Response) {
        try {
            const category = await categoryService.getCategoryById(req.params.id as string);
            return res.status(200).json({ success: true, data: category, message: "Category fetched successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}