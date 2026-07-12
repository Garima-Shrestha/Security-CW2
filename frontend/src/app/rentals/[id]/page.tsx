"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Rental } from "@/types/rental.types";
import { ArrowLeft } from "lucide-react";

function RentalDetailContent() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [rental, setRental] = useState<Rental | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function load() {
        setIsLoading(true);
        api
            .get(`/api/rentals/${id}`)
            .then((res) => setRental(res.data.data))
            .catch((err) => setError(err?.response?.data?.message || "Rental not found"))
            .finally(() => setIsLoading(false));
    }

    useEffect(() => {
        load();
    }, [id]);

    async function onPay() {
        setError(null);
        setIsPaying(true);
        try {
            const res = await api.post(`/api/rentals/${id}/pay/initiate`);
            window.location.href = res.data.data.payment_url;
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to initiate payment");
            setIsPaying(false);
        }
    }

    async function onCancel() {
        setError(null);
        setIsCancelling(true);
        try {
            await api.delete(`/api/rentals/${id}`);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to cancel rental");
        } finally {
            setIsCancelling(false);
        }
    }

    if (isLoading) {
        return <div className="min-h-screen bg-[#131313] flex items-center justify-center text-[#a0a3b5]">Loading...</div>;
    }

    if (!rental) {
        return (
            <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-sm">{error || "Rental not found"}</p>
                <button onClick={() => router.push("/rentals")} className="text-[#b7c4ff] text-sm underline">
                    Back to rentals
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-lg mx-auto space-y-6">
                <button
                    onClick={() => router.push("/rentals")}
                    className="flex items-center gap-1 text-sm text-[#a0a3b5] hover:text-[#e5e2e1]"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                <h1 className="text-2xl font-semibold text-white">{rental.equipment?.title}</h1>

                {error && (
                    <div className="bg-[#c42727] text-[#fafafa] text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                    <div className="bg-[#001B44]/20 px-6 py-4 border-b border-[#1A1A1A]">
                        <h2 className="text-sm font-semibold tracking-widest text-[#c8d5fd]">ORDER SUMMARY</h2>
                    </div>
                    <div className="p-6 space-y-5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#a0a3b5]">Status</span>
                            <span className="text-[#e5e2e1] capitalize font-medium">{rental.status}</span>
                        </div>

                    <div className="flex justify-between">
                        <span className="text-[#a0a3b5]">Dates</span>
                        <span className="text-[#e5e2e1]">
                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#a0a3b5]">Rental amount</span>
                        <span className="text-[#e5e2e1]">Rs. {rental.rentalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#a0a3b5]">Deposit</span>
                        <span className="text-[#e5e2e1]">Rs. {rental.depositAmount}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-[#2a2a2a] pt-3">
                        <span className="text-[#c3c5d9]">Total</span>
                        <span className="text-[#b7c4ff]">Rs. {rental.rentalAmount + rental.depositAmount}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span className="text-[#a0a3b5]">Paid</span>
                        <span className={rental.isPaid ? "text-emerald-400" : "text-red-400"}>
                            {rental.isPaid ? "Yes" : "No"}
                        </span>
                    </div>
                    {rental.status === "completed" && (
                        <>
                            <div className="flex justify-between">
                                <span className="text-[#a0a3b5]">Deduction</span>
                                <span className="text-[#e5e2e1]">Rs. {rental.deductionAmount}</span>
                            </div>
                            {rental.deductionReason && (
                                <div className="flex justify-between">
                                    <span className="text-[#a0a3b5]">Reason</span>
                                    <span className="text-[#e5e2e1]">{rental.deductionReason}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-[#a0a3b5]">Deposit refund due</span>
                                <span className="text-emerald-400 font-medium">
                                    Rs. {rental.depositAmount - rental.deductionAmount}
                                </span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-[#2a2a2a] pt-3">
                                <span className="text-[#c3c5d9]">Net rental cost</span>
                                <span className="text-[#b7c4ff]">
                                    Rs. {rental.rentalAmount + rental.deductionAmount}
                                </span>
                            </div>
                        </>
                    )}
                    </div>
                </div>

                {rental.status === "pending" && !rental.isPaid && (
                    <div className="flex gap-3">
                        <button
                            onClick={onPay}
                            disabled={isPaying}
                            className="flex-1 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50"
                        >
                            {isPaying ? "Redirecting..." : "Pay Now"}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isCancelling}
                            className="px-4 rounded-lg border border-[#434656] text-[#e5e2e1] text-sm disabled:opacity-50"
                        >
                            {isCancelling ? "Cancelling..." : "Cancel"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RentalDetailPage() {
    return (
        <ProtectedRoute>
            <RentalDetailContent />
        </ProtectedRoute>
    );
}