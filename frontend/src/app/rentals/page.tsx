"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

function MyRentalsContent() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        api
            .get<PaginatedRentals>("/api/rentals", {
                params: { page, size: 10, status: statusFilter || undefined },
            })
            .then((res) => {
                if (!active) return;
                setRentals(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            })
            .catch((err) => {
                if (!active) return;
                setError(err?.response?.data?.message || "Failed to load rentals");
            })
            .finally(() => active && setIsLoading(false));
        return () => {
            active = false;
        };
    }, [page, statusFilter]);

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-semibold text-white">My Rentals</h1>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setPage(1);
                        setStatusFilter(e.target.value);
                    }}
                    className="bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052ff]"
                >
                    <option value="">All statuses</option>
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

                {isLoading ? (
                    <p className="text-[#8d90a2]">Loading...</p>
                ) : rentals.length === 0 ? (
                    <p className="text-[#8d90a2]">No rentals found.</p>
                ) : (
                    <div className="space-y-3">
                        {rentals.map((r) => (
                            <Link
                                key={r._id}
                                href={`/rentals/${r._id}`}
                                className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#0052ff] transition"
                            >
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0d0d0d] shrink-0">
                                    {r.equipment?.images?.[0] && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}${r.equipment.images[0]}`}
                                            alt={r.equipment.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#e5e2e1] font-medium truncate">{r.equipment?.title}</p>
                                    <p className="text-xs text-[#8d90a2]">
                                        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-[#b7c4ff] font-semibold mt-1">
                                        Rs. {r.rentalAmount + r.depositAmount}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                                    {r.status}
                                </span>
                            </Link>
                        ))}
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
        </div>
    );
}

export default function MyRentalsPage() {
    return (
        <ProtectedRoute>
            <MyRentalsContent />
        </ProtectedRoute>
    );
}