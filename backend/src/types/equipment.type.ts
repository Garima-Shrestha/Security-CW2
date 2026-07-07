import z from "zod";

export const EquipmentSchema = z.object({
    title: z.string().min(2).max(100),
    description: z.string().min(1).max(2000),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
    brand: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    condition: z.enum(["new", "excellent", "good", "fair"]).default("good"),
    dailyRate: z.preprocess(val => Number(val), z.number().positive()),
    depositAmount: z.preprocess(val => Number(val), z.number().min(0)),
    specs: z.record(z.string(), z.string()).optional(), // e.g. { sensor: "Full Frame", mount: "EF" }
    images: z.array(z.string()).min(1, "At least one image is required").max(6, "Max 6 images"),
    isActive: z.preprocess(val => val === "true" || val === true, z.boolean()).default(true),
});

export type EquipmentType = z.infer<typeof EquipmentSchema>;