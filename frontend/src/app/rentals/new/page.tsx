"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Equipment } from "@/types/equipment.types";
import { ArrowLeft } from "lucide-react";

function NewRentalContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const equipmentId = searchParams.get("equipmentId");

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!equipmentId) {
            setError("No equipment selected");
            setIsLoading(false);
            return;
        }
        api
            .get(`/api/equipment/${equipmentId}`)
            .then((res) => setEquipment(res.data.data))
            .catch((err) => setError(err?.response?.data?.message || "Equipment not found"))
            .finally(() => setIsLoading(false));
    }, [equipmentId]);

    const totalDays =
        startDate && endDate
            ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
    const rentalAmount = equipment && totalDays > 0 ? equipment.dailyRate * totalDays : 0;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!equipmentId) return;
        if (!startDate || !endDate) {
            setError("Please select both start and end dates");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post("/api/rentals", { equipmentId, startDate, endDate });
            router.push(`/rentals/${res.data.data._id}`);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create rental request");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="min-h-screen bg-[#131313] flex items-center justify-center text-[#8d90a2]">Loading...</div>;
    }

    if (error && !equipment) {
        return (
            <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={() => router.push("/equipment")} className="text-[#b7c4ff] text-sm underline">
                    Back to equipment
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-lg mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-sm text-[#8d90a2] hover:text-[#e5e2e1]"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                <h1 className="text-2xl font-semibold text-white">Rent:  {equipment?.title}</h1>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.85] [&::-webkit-calendar-picker-indicator]:brightness-125"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">End Date</label>
                                <input
                                type="date"
                                value={endDate}
                                min={startDate || new Date().toISOString().split("T")[0]}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.85] [&::-webkit-calendar-picker-indicator]:brightness-125"
                            />
                        </div>
                    </div>

                    {totalDays > 0 && equipment && (
                        <div className="border-t border-[#2a2a2a] pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-[#8d90a2]">
                                <span>Duration</span>
                                <span className="text-[#e5e2e1]">{totalDays} day(s)</span>
                            </div>
                            <div className="flex justify-between text-[#8d90a2]">
                                <span>Rental amount</span>
                                <span className="text-[#e5e2e1]">Rs. {rentalAmount}</span>
                            </div>
                            <div className="flex justify-between text-[#8d90a2]">
                                <span>Deposit (refundable)</span>
                                <span className="text-[#e5e2e1]">Rs. {equipment.depositAmount}</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t border-[#2a2a2a]">
                                <span className="text-[#c3c5d9]">Total due</span>
                                <span className="text-[#b7c4ff]">Rs. {rentalAmount + equipment.depositAmount}</span>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || totalDays <= 0}
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting..." : "Request Rental"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function NewRentalPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={null}>
                <NewRentalContent />
            </Suspense>
        </ProtectedRoute>
    );
}