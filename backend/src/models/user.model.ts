import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true, minLength: 2, maxLength: 30 },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false, unique: true, sparse: true },
    password: { type: String, required: false, select: false }, // select:false so it's never returned by default
    role: { type: String, enum: ["admin", "user"], default: "user" },
    imageUrl: { type: String, required: false },

    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, required: false, unique: true, sparse: true },

    totpSecret: { type: String, required: false, select: false }, // never returned by default
    isTotpEnabled: { type: Boolean, default: false },

    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, required: false },

    passwordChangedAt: { type: Date, required: false },
    previousPasswordHashes: { type: [String], default: [], select: false },
}, {
    timestamps: true,
});

export interface IUser extends Omit<UserType, 'password' | 'totpSecret' | 'previousPasswordHashes'>, Document {
    _id: mongoose.Types.ObjectId;
    password?: string;
    totpSecret?: string;
    previousPasswordHashes: string[];
    createdAt: Date;
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", UserSchema);