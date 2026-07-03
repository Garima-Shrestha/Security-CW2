import mongoose, { Document, Schema } from "mongoose";
import { EquipmentCategoryType } from "../types/equipment-category.type";

const EquipmentCategorySchema: Schema = new Schema({
    name: { type: String, required: true, unique: true, minLength: 1, maxLength: 50 },
    description: { type: String, required: false, maxLength: 300 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

export interface IEquipmentCategory extends EquipmentCategoryType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const EquipmentCategoryModel = mongoose.model<IEquipmentCategory>("EquipmentCategory", EquipmentCategorySchema);