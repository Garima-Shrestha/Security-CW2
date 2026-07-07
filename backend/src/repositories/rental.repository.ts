import { IRental, RentalModel } from "../models/rental.model";
import { RentalStatusType } from "../types/rental.type";

export interface IRentalRepository {
    createRental(data: Partial<IRental>): Promise<IRental>;
    getRentalById(id: string): Promise<IRental | null>;
    updateRental(id: string, data: Partial<IRental>): Promise<IRental | null>;

// Checks if the equipment is already booked for the selected dates.
    hasOverlappingRental(equipmentId: string, startDate: Date, endDate: Date, excludeRentalId?: string): Promise<boolean>;

    getUserRentalsPaginated(userId: string, page: number, size: number, status?: RentalStatusType): Promise<{ rentals: IRental[]; total: number }>;
    getAllRentalsPaginated(page: number, size: number, status?: RentalStatusType, searchTerm?: string): Promise<{ rentals: IRental[]; total: number }>;

    getOverdueRentals(): Promise<IRental[]>;
    getStalePendingRentals(olderThanMinutes: number): Promise<IRental[]>;
    isCurrentlyBooked(equipmentId: string): Promise<boolean>;
}

export class RentalRepository implements IRentalRepository {
    async createRental(data: Partial<IRental>): Promise<IRental> {
        const rental = new RentalModel(data);
        return await rental.save();
    }

    async getRentalById(id: string): Promise<IRental | null> {
        return await RentalModel.findById(id).populate("user", "-password -totpSecret -previousPasswordHashes").populate("equipment");
    }

    async updateRental(id: string, data: Partial<IRental>): Promise<IRental | null> {
        return await RentalModel.findByIdAndUpdate(id, data, { new: true })
            .populate("user", "-password -totpSecret -previousPasswordHashes")
            .populate("equipment");
    }

    // If two bookings share any dates, they overlap.
    // Only unfinished rentals prevent booking the equipment.
    async hasOverlappingRental(
        equipmentId: string,
        startDate: Date,
        endDate: Date,
        excludeRentalId?: string
    ): Promise<boolean> {
        const filter: any = {
            equipment: equipmentId,
            status: { $in: ["pending", "confirmed", "active", "overdue"] },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate },
        };
        if (excludeRentalId) {
            filter._id = { $ne: excludeRentalId };
        }
        const conflict = await RentalModel.findOne(filter);
        return !!conflict;
    }

    async getUserRentalsPaginated(
        userId: string,
        page: number,
        size: number,
        status?: RentalStatusType
    ): Promise<{ rentals: IRental[]; total: number }> {
        const filter: any = { user: userId };
        if (status) filter.status = status;

        const [rentals, total] = await Promise.all([
            RentalModel.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size)
                .populate("equipment"),
            RentalModel.countDocuments(filter),
        ]);

        return { rentals, total };
    }

    async getAllRentalsPaginated(
        page: number,
        size: number,
        status?: RentalStatusType,
        searchTerm?: string
    ): Promise<{ rentals: IRental[]; total: number }> {
        const filter: any = {};
        if (status) filter.status = status;

        // For now, we only filter by status. Searching by name would require a join/aggregation.
        void searchTerm;

        const [rentals, total] = await Promise.all([
            RentalModel.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size)
                .populate("user", "-password -totpSecret -previousPasswordHashes")
                .populate("equipment"),
            RentalModel.countDocuments(filter),
        ]);

        return { rentals, total };
    }

    async getOverdueRentals(): Promise<IRental[]> {
        return await RentalModel.find({
            status: "active",
            endDate: { $lt: new Date() },
        });
    }

    async getStalePendingRentals(olderThanMinutes: number): Promise<IRental[]> {
        const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
        return await RentalModel.find({
            status: "pending",
            isPaid: false,
            createdAt: { $lt: cutoff },
        });
    }

    async isCurrentlyBooked(equipmentId: string): Promise<boolean> {
        const now = new Date();
        const conflict = await RentalModel.findOne({
            equipment: equipmentId,
            status: { $in: ["pending", "confirmed", "active", "overdue"] },
            startDate: { $lte: now },
            endDate: { $gte: now },
        });
        return !!conflict;
    }
}