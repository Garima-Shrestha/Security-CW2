import z from "zod";

export const EquipmentCategorySchema = z.object({
    name: z.string().min(1, "Category name is required").max(50),
    description: z.string().max(300).optional(),
    isActive: z.boolean().default(true),
});

export type EquipmentCategoryType = z.infer<typeof EquipmentCategorySchema>;