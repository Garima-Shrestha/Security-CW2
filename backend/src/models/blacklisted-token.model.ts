import mongoose, { Document, Schema } from "mongoose";

// Stores tokens that have been explicitly logged out before their natural expiry.
// TTL index auto-deletes entries once the original token would have expired anyway,
// so this collection never grows unbounded.
const BlacklistedTokenSchema: Schema = new Schema({
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
});

// TTL index: MongoDB automatically removes the document once expiresAt has passed
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface IBlacklistedToken extends Document {
    token: string;
    userId: mongoose.Types.ObjectId;
    expiresAt: Date;
}

export const BlacklistedTokenModel = mongoose.model<IBlacklistedToken>(
    "BlacklistedToken",
    BlacklistedTokenSchema
);