"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Equipment } from "@/types/equipment.types";
import { Trash2, Pencil, Search, Plus } from "lucide-react";

function AdminEquipmentContent() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);

    useEffect(() => {
        if (!deleteTarget) return;
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setDeleteTarget(null);
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [deleteTarget]);

    async function loadEquipment() {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/api/equipment", {
                params: { page, size: 10, searchTerm: searchTerm || undefined },
            });
            setEquipment(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load equipment");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadEquipment();
    }, [page, searchTerm]);

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/equipment/${deleteTarget._id}`);
            setDeleteTarget(null);
            loadEquipment();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete equipment");
            setDeleteTarget(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-white">Equipment Management</h1>
                    <Link
                        href="/admin/equipment/new"
                        className="flex items-center gap-2 bg-[#2364f2] hover:bg-[#0066ff] text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition"
                    >
                        <Plus size={16} /> Add Equipment
                    </Link>
                </div>

                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                    <input
                        value={searchTerm}
                        onChange={(e) => {
                            setPage(1);
                            setSearchTerm(e.target.value);
                        }}
                        placeholder="Search equipment..."
                        className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                    />
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <p className="text-[#a0a3b5]">Loading...</p>
                ) : equipment.length === 0 ? (
                    <p className="text-[#a0a3b5]">No equipment found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-left text-[#a0a3b5]">
                                    <th className="px-4 py-3 font-medium">Image</th>
                                    <th className="px-4 py-3 font-medium">Title</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                    <th className="px-4 py-3 font-medium">Brand / Model</th>
                                    <th className="px-4 py-3 font-medium">Daily Rate</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map((item) => (
                                    <tr key={item._id} className="border-t border-[#2a2a2a]">
                                        <td className="px-4 py-3">
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#0d0d0d]">
                                                {item.images?.[0] && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_API_URL}${item.images[0]}`}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[#e5e2e1]">{item.title}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">{item.category?.name}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">{item.brand} · {item.model}</td>
                                        <td className="px-4 py-3 text-[#0052ff] font-semibold">Rs. {item.dailyRate}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                    item.isActive
                                                        ? "bg-emerald-900/30 text-emerald-400"
                                                        : "bg-red-900/30 text-red-400"
                                                }`}
                                            >
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-3">
                                                <Link href={`/admin/equipment/${item._id}/edit`} className="text-[#a0a3b5] hover:text-[#0052ff]">
                                                    <Pencil size={16} />
                                                </Link>
                                                <button onClick={() => setDeleteTarget(item)} className="text-[#a0a3b5] hover:text-red-400">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
                        <span className="text-sm text-[#a0a3b5]">Page {page} of {totalPages}</span>
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

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-white font-semibold">Delete equipment?</h3>
                        <p className="text-sm text-[#a0a3b5]">
                            Are you sure you want to delete <span className="text-[#e5e2e1]">{deleteTarget.title}</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-semibold"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteTarget(null)}
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

export default function AdminEquipmentPage() {
    return (
        <ProtectedRoute adminOnly>
            <AdminEquipmentContent />
        </ProtectedRoute>
    );
}