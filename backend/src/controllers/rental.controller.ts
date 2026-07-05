import { Request, Response } from "express";
import z from "zod";
import { RentalService } from "../services/rental.service";
import { KhaltiRentalService } from "../services/khalti-rental.service";
import { CreateRentalRequestDto } from "../dtos/rental.dto";
import { CancelRentalDto } from "../dtos/rental.dto";

let rentalService = new RentalService();
let khaltiRentalService = new KhaltiRentalService();

export class RentalController {
    async createRental(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = CreateRentalRequestDto.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const rental = await rentalService.createRentalRequest(userId.toString(), parsed.data);
            return res.status(201).json({ success: true, data: rental, message: "Rental request created" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async initiatePayment(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const data = await khaltiRentalService.initiatePayment(userId.toString(), req.params.rentalId as string);
            return res.status(200).json({ success: true, data, message: "Payment initiated" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async verifyPayment(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const { pidx } = req.body;
            if (!pidx) return res.status(400).json({ success: false, message: "pidx is required" });

            const data = await khaltiRentalService.verifyPayment(userId.toString(), pidx);
            return res.status(200).json({ success: true, data, message: "Payment verified" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getMyRentals(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const { page, size, status } = req.query as any;
            const result = await rentalService.getUserRentals(userId.toString(), page, size, status);
            return res.status(200).json({ success: true, data: result.rentals, pagination: result.pagination, message: "Rentals fetched" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async getMyRentalById(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const rental = await rentalService.getOwnedRental(userId.toString(), req.params.id as string);
            return res.status(200).json({ success: true, data: rental, message: "Rental fetched" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async cancelRental(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = CancelRentalDto.safeParse(req.body || {});
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });
            }

            const rental = await rentalService.cancelRental(userId.toString(), req.params.id as string, parsed.data.reason);
            return res.status(200).json({ success: true, data: rental, message: "Rental cancelled" });
        } catch (error: any) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}