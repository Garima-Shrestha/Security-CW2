import z from "zod";

// Users can only submit these fields. Prices, payment status, and totals are calculated by the server.
export const CreateRentalRequestDto = z.object({
    equipmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Equipment ID"),
    startDate: z.preprocess(val => new Date(val as string), z.date()),
    endDate: z.preprocess(val => new Date(val as string), z.date()),
}).refine((v) => v.endDate > v.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
}).refine((v) => v.startDate >= new Date(new Date().toDateString()), {
    message: "startDate cannot be in the past",
    path: ["startDate"],
});
export type CreateRentalRequestDto = z.infer<typeof CreateRentalRequestDto>;

// Admin marks equipment picked up
export const ConfirmPickupDto = z.object({
    rentalId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});
export type ConfirmPickupDto = z.infer<typeof ConfirmPickupDto>;

// Admin processes return and deposit settlement
export const ProcessReturnDto = z.object({
    deductionAmount: z.number().min(0).default(0),
    deductionReason: z.string().max(500).optional(),
}).refine((v) => v.deductionAmount === 0 || !!v.deductionReason, {
    message: "deductionReason is required when deductionAmount > 0",
    path: ["deductionReason"],
});
export type ProcessReturnDto = z.infer<typeof ProcessReturnDto>;

export const CancelRentalDto = z.object({
    reason: z.string().max(300).optional(),
});
export type CancelRentalDto = z.infer<typeof CancelRentalDto>;