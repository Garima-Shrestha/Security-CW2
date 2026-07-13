import { HttpError } from "../errors/http-error";
import { KHALTI_BASE_URL, KHALTI_SECRET_KEY, KHALTI_RETURN_URL, KHALTI_WEBSITE_URL } from "../config/khalti";
import { KhaltiRepository } from "../repositories/khalti.repository";
import { RentalRepository } from "../repositories/rental.repository";
import { logActivity, logSecurityEvent } from "../config/logger";
import { safeFetch } from "../utils/safe-fetch";

let khaltiRepo = new KhaltiRepository();
let rentalRepo = new RentalRepository();

export class KhaltiRentalService {
    async initiatePayment(userId: string, rentalId: string) {
        const rental = await rentalRepo.getRentalById(rentalId);
        if (!rental) throw new HttpError(404, "Rental not found");

        if (rental.user._id.toString() !== userId.toString()) {
            logSecurityEvent("IDOR_ATTEMPT_PAYMENT", { userId, rentalId });
            throw new HttpError(404, "Rental not found");
        }

        if (rental.status !== "pending") {
            throw new HttpError(400, `Cannot pay for rental in status '${rental.status}'`);
        }

        if (!KHALTI_SECRET_KEY) throw new HttpError(500, "Khalti secret key missing");

        // Amount charged = rental amount + deposit, converted to paisa for Khalti
        const totalAmountNpr = rental.rentalAmount + rental.depositAmount;
        const amountPaisa = Math.round(totalAmountNpr * 100);

        const response = await safeFetch(`${KHALTI_BASE_URL}/epayment/initiate/`, {
            method: "POST",
            headers: {
                Authorization: `Key ${KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                return_url: KHALTI_RETURN_URL,
                website_url: KHALTI_WEBSITE_URL,
                amount: amountPaisa,
                purchase_order_id: rental._id.toString(),
                purchase_order_name: `Rental #${rental._id.toString()}`,
            }),
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new HttpError(response.status, payload?.message || "Failed to initiate Khalti payment");
        }

        await khaltiRepo.createPayment({
            user: userId as any,
            equipment: rental.equipment._id as any,
            pidx: payload.pidx,
            amount: amountPaisa,
            purchaseOrderId: rental._id.toString(),
            purchaseOrderName: `Rental #${rental._id.toString()}`,
            status: "Initiated",
            initiateResponse: payload,
            isProcessed: false,
        });

        await rentalRepo.updateRental(rentalId, { khaltiPidx: payload.pidx });

        return { pidx: payload.pidx, payment_url: payload.payment_url, expires_at: payload.expires_at };
    }

    async verifyPayment(userId: string, pidx: string) {
        const payment = await khaltiRepo.getPaymentByPidx(pidx);
        if (!payment) throw new HttpError(404, "Payment record not found");

        if (payment.user.toString() !== userId.toString()) {
            logSecurityEvent("IDOR_ATTEMPT_PAYMENT_VERIFY", { userId, pidx });
            throw new HttpError(403, "Forbidden");
        }

        if (!KHALTI_SECRET_KEY) throw new HttpError(500, "Khalti secret key missing");

        const response = await safeFetch(`${KHALTI_BASE_URL}/epayment/lookup/`, {
            method: "POST",
            headers: {
                Authorization: `Key ${KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pidx }),
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new HttpError(response.status, payload?.message || "Failed to verify Khalti payment");
        }

        await khaltiRepo.updatePaymentByPidx(pidx, {
            status: payload.status,
            transactionId: payload.transaction_id,
            lookupResponse: payload,
        });

        if (payload.status !== "Completed") {
            return { status: payload.status };
        }

        const latest = await khaltiRepo.getPaymentByPidx(pidx);
        if (latest?.isProcessed) {
            return { status: "Completed", rentalId: payment.purchaseOrderId };
        }

        // This is the ONLY place isPaid/status flip to confirmed: never from a client request body
        const rental = await rentalRepo.updateRental(payment.purchaseOrderId, {
            status: "confirmed",
            isPaid: true,
        });

        await khaltiRepo.updatePaymentByPidx(pidx, {
            isProcessed: true,
            processedAt: new Date(),
        });

        logActivity("RENTAL_PAYMENT_CONFIRMED", { userId, rentalId: payment.purchaseOrderId });

        return { status: "Completed", rentalId: rental?._id };
    }

    // Tries to refund the deposit through Khalti when a rental is returned. Doesn't throw if Khalti's refund fails, just returns whether it worked,
    // so the return can still be completed and the admin can see it needs a manual refund instead of getting stuck.
    async refundDeposit(adminId: string, rentalId: string, refundAmountNpr: number): Promise<{ automated: boolean }> {
        const payment = await khaltiRepo.getPaymentByPurchaseOrderId(rentalId);
        if (!payment || !payment.transactionId) {
            logSecurityEvent("KHALTI_REFUND_SKIPPED", { adminId, rentalId, reason: "no completed payment or transaction id found" });
            return { automated: false };
        }

        const refundAmountPaisa = Math.round(refundAmountNpr * 100);
        if (refundAmountPaisa <= 0 || refundAmountPaisa > payment.amount || !KHALTI_SECRET_KEY) {
            logSecurityEvent("KHALTI_REFUND_SKIPPED", { adminId, rentalId, reason: "invalid amount or missing secret key" });
            return { automated: false };
        }

        const response = await safeFetch(`${KHALTI_BASE_URL}/epayment/refund/`, {
            method: "POST",
            headers: {
                Authorization: `Key ${KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mobile: "",
                amount: refundAmountPaisa,
                transaction_id: payment.transactionId,
                pidx: payment.pidx,
            }),
        });

        // khalti sandbox sometimes sends back an html error page instead of json for this endpoint, so reading as text first to avoid crashing
        const rawBody = await response.text();
        let payload: any = null;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            payload = null;
        }

        if (!response.ok || !payload) {
            logSecurityEvent("KHALTI_REFUND_FAILED", {
                adminId,
                rentalId,
                reason: payload?.message || "Khalti did not return a valid refund response (sandbox limitation)",
            });

            await khaltiRepo.updatePaymentByPidx(payment.pidx, {
                lookupResponse: {
                    ...payment.lookupResponse,
                    refund: { manualRefundRequired: true, requestedAmountNpr: refundAmountNpr, requestedAt: new Date() },
                },
            });

            return { automated: false };
        }

        await khaltiRepo.updatePaymentByPidx(payment.pidx, {
            lookupResponse: { ...payment.lookupResponse, refund: payload },
        });

        logActivity("RENTAL_DEPOSIT_REFUNDED", { adminId, rentalId, refundAmountNpr });

        return { automated: true };
    }
}