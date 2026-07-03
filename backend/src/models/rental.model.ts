import mongoose, { Document, Schema } from "mongoose";
import { RentalStatus, RentalStatusType } from "../types/rental.type";

const RentalSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    equipment: { type: Schema.Types.ObjectId, ref: "Equipment", required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    dailyRate: { type: Number, required: true, min: 0 },
    totalDays: { type: Number, required: true, min: 1 },
    rentalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: RentalStatus, default: "pending" },

    deductionAmount: { type: Number, default: 0, min: 0 },
    deductionReason: { type: String, required: false },
    depositRefunded: { type: Boolean, default: false },

    pickupConfirmedAt: { type: Date, required: false },
    returnedAt: { type: Date, required: false },

    isPaid: { type: Boolean, default: false },

    // Set after Khalti payment verification and stored here for quick lookup.
    khaltiPidx: { type: String, required: false },
}, {
    timestamps: true,
});

// Helps speed up availability and "my rentals" queries.
RentalSchema.index({ equipment: 1, startDate: 1, endDate: 1 });
RentalSchema.index({ user: 1, status: 1 });

export interface IRental extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    equipment: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    dailyRate: number;
    totalDays: number;
    rentalAmount: number;
    depositAmount: number;
    status: RentalStatusType;
    deductionAmount: number;
    deductionReason?: string;
    depositRefunded: boolean;
    pickupConfirmedAt?: Date;
    returnedAt?: Date;
    isPaid: boolean;
    khaltiPidx?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const RentalModel = mongoose.model<IRental>("Rental", RentalSchema);