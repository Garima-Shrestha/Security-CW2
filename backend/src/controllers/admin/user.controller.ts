import { Request, Response } from "express";
import z from "zod";
import { UserAdminService } from "../../services/admin/user.service";
import { AdminCreateUserDto, AdminUpdateUserDto } from "../../dtos/user.dtos";

const userAdminService = new UserAdminService();

export class AdminUserController {
    async getAllUsers(req: Request, res: Response) {
        try {
            const { page, size, searchTerm } = req.query as any;
            const result = await userAdminService.getAllUsers(page, size, searchTerm);
            return res.status(200).json({
                success: true, data: result.users, pagination: result.pagination, message: "Users fetched successfully",
            });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async createUser(req: Request, res: Response) {
        try {
            const parsed = AdminCreateUserDto.safeParse(req.body);
            if (!parsed.success) return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            const adminId = req.user?._id?.toString() || "unknown";
            const newUser = await userAdminService.createUser(adminId, parsed.data);
            return res.status(201).json({ success: true, data: newUser, message: "User created successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const parsed = AdminUpdateUserDto.safeParse(req.body);
            if (!parsed.success) return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            const adminId = req.user?._id?.toString() || "unknown";
            const updated = await userAdminService.updateUser(adminId, req.params.id as string, parsed.data);
            return res.status(200).json({ success: true, data: updated, message: "User updated successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const adminId = req.user?._id?.toString() || "unknown";
            await userAdminService.deleteUser(adminId, req.params.id as string);
            return res.status(200).json({ success: true, message: "User deleted successfully" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}