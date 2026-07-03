import z from "zod";

export const KhaltiInitiateSchema = z.object({
    equipmentId: z.string().min(1),
    amount: z.number().int().positive(), 
    purchase_order_id: z.string().min(1),
    purchase_order_name: z.string().min(1),

    customer_info: z
        .object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().regex(/^\d{8,15}$/).optional(),
        })
        .optional(),
});

export type KhaltiInitiateType = z.infer<typeof KhaltiInitiateSchema>;


export const KhaltiLookupSchema = z.object({
    pidx: z.string().min(1),
});

export type KhaltiLookupType = z.infer<typeof KhaltiLookupSchema>;