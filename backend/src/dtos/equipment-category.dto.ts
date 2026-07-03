import z from "zod";
import { EquipmentCategorySchema } from "../types/equipment-category.type";

export const CreateEquipmentCategoryDto = EquipmentCategorySchema.pick({
    name: true,
    description: true,
});
export type CreateEquipmentCategoryDto = z.infer<typeof CreateEquipmentCategoryDto>;

export const UpdateEquipmentCategoryDto = EquipmentCategorySchema.partial();
export type UpdateEquipmentCategoryDto = z.infer<typeof UpdateEquipmentCategoryDto>;