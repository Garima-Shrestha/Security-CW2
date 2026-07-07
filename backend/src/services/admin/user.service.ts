import { UserRepository } from "../../repositories/user.repository";

const userRepository = new UserRepository();

export class UserAdminService {
    async getAllUsers(page?: string, size?: string, searchTerm?: string) {
        const currentPage = page ? parseInt(page, 10) : 1;
        const pageSize = size ? parseInt(size, 10) : 10;

        const { users, total } = await userRepository.getAllUsersPaginated(currentPage, pageSize, searchTerm);

        return {
            users,
            pagination: {
                page: currentPage,
                size: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
}