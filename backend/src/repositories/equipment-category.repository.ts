import { IEquipmentCategory, EquipmentCategoryModel } from "../models/equipment-category.model";

export interface IEquipmentCategoryRepository {
    createCategory(data: Partial<IEquipmentCategory>): Promise<IEquipmentCategory>;
    getCategoryByName(name: string): Promise<IEquipmentCategory | null>;
    getCategoryById(id: string): Promise<IEquipmentCategory | null>;
    getAllCategories(): Promise<IEquipmentCategory[]>;
    updateOneCategory(id: string, data: Partial<IEquipmentCategory>): Promise<IEquipmentCategory | null>;
    deleteOneCategory(id: string): Promise<boolean | null>;
}

export class EquipmentCategoryRepository implements IEquipmentCategoryRepository {
    async createCategory(data: Partial<IEquipmentCategory>): Promise<IEquipmentCategory> {
        const category = new EquipmentCategoryModel(data);
        return await category.save();
    }

    async getCategoryByName(name: string): Promise<IEquipmentCategory | null> {
        return await EquipmentCategoryModel.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });
    }

    async getCategoryById(id: string): Promise<IEquipmentCategory | null> {
        return await EquipmentCategoryModel.findById(id);
    }

    async getAllCategories(): Promise<IEquipmentCategory[]> {
        return await EquipmentCategoryModel.find().sort({ name: 1 });
    }

    async updateOneCategory(id: string, data: Partial<IEquipmentCategory>): Promise<IEquipmentCategory | null> {
        return await EquipmentCategoryModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteOneCategory(id: string): Promise<boolean | null> {
        const result = await EquipmentCategoryModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}

function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}