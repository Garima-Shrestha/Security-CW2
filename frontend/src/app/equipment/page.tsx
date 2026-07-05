"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Equipment, PaginatedEquipment } from "@/types/equipment.types";
import { Search } from "lucide-react";

function EquipmentListContent() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        setError(null);

        api
            .get<PaginatedEquipment>("/api/equipment", {
                params: { page, size: 12, searchTerm: searchTerm || undefined },
            })
            .then((res) => {
                if (!active) return;
                setEquipment(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            })
            .catch((err) => {
                if (!active) return;
                setError(err?.response?.data?.message || "Failed to load equipment");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page, searchTerm]);

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-2xl font-semibold text-white">Browse Equipment</h1>

                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                    <input
                        value={searchTerm}
                        onChange={(e) => {
                            setPage(1);
                            setSearchTerm(e.target.value);
                        }}
                        placeholder="Search by title, brand, model..."
                        className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#8d90a2]"
                    />
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <p className="text-[#8d90a2]">Loading...</p>
                ) : equipment.length === 0 ? (
                    <p className="text-[#8d90a2]">No equipment found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {equipment.map((item) => (
                            <Link
                                key={item._id}
                                href={`/equipment/${item._id}`}
                                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#0052ff] transition"
                            >
                                <div className="aspect-video bg-[#0d0d0d]">
                                    {item.images?.[0] && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}${item.images[0]}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="p-4 space-y-1">
                                    <h3 className="text-[#e5e2e1] font-medium">{item.title}</h3>
                                    <p className="text-xs text-[#8d90a2]">
                                        {item.brand} · {item.model} · {item.condition}
                                    </p>
                                    <p className="text-sm text-[#0052ff] font-semibold">
                                        Rs. {item.dailyRate}/day
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-sm text-[#8d90a2]">
                            Page {page} of {totalPages}
                        </span>
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

export default function EquipmentListPage() {
    return (
        <ProtectedRoute>
            <EquipmentListContent />
        </ProtectedRoute>
    );
}