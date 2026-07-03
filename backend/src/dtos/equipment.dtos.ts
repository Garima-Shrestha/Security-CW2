import z from "zod";
import { EquipmentSchema } from "../types/equipment.type";

// Admin creates equipment.
export const CreateEquipmentDto = EquipmentSchema.pick({
    title: true,
    description: true,
    category: true,
    brand: true,
    model: true,
    condition: true,
    dailyRate: true,
    depositAmount: true,
    specs: true,
});
export type CreateEquipmentDto = z.infer<typeof CreateEquipmentDto>;

export const UpdateEquipmentDto = EquipmentSchema.partial().omit({ images: true });
export type UpdateEquipmentDto = z.infer<typeof UpdateEquipmentDto>;