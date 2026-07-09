"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Rental, PaginatedRentals } from "@/types/rental.types";

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-900/30 text-amber-400",
    confirmed: "bg-blue-900/30 text-blue-400",
    active: "bg-emerald-900/30 text-emerald-400",
    returned: "bg-purple-900/30 text-purple-400",
    completed: "bg-neutral-700/30 text-neutral-300",
    cancelled: "bg-red-900/30 text-red-400",
    overdue: "bg-red-900/30 text-red-400",
};

function AdminRentalsContent() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // return modal state
    const [returnTarget, setReturnTarget] = useState<Rental | null>(null);

    useEffect(() => {
        if (!returnTarget) return;
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setReturnTarget(null);
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [returnTarget]);
    
    const [deductionAmount, setDeductionAmount] = useState("0");
    const [deductionReason, setDeductionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    function load() {
        setIsLoading(true);
        api
            .get<PaginatedRentals>("/api/admin/rentals", {
                params: { page, size: 10, status: statusFilter || undefined },
            })
            .then((res) => {
                setRentals(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            })
            .catch((err) => setError(err?.response?.data?.message || "Failed to load rentals"))
            .finally(() => setIsLoading(false));
    }

    useEffect(() => {
        load();
    }, [page, statusFilter]);

    async function onConfirmPickup(id: string) {
        setError(null);
        setSuccess(null);
        try {
            await api.put(`/api/admin/rentals/${id}/confirm-pickup`);
            setSuccess("Pickup confirmed");
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to confirm pickup");
        }
    }

    function openReturnModal(rental: Rental) {
        setReturnTarget(rental);
        setDeductionAmount("0");
        setDeductionReason("");
        setError(null);
    }

    async function onProcessReturn() {
        if (!returnTarget) return;
        const amount = Number(deductionAmount);
        if (amount > 0 && !deductionReason.trim()) {
            setError("Deduction reason is required when deduction amount > 0");
            return;
        }
        setIsProcessing(true);
        try {
            await api.put(`/api/admin/rentals/${returnTarget._id}/process-return`, {
                deductionAmount: amount,
                deductionReason: deductionReason || undefined,
            });
            setSuccess("Return processed");
            setReturnTarget(null);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to process return");
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-2xl font-semibold text-white">Rental Management</h1>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setPage(1);
                        setStatusFilter(e.target.value);
                    }}
                    className="bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052ff]"
                >
                    <option value="">All status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="returned">Returned</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="overdue">Overdue</option>
                </select>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
                        {success}
                    </div>
                )}

                {isLoading ? (
                    <p className="text-[#8d90a2]">Loading...</p>
                ) : rentals.length === 0 ? (
                    <p className="text-[#8d90a2]">No rentals found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-left text-[#8d90a2]">
                                    <th className="px-4 py-3 font-medium">Equipment</th>
                                    <th className="px-4 py-3 font-medium">Dates</th>
                                    <th className="px-4 py-3 font-medium">Total</th>
                                    <th className="px-4 py-3 font-medium">Paid</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentals.map((r) => (
                                    <tr key={r._id} className="border-t border-[#2a2a2a]">
                                        <td className="px-4 py-3 text-[#e5e2e1]">{r.equipment?.title}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">
                                            {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-[#0052ff] font-semibold">
                                            Rs. {r.rentalAmount + r.depositAmount}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={r.isPaid ? "text-emerald-400" : "text-red-400"}>
                                                {r.isPaid ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.status === "confirmed" && (
                                                <button
                                                    onClick={() => onConfirmPickup(r._id)}
                                                    className="text-xs bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg px-3 py-1.5"
                                                >
                                                    Confirm Pickup
                                                </button>
                                            )}
                                            {(r.status === "active" || r.status === "overdue") && (
                                                <button
                                                    onClick={() => openReturnModal(r)}
                                                    className="text-xs bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg px-3 py-1.5"
                                                >
                                                    Process Return
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-sm text-[#8d90a2]">Page {page} of {totalPages}</span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {returnTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-white font-semibold">Process Return</h3>
                        <p className="text-sm text-[#8d90a2]">
                            {returnTarget.equipment?.title} — deposit Rs. {returnTarget.depositAmount}
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Deduction Amount</label>
                            <input
                                type="number"
                                min="0"
                                max={returnTarget.depositAmount}
                                step="0.01"
                                value={deductionAmount}
                                onChange={(e) => setDeductionAmount(e.target.value)}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                                Reason {Number(deductionAmount) > 0 && "(required)"}
                            </label>
                            <textarea
                                value={deductionReason}
                                onChange={(e) => setDeductionReason(e.target.value)}
                                maxLength={500}
                                rows={3}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                                placeholder="e.g. Minor lens scratch"
                            />
                        </div>

                        {error && <p className="text-red-400 text-xs">{error}</p>}

                        <div className="flex gap-3">
                            <button
                                onClick={onProcessReturn}
                                disabled={isProcessing}
                                className="flex-1 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                            >
                                {isProcessing ? "Processing..." : "Confirm Return"}
                            </button>
                            <button
                                onClick={() => setReturnTarget(null)}
                                className="flex-1 border border-[#434656] text-[#e5e2e1] rounded-lg py-2 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminRentalsPage() {
    return (
        <ProtectedRoute adminOnly>
            <AdminRentalsContent />
        </ProtectedRoute>
    );
}