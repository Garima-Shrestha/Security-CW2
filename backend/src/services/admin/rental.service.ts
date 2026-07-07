import { RentalRepository } from "../../repositories/rental.repository";
import { ProcessReturnDto } from "../../dtos/rental.dto";
import { HttpError } from "../../errors/http-error";
import { logActivity, logSecurityEvent } from "../../config/logger";
import { sanitizeText } from "../../utils/sanitize"; 

const rentalRepo = new RentalRepository();

export class RentalAdminService {
    async getAllRentals(page?: string, size?: string, status?: any) {
        const currentPage = page ? parseInt(page, 10) : 1;
        const pageSize = size ? parseInt(size, 10) : 10;
        const { rentals, total } = await rentalRepo.getAllRentalsPaginated(currentPage, pageSize, status);
        return {
            rentals,
            pagination: { page: currentPage, size: pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    }

    async confirmPickup(adminId: string, rentalId: string) {
        const rental = await rentalRepo.getRentalById(rentalId);
        if (!rental) throw new HttpError(404, "Rental not found");
        if (rental.status !== "confirmed") {
            throw new HttpError(400, "Rental must be paid/confirmed before pickup");
        }

        const updated = await rentalRepo.updateRental(rentalId, {
            status: "active",
            pickupConfirmedAt: new Date(),
        });
        logActivity("RENTAL_PICKUP_CONFIRMED", { adminId, rentalId });
        return updated;
    }

    async processReturn(adminId: string, rentalId: string, data: ProcessReturnDto) {
        const rental = await rentalRepo.getRentalById(rentalId);
        if (!rental) throw new HttpError(404, "Rental not found");
        if (!["active", "overdue"].includes(rental.status)) {
            throw new HttpError(400, `Cannot process return for status '${rental.status}'`);
        }
        if (data.deductionAmount > rental.depositAmount) {
            throw new HttpError(400, "Deduction cannot exceed deposit amount");
        }

        const updated = await rentalRepo.updateRental(rentalId, {
            status: "completed",
            returnedAt: new Date(),
            deductionAmount: data.deductionAmount,
            deductionReason: data.deductionReason ? sanitizeText(data.deductionReason) : undefined,
            depositRefunded: true,
        });

        logActivity("RENTAL_RETURN_PROCESSED", { adminId, rentalId, deductionAmount: data.deductionAmount });
        return updated;
    }

    // Automatically checks rentals and marks them overdue after end date.
    async flagOverdueRentals() {
        const overdue = await rentalRepo.getOverdueRentals();
        for (const rental of overdue) {
            await rentalRepo.updateRental(rental._id.toString(), { status: "overdue" });
            logSecurityEvent("RENTAL_OVERDUE", { rentalId: rental._id.toString(), userId: rental.user.toString() });
        }
        return overdue.length;
    }

    // Auto-cancel pending rentals left unpaid so equipment isn't blocked forever
    async cancelStalePendingRentals(olderThanMinutes = 30) {
        const stale = await rentalRepo.getStalePendingRentals(olderThanMinutes);
        for (const rental of stale) {
            await rentalRepo.updateRental(rental._id.toString(), {
                status: "cancelled",
                cancellationReason: "Auto-cancelled: payment not completed in time",
            });
            logActivity("RENTAL_AUTO_CANCELLED", { rentalId: rental._id.toString() });
        }
        return stale.length;
    }
}