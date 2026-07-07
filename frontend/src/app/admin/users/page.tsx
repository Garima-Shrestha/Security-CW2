"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminUserListItem, PaginatedUsers } from "@/types/auth.types";
import { Search } from "lucide-react";

function AdminUsersContent() {
    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        api
            .get<PaginatedUsers>("/api/admin/users", {
                params: { page, size: 10, searchTerm: searchTerm || undefined },
            })
            .then((res) => {
                if (!active) return;
                setUsers(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            })
            .catch((err) => {
                if (!active) return;
                setError(err?.response?.data?.message || "Failed to load users");
            })
            .finally(() => active && setIsLoading(false));
        return () => {
            active = false;
        };
    }, [page, searchTerm]);

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <h1 className="text-2xl font-semibold text-white">User Management</h1>

                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                    <input
                        value={searchTerm}
                        onChange={(e) => {
                            setPage(1);
                            setSearchTerm(e.target.value);
                        }}
                        placeholder="Search by username or email..."
                        className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                    />
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <p className="text-[#8d90a2]">Loading...</p>
                ) : users.length === 0 ? (
                    <p className="text-[#8d90a2]">No users found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-left text-[#8d90a2]">
                                    <th className="px-4 py-3 font-medium">Username</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Phone</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium">Provider</th>
                                    <th className="px-4 py-3 font-medium">MFA</th>
                                    <th className="px-4 py-3 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-t border-[#2a2a2a]">
                                        <td className="px-4 py-3 text-[#e5e2e1]">{u.username}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">{u.email}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">{u.phone || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                    u.role === "admin"
                                                        ? "bg-blue-900/30 text-blue-400"
                                                        : "bg-neutral-700/30 text-neutral-300"
                                                }`}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#c3c5d9] capitalize">{u.authProvider}</td>
                                        <td className="px-4 py-3">
                                            <span className={u.isTotpEnabled ? "text-emerald-400" : "text-red-400"}>
                                                {u.isTotpEnabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#8d90a2]">
                                            {new Date(u.createdAt).toLocaleDateString()}
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
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <ProtectedRoute adminOnly>
            <AdminUsersContent />
        </ProtectedRoute>
    );
}