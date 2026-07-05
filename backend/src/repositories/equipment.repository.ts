import { IEquipment, EquipmentModel } from "../models/equipment.model";

export interface IEquipmentRepository {
    createEquipment(data: Partial<IEquipment>): Promise<IEquipment>;
    getEquipmentById(id: string): Promise<IEquipment | null>;
    updateOneEquipment(id: string, data: Partial<IEquipment>): Promise<IEquipment | null>;
    deleteOneEquipment(id: string): Promise<boolean | null>;
    getAllEquipmentPaginated(page: number, size: number, searchTerm?: string, categoryId?: string): Promise<{ equipment: IEquipment[]; total: number }>;
    getAllActiveForFuzzySearch(categoryId?: string): Promise<IEquipment[]>;
}

export class EquipmentRepository implements IEquipmentRepository {
    async createEquipment(data: Partial<IEquipment>): Promise<IEquipment> {
        const equipment = new EquipmentModel(data);
        return await equipment.save();
    }

    async getEquipmentById(id: string): Promise<IEquipment | null> {
        return await EquipmentModel.findById(id).populate("category");
    }

    async updateOneEquipment(id: string, data: Partial<IEquipment>): Promise<IEquipment | null> {
        return await EquipmentModel.findByIdAndUpdate(id, data, { new: true }).populate("category");
    }

    async deleteOneEquipment(id: string): Promise<boolean | null> {
        const result = await EquipmentModel.findByIdAndDelete(id);
        return result ? true : null;
    }

    async getAllEquipmentPaginated(
        page: number,
        size: number,
        searchTerm?: string,
        categoryId?: string
    ): Promise<{ equipment: IEquipment[]; total: number }> {
        const filter: any = { isActive: true };

        if (categoryId) filter.category = categoryId;
        if (searchTerm) {
            filter.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { brand: { $regex: searchTerm, $options: "i" } },
                { model: { $regex: searchTerm, $options: "i" } },
            ];
        }

        const [equipment, total] = await Promise.all([
            EquipmentModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .populate("category"),
            EquipmentModel.countDocuments(filter),
        ]);

        return { equipment, total };
    }

    async getAllActiveForFuzzySearch(categoryId?: string): Promise<IEquipment[]> {
        const filter: any = { isActive: true };
        if (categoryId) filter.category = categoryId;
        return await EquipmentModel.find(filter).populate("category");
    }
}