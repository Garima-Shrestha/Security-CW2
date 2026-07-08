"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminUserListItem, PaginatedUsers } from "@/types/auth.types";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";

function AdminUsersContent() {
    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);

    const [form, setForm] = useState({ username: "", email: "", phone: "", password: "", role: "user" as "admin" | "user" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    function load() {
        setIsLoading(true);
        api
            .get<PaginatedUsers>("/api/admin/users", { params: { page, size: 10, searchTerm: searchTerm || undefined } })
            .then((res) => {
                setUsers(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            })
            .catch((err) => setError(err?.response?.data?.message || "Failed to load users"))
            .finally(() => setIsLoading(false));
    }

    useEffect(() => {
        load();
    }, [page, searchTerm]);

    function openAdd() {
        setForm({ username: "", email: "", phone: "", password: "", role: "user" });
        setShowAddModal(true);
        setError(null);
    }

    function openEdit(u: AdminUserListItem) {
        setForm({ username: u.username, email: u.email, phone: u.phone || "", password: "", role: u.role });
        setEditTarget(u);
        setError(null);
    }

    async function onCreate() {
        setError(null);
        setIsSubmitting(true);
        try {
            await api.post("/api/admin/users", {
                username: form.username,
                email: form.email,
                phone: form.phone || undefined,
                password: form.password,
            });
            setSuccess("User created");
            setShowAddModal(false);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create user");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onUpdate() {
        if (!editTarget) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await api.put(`/api/admin/users/${editTarget._id}`, {
                username: form.username,
                email: form.email,
                phone: form.phone || undefined,
            });
            setSuccess("User updated");
            setEditTarget(null);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update user");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/admin/users/${deleteTarget._id}`);
            setSuccess("User deleted");
            setDeleteTarget(null);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete user");
            setDeleteTarget(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-white">User Management</h1>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition"
                    >
                        <Plus size={16} /> Add User
                    </button>
                </div>

                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                    <input
                        value={searchTerm}
                        onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                        placeholder="Search by username or email..."
                        className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                    />
                </div>

                {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
                {success && <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">{success}</div>}

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
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-t border-[#2a2a2a]">
                                        <td className="px-4 py-3 text-[#e5e2e1]">{u.username}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">{u.email}</td>
                                        <td className="px-4 py-3 text-[#c3c5d9]">{u.phone || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${u.role === "admin" ? "bg-blue-900/30 text-blue-400" : "bg-neutral-700/30 text-neutral-300"}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#c3c5d9] capitalize">{u.authProvider}</td>
                                        <td className="px-4 py-3">
                                            <span className={u.isTotpEnabled ? "text-emerald-400" : "text-red-400"}>
                                                {u.isTotpEnabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#8d90a2]">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            {u.role !== "admin" && (
                                                <div className="flex gap-3">
                                                    <button onClick={() => openEdit(u)} className="text-[#8d90a2] hover:text-[#0052ff]">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(u)} className="text-[#8d90a2] hover:text-red-400">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40">Prev</button>
                        <span className="text-sm text-[#8d90a2]">Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40">Next</button>
                    </div>
                )}
            </div>

            {(showAddModal || editTarget) && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-white font-semibold">{editTarget ? "Edit User" : "Add User"}</h3>

                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Username</label>
                            <input
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Email</label>
                            <input
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Phone</label>
                            <input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>

                        {showAddModal && (
                            <div>
                                <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052ff]"
                                />
                            </div>
                        )}

                        {error && <p className="text-red-400 text-xs">{error}</p>}

                        <div className="flex gap-3">
                            <button
                                onClick={editTarget ? onUpdate : onCreate}
                                disabled={isSubmitting}
                                className="flex-1 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : editTarget ? "Save Changes" : "Create User"}
                            </button>
                            <button
                                onClick={() => { setShowAddModal(false); setEditTarget(null); }}
                                className="flex-1 border border-[#434656] text-[#e5e2e1] rounded-lg py-2 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-white font-semibold">Delete user?</h3>
                        <p className="text-sm text-[#8d90a2]">
                            Are you sure you want to delete <span className="text-[#e5e2e1]">{deleteTarget.username}</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-semibold">Delete</button>
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-[#434656] text-[#e5e2e1] rounded-lg py-2 text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
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