import z from 'zod';
import { UserSchema } from '../types/user.type';

// For local register — password required here even though schema-level it's optional
// (schema stays optional to allow OAuth users with no password)
export const RegisterUserDto = UserSchema.pick({
    username: true,
    email: true,
    phone: true,
    imageUrl: true,
}).extend({
    password: z.string()
        .min(12, "Password must be at least 12 characters")
        .max(64)
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
});
export type RegisterUserDto = z.infer<typeof RegisterUserDto>;

// email and password only
export const LoginUserDto = z.object({
    email: z.string().email(),
    password: z.string().min(1), // don't leak policy details on login form
});
export type LoginUserDto = z.infer<typeof LoginUserDto>;

// verify the 6-digit TOTP code 
export const VerifyTotpDto = z.object({
    preAuthToken: z.string().min(1),
    code: z.string().length(6).regex(/^\d{6}$/, "Code must be 6 digits"),
});
export type VerifyTotpDto = z.infer<typeof VerifyTotpDto>;

// user confirms the code shown by their authenticator app before we turn it on
export const EnableTotpDto = z.object({
    code: z.string().length(6).regex(/^\d{6}$/),
});
export type EnableTotpDto = z.infer<typeof EnableTotpDto>;

export const UpdateUserDto = UserSchema.pick({
    username: true,
    imageUrl: true,
}).partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

export const ChangePasswordDto = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string()
        .min(12)
        .max(64)
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordDto>;

export const RequestPasswordResetDto = z.object({
    email: z.string().email(),
});
export type RequestPasswordResetDto = z.infer<typeof RequestPasswordResetDto>;

export const ResetPasswordDto = z.object({
    token: z.string().min(1),
    newPassword: z.string()
        .min(12)
        .max(64)
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;