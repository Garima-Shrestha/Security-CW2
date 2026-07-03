import mongoose, { Schema } from "mongoose";
import { EquipmentType } from "../types/equipment.type";

const EquipmentSchema: Schema = new Schema({
    title: { type: String, required: true, minLength: 2, maxLength: 100 },
    description: { type: String, required: true, maxLength: 2000 },
    category: { type: Schema.Types.ObjectId, ref: "EquipmentCategory", required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    condition: { type: String, enum: ["new", "excellent", "good", "fair"], default: "good" },
    dailyRate: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    specs: { type: Map, of: String, required: false },
    images: { type: [String], required: true, validate: (v: string[]) => v.length > 0 && v.length <= 6 },
    isActive: { type: Boolean, default: true },
}, {    
    timestamps: true,
});

export interface IEquipment extends Omit<EquipmentType, "category"> {
    _id: mongoose.Types.ObjectId;
    category: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const EquipmentModel = mongoose.model<IEquipment>("Equipment", EquipmentSchema);