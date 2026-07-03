import { Request, Response } from "express";
import z from "zod";
import { EquipmentService } from "../services/equipment.service";
import { CreateEquipmentDto, UpdateEquipmentDto } from "../dtos/equipment.dtos";

const equipmentService = new EquipmentService();

export class EquipmentController {
    async createEquipment(req: Request, res: Response) {
        try {
            const parsed = CreateEquipmentDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const files = req.files as Express.Multer.File[] | undefined;
            if (!files || files.length === 0) {
                return res.status(400).json({ success: false, message: "At least one image is required" });
            }
            const images = files.map(f => `/uploads/images/${f.filename}`);

            const adminId = req.user?._id?.toString() || "unknown";
            const newEquipment = await equipmentService.createEquipment(parsed.data, images, adminId);
            return res.status(201).json({ success: true, data: newEquipment, message: "Equipment created successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async updateEquipment(req: Request, res: Response) {
        try {
            const parsed = UpdateEquipmentDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const adminId = req.user?._id?.toString() || "unknown";
            const updated = await equipmentService.updateEquipment(req.params.id as string, parsed.data, adminId);
            return res.status(200).json({ success: true, data: updated, message: "Equipment updated successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async deleteEquipment(req: Request, res: Response) {
        try {
            const adminId = req.user?._id?.toString() || "unknown";
            await equipmentService.deleteEquipment(req.params.id as string, adminId);
            return res.status(200).json({ success: true, message: "Equipment deleted successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getAllEquipment(req: Request, res: Response) {
        try {
            const { page, size, searchTerm, categoryId } = req.query as any;
            const result = await equipmentService.getAllEquipmentPaginated(page, size, searchTerm, categoryId);
            return res.status(200).json({
                success: true,
                data: result.equipment,
                pagination: result.pagination,
                message: "Equipment fetched successfully"
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getEquipmentById(req: Request, res: Response) {
        try {
            const equipment = await equipmentService.getEquipmentById(req.params.id as string);
            return res.status(200).json({ success: true, data: equipment, message: "Equipment fetched successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}