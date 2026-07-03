import { Request, Response } from "express";
import z from "zod";
import { RentalAdminService } from "../../services/admin/rental.service"
import { ProcessReturnDto } from "../../dtos/rental.dto";

let rentalService = new RentalAdminService();

export class AdminRentalController {
    async getAllRentals(req: Request, res: Response) {
        try {
            const { page, size, status } = req.query as any;
            const result = await rentalService.getAllRentals(page, size, status);
            return res.status(200).json({ success: true, data: result.rentals, pagination: result.pagination, message: "Rentals fetched" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async confirmPickup(req: Request, res: Response) {
        try {
            const adminId = req.user?._id?.toString() || "unknown";
            const rental = await rentalService.confirmPickup(adminId, req.params.id as string);
            return res.status(200).json({ success: true, data: rental, message: "Pickup confirmed" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async processReturn(req: Request, res: Response) {
        try {
            const adminId = req.user?._id?.toString() || "unknown";
            const parsed = ProcessReturnDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }
            const rental = await rentalService.processReturn(adminId, req.params.id as string, parsed.data);
            return res.status(200).json({ success: true, data: rental, message: "Return processed" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}