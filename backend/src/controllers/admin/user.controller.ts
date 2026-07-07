import { Request, Response } from "express";
import { UserAdminService } from "../../services/admin/user.service";

const userAdminService = new UserAdminService();

export class AdminUserController {
    async getAllUsers(req: Request, res: Response) {
        try {
            const { page, size, searchTerm } = req.query as any;
            const result = await userAdminService.getAllUsers(page, size, searchTerm);

            return res.status(200).json({
                success: true,
                data: result.users,
                pagination: result.pagination,
                message: "Users fetched successfully",
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}