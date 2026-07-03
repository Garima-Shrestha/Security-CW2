import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterUserDto, LoginUserDto, ChangePasswordDto } from "../dtos/user.dtos";
import { UserRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/http-error";
import { TotpService } from "./totp.service";
import { logActivity, logSecurityEvent } from "../config/logger";
import { sanitizeText } from "../utils/sanitize";
import { sendEmail } from "../config/email";
import { RESET_TOKEN_EXPIRY, CLIENT_URL } from "../config";
import { JWT_SECRET, JWT_EXPIRY, PRE_AUTH_TOKEN_EXPIRY, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES, PASSWORD_HISTORY_LIMIT,} from "../config";
import { hashUserAgent } from "../utils/device"; 

let userRepository = new UserRepository();
let totpService = new TotpService();

export class AuthService {
    // Register 
    async registerUser(data: RegisterUserDto) {
        const existingEmail = await userRepository.getUserByEmail(data.email);
        if (existingEmail) {
            throw new HttpError(409, "Email already in use");
        }
        const existingUsername = await userRepository.getUserByUsername(data.username);
        if (existingUsername) {
            throw new HttpError(409, "Username already in use");
        }

        const hashedPassword = await bcryptjs.hash(data.password, 12);

        const newUser = await userRepository.createUser({
            username: sanitizeText(data.username),
            email: data.email,
            password: hashedPassword,
            imageUrl: data.imageUrl,
            authProvider: "local",
            passwordChangedAt: new Date(),
            previousPasswordHashes: [hashedPassword],
        } as any);

        logActivity("USER_REGISTERED", { userId: newUser._id.toString(), email: newUser.email });

        return newUser;
    }

    //  verify password, check lockout, issue pre-auth token 
    async loginStepOne(data: LoginUserDto, userAgent?: string) {
        const user = await userRepository.getUserByEmail(data.email, true); // withSecrets

        // Return the same error for invalid email or password to avoid revealing which one failed.
        const genericError = () => new HttpError(401, "Invalid email or password");

        if (!user || !user.password) {
            throw genericError();
        }

        // Check lockout
        if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
            const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
            throw new HttpError(429, `Account temporarily locked. Try again in ${minutesLeft} minute(s).`);
        }

        const isPasswordValid = await bcryptjs.compare(data.password, user.password);

        if (!isPasswordValid) {
            const updated = await userRepository.incrementFailedAttempts(user._id.toString());
            logSecurityEvent("LOGIN_FAILED", { userId: user._id.toString(), attempts: updated?.failedLoginAttempts });
            if (updated && updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
                await userRepository.setLockout(user._id.toString(), lockUntil);
                logSecurityEvent("ACCOUNT_LOCKED", { userId: user._id.toString() });
                throw new HttpError(429, `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`);
            }
            throw genericError();
        }

        // Clear failed attempts when password is correct
        await userRepository.resetFailedAttempts(user._id.toString());
        logActivity("LOGIN_SUCCESS", { userId: user._id.toString() });

        // If TOTP is not enabled, log the user in and prompt MFA setup
        if (!user.isTotpEnabled) {
            const token = this.issueAccessToken(user._id.toString(), user.email, user.role, hashUserAgent(userAgent));
            return { requiresTotp: false as const, token, user };
        }

        // TOTP required, issue short-lived pre-auth token, NOT the real access token
        const preAuthToken = jwt.sign(
            { id: user._id, stage: "pre-auth" },
            JWT_SECRET,
            { expiresIn: PRE_AUTH_TOKEN_EXPIRY as any }
        );

        return { requiresTotp: true as const, preAuthToken };
    }

    // verify TOTP code against pre-auth token 
    async loginStepTwo(preAuthToken: string, code: string, userAgent?: string) {
        let decoded: any;
        try {
            decoded = jwt.verify(preAuthToken, JWT_SECRET);
        } catch {
            throw new HttpError(401, "Pre-auth session expired, please log in again");
        }

        if (decoded.stage !== "pre-auth") {
            throw new HttpError(401, "Invalid authentication stage");
        }

        const user = await userRepository.getUserById(decoded.id, true); // withSecrets
        if (!user || !user.totpSecret) {
            throw new HttpError(401, "MFA not configured for this account");
        }

        const isValid = totpService.verifyCode(user.totpSecret, code);
        if (!isValid) {
            throw new HttpError(401, "Invalid authentication code");
        }

        const token = this.issueAccessToken(user._id.toString(), user.email, user.role, hashUserAgent(userAgent));
        return { token, user };
    }

    // Generate TOTP secret and QR, enable only after confirmation
    async setupTotp(userId: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) throw new HttpError(404, "User not found");
        if (user.isTotpEnabled) throw new HttpError(400, "MFA is already enabled");

        const { base32, otpauthUrl } = totpService.generateSecret(user.email);
        const qrCode = await totpService.generateQrCodeDataUrl(otpauthUrl!);

        // Store secret but keep isTotpEnabled=false until user confirms with a valid code
        await userRepository.updateOneUser(userId, { totpSecret: base32 } as any);

        return { qrCode, secret: base32 };
    }

    // Confirm and enable TOTP 
    async enableTotp(userId: string, code: string) {
        const user = await userRepository.getUserById(userId, true);
        if (!user || !user.totpSecret) {
            throw new HttpError(400, "TOTP setup not initiated");
        }

        const isValid = totpService.verifyCode(user.totpSecret, code);
        if (!isValid) {
            throw new HttpError(401, "Invalid code, MFA not enabled");
        }

        await userRepository.updateOneUser(userId, { isTotpEnabled: true } as any);
        logActivity("MFA_ENABLED", { userId });
        return { message: "MFA enabled successfully" };
    }

    // Change password with reuse prevention
    async changePassword(userId: string, data: ChangePasswordDto) {
        const user = await userRepository.getUserById(userId, true);
        if (!user || !user.password) throw new HttpError(404, "User not found");

        const isValid = await bcryptjs.compare(data.oldPassword, user.password);
        if (!isValid) throw new HttpError(401, "Old password is incorrect");

        // Prevent reuse of last N passwords
        for (const oldHash of user.previousPasswordHashes || []) {
            const matches = await bcryptjs.compare(data.newPassword, oldHash);
            if (matches) {
                throw new HttpError(400, `New password cannot match any of your last ${PASSWORD_HISTORY_LIMIT} passwords`);
            }
        }

        const newHash = await bcryptjs.hash(data.newPassword, 12);
        const updatedHistory = [newHash, ...(user.previousPasswordHashes || [])].slice(0, PASSWORD_HISTORY_LIMIT);

        await userRepository.updateOneUser(userId, {
            password: newHash,
            previousPasswordHashes: updatedHistory,
            passwordChangedAt: new Date(),
        } as any);

        logActivity("PASSWORD_CHANGED", { userId });
        return { message: "Password changed successfully" };
    }

    // Request password reset always return generic success so we don't leak which emails exist
    async requestPasswordReset(email: string) {
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            // doesn't reveal whether the email exists
            return { message: "If that email is registered, a reset link has been sent." };
        }

        const resetToken = jwt.sign(
            { id: user._id.toString(), stage: "password-reset" },
            JWT_SECRET,
            { expiresIn: RESET_TOKEN_EXPIRY as any }
        );

        const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;
        const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in ${RESET_TOKEN_EXPIRY}.</p>`;

        await sendEmail(user.email, "Password Reset Request", html);
        logActivity("PASSWORD_RESET_REQUESTED", { userId: user._id.toString() });

        return { message: "If that email is registered, a reset link has been sent." };
    }

    // Reset password using the emailed token
    async resetPassword(token: string, newPassword: string) {
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            throw new HttpError(400, "Invalid or expired reset token");
        }

        if (decoded.stage !== "password-reset") {
            throw new HttpError(400, "Invalid reset token");
        }

        const user = await userRepository.getUserById(decoded.id, true);
        if (!user) throw new HttpError(404, "User not found");

        if (user.password) {
            for (const oldHash of user.previousPasswordHashes || []) {
                const matches = await bcryptjs.compare(newPassword, oldHash);
                if (matches) {
                    throw new HttpError(400, `New password cannot match any of your last ${PASSWORD_HISTORY_LIMIT} passwords`);
                }
            }
        }

        const newHash = await bcryptjs.hash(newPassword, 12);
        const updatedHistory = [newHash, ...(user.previousPasswordHashes || [])].slice(0, PASSWORD_HISTORY_LIMIT);

        await userRepository.updateOneUser(decoded.id, {
            password: newHash,
            previousPasswordHashes: updatedHistory,
            passwordChangedAt: new Date(),
            failedLoginAttempts: 0,
        } as any);

        logActivity("PASSWORD_RESET_COMPLETED", { userId: decoded.id });
        return { message: "Password has been reset successfully" };
    }

    private issueAccessToken(id: string, email: string, role: string, uaHash: string): string {
        return jwt.sign(
            { id, email, role, stage: "full", ua: uaHash },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY as any }
        );
    }
}