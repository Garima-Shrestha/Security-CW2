import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(2, "Username must be at least 2 characters").max(30),
    email: z.string().email("Enter a valid email"),
    phone: z.string().regex(/^\d{8,15}$/, "Phone must be 8-15 digits"),
    password: z.string()
        .min(12, "Password must be at least 12 characters")
        .max(64)
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: "You must accept the Terms & Conditions to register",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const totpSchema = z.object({
    code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be digits only"),
});

export type TotpFormValues = z.infer<typeof totpSchema>;