import z from "zod";

export const ContactMessageDto = z.object({
    subject: z.string().min(3, "Subject is required").max(100),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});
export type ContactMessageDto = z.infer<typeof ContactMessageDto>;