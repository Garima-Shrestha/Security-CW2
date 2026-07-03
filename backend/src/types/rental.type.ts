import z from "zod";

export const RentalStatus = [
    "pending",      // created, payment initiated
    "confirmed",    // payment completed, awaiting pickup
    "active",       // equipment picked up, rental in progress
    "returned",     // equipment returned, awaiting deposit settlement
    "completed",    // deposit settled, rental closed
    "cancelled",    // cancelled before payment/pickup
    "overdue",      // past endDate, not yet returned
] as const;

export type RentalStatusType = (typeof RentalStatus)[number];

export const RentalSchema = z.object({
    user: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID"),
    equipment: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Equipment ID"),

    startDate: z.preprocess(val => new Date(val as string), z.date()),
    endDate: z.preprocess(val => new Date(val as string), z.date()),

    dailyRate: z.number().positive(),        // Keep the original price even if the equipment price changes later.
    totalDays: z.number().int().positive(),
    rentalAmount: z.number().positive(),       // dailyRate * totalDays
    depositAmount: z.number().min(0),          // Saved from the equipment when the booking was created

    status: z.enum(RentalStatus).default("pending"),

    // deposit settlement after return
    deductionAmount: z.number().min(0).default(0),
    deductionReason: z.string().max(500).optional(),
    depositRefunded: z.boolean().default(false),

    pickupConfirmedAt: z.date().optional(),
    returnedAt: z.date().optional(),

    // set true only by server after successful payment verify
    isPaid: z.boolean().default(false),
}).refine((v) => v.endDate > v.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
});

export type RentalType = z.infer<typeof RentalSchema>;