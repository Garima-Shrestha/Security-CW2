import { EquipmentRepository } from "../repositories/equipment.repository";
import { CreateEquipmentDto, UpdateEquipmentDto } from "../dtos/equipment.dtos";
import { HttpError } from "../errors/http-error";
import { sanitizeText, sanitizeRichText } from "../utils/sanitize";
import { logActivity } from "../config/logger";

const equipmentRepository = new EquipmentRepository();

export class EquipmentService {
    async createEquipment(data: CreateEquipmentDto, images: string[], adminId: string) {
        const newEquipment = await equipmentRepository.createEquipment({
            ...data,
            title: sanitizeText(data.title),
            description: sanitizeRichText(data.description),
            brand: sanitizeText(data.brand),
            model: sanitizeText(data.model),
            specs: sanitizeSpecs(data.specs),
            images,
        } as any);

        logActivity("EQUIPMENT_CREATED", { adminId, equipmentId: newEquipment._id.toString() });
        return newEquipment;
    }

    async updateEquipment(id: string, data: UpdateEquipmentDto, adminId: string) {
        const equipment = await equipmentRepository.getEquipmentById(id);
        if (!equipment) throw new HttpError(404, "Equipment not found");

        const updates: any = { ...data };
        if (data.title) updates.title = sanitizeText(data.title);
        if (data.description) updates.description = sanitizeRichText(data.description);
        if (data.brand) updates.brand = sanitizeText(data.brand);
        if (data.model) updates.model = sanitizeText(data.model);
        if (data.specs) updates.specs = sanitizeSpecs(data.specs);

        const updated = await equipmentRepository.updateOneEquipment(id, updates);
        logActivity("EQUIPMENT_UPDATED", { adminId, equipmentId: id });
        return updated;
    }

    async deleteEquipment(id: string, adminId: string) {
        const equipment = await equipmentRepository.getEquipmentById(id);
        if (!equipment) throw new HttpError(404, "Equipment not found");

        const deleted = await equipmentRepository.deleteOneEquipment(id);
        logActivity("EQUIPMENT_DELETED", { adminId, equipmentId: id });
        return deleted;
    }

    async getEquipmentById(id: string) {
        const equipment = await equipmentRepository.getEquipmentById(id);
        if (!equipment || !equipment.isActive) throw new HttpError(404, "Equipment not found");
        return equipment;
    }

    async getAllEquipmentPaginated(page?: string, size?: string, searchTerm?: string, categoryId?: string) {
        const currentPage = page ? parseInt(page, 10) : 1;
        const pageSize = size ? parseInt(size, 10) : 10;

        const { equipment, total } = await equipmentRepository.getAllEquipmentPaginated(
            currentPage, pageSize, searchTerm, categoryId
        );

        return {
            equipment,
            pagination: {
                page: currentPage,
                size: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
}

function sanitizeSpecs(specs?: Record<string, string>): Record<string, string> | undefined {
    if (!specs) return undefined;
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(specs)) {
        // Keys are predefined, but we still sanitize request data just in case.
        const cleanKey = sanitizeText(key).slice(0, 50);
        const cleanValue = sanitizeText(value).slice(0, 200);
        if (cleanKey) clean[cleanKey] = cleanValue;
    }
    return clean;
}