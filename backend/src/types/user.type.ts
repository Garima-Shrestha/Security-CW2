import z from 'zod';

export const UserSchema = z.object({
    username: z.string().min(2).max(30),
    email: z.string().email(),
    phone: z.string().regex(/^\d{8,15}$/, "Phone number must be 8-15 digits"),
    // password is optional at schema level because Google OAuth users won't have one
    password: z.string().min(12).optional(),
    role: z.enum(['admin', 'user']).default('user'),
    imageUrl: z.string().optional(),

    //Auth provider tracking
    authProvider: z.enum(['local', 'google']).default('local'),
    googleId: z.string().optional(),

    //TOTP (MFA)
    totpSecret: z.string().optional(),        // encrypted at rest, set during MFA setup
    isTotpEnabled: z.boolean().default(false),

    // Brute-force / lockout tracking 
    failedLoginAttempts: z.number().int().min(0).default(0),
    lockoutUntil: z.date().optional(),

    // Password policy 
    passwordChangedAt: z.date().optional(),
    previousPasswordHashes: z.array(z.string()).default([]), // last 5, for reuse prevention
});

export type UserType = z.infer<typeof UserSchema>;