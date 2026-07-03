import { RentalRepository } from "../repositories/rental.repository";
import { EquipmentRepository } from "../repositories/equipment.repository";
import { CreateRentalRequestDto } from "../dtos/rental.dto";
import { HttpError } from "../errors/http-error";
import { logActivity, logSecurityEvent } from "../config/logger";

let rentalRepo = new RentalRepository();
let equipmentRepo = new EquipmentRepository();

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class RentalService {
    // Create a pending rental before payment, with all amounts computed on the server.
    async createRentalRequest(userId: string, data: CreateRentalRequestDto) {
        const equipment = await equipmentRepo.getEquipmentById(data.equipmentId);
        if (!equipment || !equipment.isActive) {
            throw new HttpError(404, "Equipment not found or unavailable");
        }

        const overlapping = await rentalRepo.hasOverlappingRental(
            data.equipmentId,
            data.startDate,
            data.endDate
        );
        if (overlapping) {
            throw new HttpError(409, "Equipment is already booked for the selected dates");
        }

        const totalDays = Math.ceil(
            (data.endDate.getTime() - data.startDate.getTime()) / MS_PER_DAY
        );
        if (totalDays < 1) {
            throw new HttpError(400, "Rental must be at least 1 day");
        }

        // Prices come from the equipment record on the server, never from the client
        const rentalAmount = equipment.dailyRate * totalDays;
        const depositAmount = equipment.depositAmount;

        const rental = await rentalRepo.createRental({
            user: userId as any,
            equipment: data.equipmentId as any,
            startDate: data.startDate,
            endDate: data.endDate,
            dailyRate: equipment.dailyRate,
            totalDays,
            rentalAmount,
            depositAmount,
            status: "pending",
            isPaid: false,
        });

        logActivity("RENTAL_REQUEST_CREATED", { userId, rentalId: rental._id.toString(), equipmentId: data.equipmentId });
        return rental;
    }

    // Checks ownership so users can only access their own rentals (prevents IDOR).
    async getOwnedRental(userId: string, rentalId: string) {
        const rental = await rentalRepo.getRentalById(rentalId);
        if (!rental) throw new HttpError(404, "Rental not found");

        if (rental.user._id.toString() !== userId.toString()) {
            logSecurityEvent("IDOR_ATTEMPT_RENTAL", { userId, rentalId, ownerUserId: rental.user._id.toString() });
           // Return 404 instead of 403 to avoid revealing if the rental exists.
            throw new HttpError(404, "Rental not found");
        }
        return rental;
    }

    async getUserRentals(userId: string, page?: string, size?: string, status?: any) {
        const currentPage = page ? parseInt(page, 10) : 1;
        const pageSize = size ? parseInt(size, 10) : 10;
        const { rentals, total } = await rentalRepo.getUserRentalsPaginated(userId, currentPage, pageSize, status);
        return {
            rentals,
            pagination: { page: currentPage, size: pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    }

    async cancelRental(userId: string, rentalId: string) {
        const rental = await this.getOwnedRental(userId, rentalId);

        if (!["pending", "confirmed"].includes(rental.status)) {
            throw new HttpError(400, `Cannot cancel a rental in status '${rental.status}'`);
        }

        const updated = await rentalRepo.updateRental(rentalId, { status: "cancelled" });
        logActivity("RENTAL_CANCELLED", { userId, rentalId });
        return updated;
    }
}