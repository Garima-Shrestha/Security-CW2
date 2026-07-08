import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http-error";
import { logActivity } from "../../config/logger";
import { sanitizeText } from "../../utils/sanitize";
import bcryptjs from "bcryptjs";
import { AdminCreateUserDto, AdminUpdateUserDto } from "../../dtos/user.dtos";

const userRepository = new UserRepository();

export class UserAdminService {
    async getAllUsers(page?: string, size?: string, searchTerm?: string) {
        const currentPage = page ? parseInt(page, 10) : 1;
        const pageSize = size ? parseInt(size, 10) : 10;

        const { users, total } = await userRepository.getAllUsersPaginated(currentPage, pageSize, searchTerm);

        return {
            users,
            pagination: { page: currentPage, size: pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    }

    async createUser(adminId: string, data: AdminCreateUserDto) {
        const existingEmail = await userRepository.getUserByEmail(data.email);
        if (existingEmail) throw new HttpError(409, "Email already in use");

        const existingUsername = await userRepository.getUserByUsername(data.username);
        if (existingUsername) {
            throw new HttpError(409, "Username already in use");
        }

        if (data.phone) {
            const existingPhone = await userRepository.getUserByPhone(data.phone);
            if (existingPhone) {
                throw new HttpError(409, "Phone number already in use");
            }
        }

        const hashedPassword = await bcryptjs.hash(data.password, 12);

        const newUser = await userRepository.createUser({
            username: sanitizeText(data.username),
            email: data.email,
            phone: data.phone ? sanitizeText(data.phone) : undefined,
            password: hashedPassword,
            // role: data.role,
            role: "user",
            authProvider: "local",
            passwordChangedAt: new Date(),
            previousPasswordHashes: [hashedPassword],
        } as any);

        logActivity("ADMIN_CREATED_USER", { adminId, targetUserId: newUser._id.toString() });
        return newUser;
    }

    async updateUser(adminId: string, userId: string, data: AdminUpdateUserDto) {
        const user = await userRepository.getUserById(userId);
        if (!user) throw new HttpError(404, "User not found");

        const updates: any = {};
        if (data.username) {
            const existing = await userRepository.getUserByUsername(data.username);
            if (existing && existing._id.toString() !== userId) throw new HttpError(409, "Username already in use");
            updates.username = sanitizeText(data.username);
        }
        if (data.email) {
            const existing = await userRepository.getUserByEmail(data.email);
            if (existing && existing._id.toString() !== userId) throw new HttpError(409, "Email already in use");
            updates.email = data.email;
        }
        if (data.phone) {
            const existingPhone = await userRepository.getUserByPhone(data.phone);
            if (existingPhone && existingPhone._id.toString() !== userId) {
                throw new HttpError(409, "Phone number already in use");
            }
            updates.phone = sanitizeText(data.phone);
        }

        const updated = await userRepository.updateOneUser(userId, updates);
        logActivity("ADMIN_UPDATED_USER", { adminId, targetUserId: userId });
        return updated;
    }

    async deleteUser(adminId: string, userId: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) throw new HttpError(404, "User not found");
        if (user.role === "admin") throw new HttpError(400, "Cannot delete an admin account");
        if (userId === adminId) throw new HttpError(400, "Cannot delete your own account");

        const deleted = await userRepository.deleteOneUser(userId);
        logActivity("ADMIN_DELETED_USER", { adminId, targetUserId: userId });
        return deleted;
    }
}