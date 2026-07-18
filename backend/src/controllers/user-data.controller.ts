import { Request, Response } from "express";
import z from "zod";
import { UserRepository } from "../repositories/user.repository";
import { RentalRepository } from "../repositories/rental.repository";
import { sanitizeText } from "../utils/sanitize";
import { logActivity } from "../config/logger";

const userRepository = new UserRepository();
const rentalRepository = new RentalRepository();

const ImportProfileDto = z.object({
    username: z.string().min(2).max(30).optional(),
    imageUrl: z.string().optional(),
});

export class UserDataController {
    // Export the user's own profile + rental history as JSON (no secrets included)
    async exportMyData(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const user = await userRepository.getUserById(userId.toString());
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            const { rentals } = await rentalRepository.getUserRentalsPaginated(userId.toString(), 1, 1000);

            const exportData = {
                exportedAt: new Date().toISOString(),
                profile: {
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    authProvider: user.authProvider,
                    isTotpEnabled: user.isTotpEnabled,
                    createdAt: user.createdAt,
                },
                rentalHistory: rentals.map((r: any) => ({
                    equipment: r.equipment?.title,
                    startDate: r.startDate,
                    endDate: r.endDate,
                    rentalAmount: r.rentalAmount,
                    depositAmount: r.depositAmount,
                    status: r.status,
                    createdAt: r.createdAt,
                })),
            };

            logActivity("USER_DATA_EXPORTED", { userId: userId.toString() });

            res.setHeader("Content-Disposition", "attachment; filename=shutter-my-data.json");
            res.setHeader("Content-Type", "application/json");
            return res.status(200).send(JSON.stringify(exportData, null, 2));
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    // Import limited, safe profile fields only, never role, password, or IDs
    async importMyData(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = ImportProfileDto.safeParse(req.body?.profile || {});
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const updates: any = {};
            if (parsed.data.username) {
                const cleanUsername = sanitizeText(parsed.data.username);
                const existing = await userRepository.getUserByUsername(cleanUsername);
                if (existing && existing._id.toString() !== userId.toString()) {
                    return res.status(409).json({ success: false, message: "Username already in use" });
                }
                updates.username = cleanUsername;
            }
            if (parsed.data.imageUrl) updates.imageUrl = parsed.data.imageUrl;

            const updated = await userRepository.updateOneUser(userId.toString(), updates);
            logActivity("USER_DATA_IMPORTED", { userId: userId.toString() });

            return res.status(200).json({ success: true, data: updated, message: "Profile data imported successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}