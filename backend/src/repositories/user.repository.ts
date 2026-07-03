import { IUser, UserModel } from "../models/user.model";

export interface IUserRepository {
    createUser(data: Partial<IUser>): Promise<IUser>;
    getUserByEmail(email: string, withSecrets?: boolean): Promise<IUser | null>;
    getUserByUsername(username: string): Promise<IUser | null>;
    getUserByGoogleId(googleId: string): Promise<IUser | null>;
    getUserById(id: string, withSecrets?: boolean): Promise<IUser | null>;
    updateOneUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
    deleteOneUser(id: string): Promise<boolean | null>;

    incrementFailedAttempts(id: string): Promise<IUser | null>;
    resetFailedAttempts(id: string): Promise<IUser | null>;
    setLockout(id: string, until: Date): Promise<IUser | null>;
}

export class UserRepository implements IUserRepository {
    async createUser(data: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(data);
        return await user.save();
    }

    // Include auth-only fields (password, TOTP secret, etc.)
    // Use only in authentication flows, not profile queries
    async getUserByEmail(email: string, withSecrets = false): Promise<IUser | null> {
        const query = UserModel.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } });
        if (withSecrets) query.select("+password +totpSecret +previousPasswordHashes");
        return await query;
    }

    async getUserByUsername(username: string): Promise<IUser | null> {
        return await UserModel.findOne({ username: { $regex: `^${escapeRegex(username)}$`, $options: "i" } });
    }

    async getUserByGoogleId(googleId: string): Promise<IUser | null> {
        return await UserModel.findOne({ googleId });
    }

    async getUserById(id: string, withSecrets = false): Promise<IUser | null> {
        const query = UserModel.findById(id);
        if (withSecrets) query.select("+password +totpSecret +previousPasswordHashes");
        return await query;
    }

    async updateOneUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
        return await UserModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteOneUser(id: string): Promise<boolean | null> {
        const result = await UserModel.findByIdAndDelete(id);
        return result ? true : null;
    }

    async incrementFailedAttempts(id: string): Promise<IUser | null> {
        return await UserModel.findByIdAndUpdate(
            id,
            { $inc: { failedLoginAttempts: 1 } },
            { new: true }
        );
    }

    async resetFailedAttempts(id: string): Promise<IUser | null> {
        return await UserModel.findByIdAndUpdate(
            id,
            { $set: { failedLoginAttempts: 0 }, $unset: { lockoutUntil: "" } },
            { new: true }
        );
    }

    async setLockout(id: string, until: Date): Promise<IUser | null> {
        return await UserModel.findByIdAndUpdate(
            id,
            { $set: { lockoutUntil: until } },
            { new: true }
        );
    }
}

// Treat user input as plain text in regex
// Helps avoid unexpected regex matches
function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}