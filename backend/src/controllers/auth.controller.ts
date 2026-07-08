import { Request, Response } from "express";
import z from "zod";
import { RegisterUserDto, LoginUserDto, VerifyTotpDto, EnableTotpDto, ChangePasswordDto, UpdateUserDto } from "../dtos/user.dtos";
import { AuthService } from "../services/auth.service";
import { OAuthService } from "../services/oauth.service";
import { RequestPasswordResetDto, ResetPasswordDto } from "../dtos/user.dtos";

let authService = new AuthService();
let oauthService = new OAuthService();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const parsed = RegisterUserDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const newUser = await authService.registerUser(parsed.data);
            return res.status(201).json({ success: true, data: newUser, message: "Registered successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    // step 1 - email + password
    async login(req: Request, res: Response) {
        try {
            const parsed = LoginUserDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const result = await authService.loginStepOne(parsed.data, req.headers["user-agent"]);

            if (result.requiresTotp) {
                return res.status(200).json({ success: true, requiresTotp: true, preAuthToken: result.preAuthToken });
            }
            return res.status(200).json({ success: true, requiresTotp: false, token: result.token, data: result.user });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    // step 2 - totp code
    async verifyTotp(req: Request, res: Response) {
        try {
            const parsed = VerifyTotpDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const result = await authService.loginStepTwo(parsed.data.preAuthToken, parsed.data.code, req.headers["user-agent"]);
            return res.status(200).json({ success: true, token: result.token, data: result.user });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async setupTotp(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const result = await authService.setupTotp(userId.toString());
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async enableTotp(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = EnableTotpDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const result = await authService.enableTotp(userId.toString(), parsed.data.code);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async changePassword(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = ChangePasswordDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const result = await authService.changePassword(userId.toString(), parsed.data);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async requestPasswordReset(req: Request, res: Response) {
        try {
            const parsed = RequestPasswordResetDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const result = await authService.requestPasswordReset(parsed.data.email);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const parsed = ResetPasswordDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const result = await authService.resetPassword(parsed.data.token, parsed.data.newPassword);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getProfile(req: Request, res: Response) {
        return res.status(200).json({ success: true, data: req.user });
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = UpdateUserDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const updated = await authService.updateProfile(userId.toString(), parsed.data);
            return res.status(200).json({ success: true, data: updated, message: "Profile updated successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    // called after passport finishes the google handshake, req.user is set by passport at this point
    async googleCallback(req: Request, res: Response) {
        try {
            const user = req.user as any;
            if (!user) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
            }
            const token = oauthService.issueTokenForUser(user._id.toString(), user.email, user.role, req.headers["user-agent"]);
            return res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
        } catch (error) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
        }
    }
}