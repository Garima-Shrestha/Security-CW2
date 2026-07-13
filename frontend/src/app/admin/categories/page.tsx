"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EquipmentCategory, Equipment } from "@/types/equipment.types";
import { Trash2, Pencil, Search } from "lucide-react";

function AdminCategoriesContent() {
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EquipmentCategory | null>(null);

    useEffect(() => {
        if (!deleteTarget) return;
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setDeleteTarget(null);
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [deleteTarget]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function loadCategories() {
        const res = await api.get("/api/equipment-categories");
        setCategories(res.data.data);

        // Count equipment per category (client-side, since backend has no dedicated count endpoint)
        const eqRes = await api.get("/api/equipment", { params: { size: 1000 } });
        const counts: Record<string, number> = {};
        (eqRes.data.data as Equipment[]).forEach((eq) => {
            const catId = eq.category?._id;
            if (catId) counts[catId] = (counts[catId] || 0) + 1;
        });
        setItemCounts(counts);
    }

    useEffect(() => {
        loadCategories();
    }, []);

    const filtered = useMemo(
        () => categories.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [categories, searchTerm]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = useMemo(
        () => filtered.slice((page - 1) * pageSize, page * pageSize),
        [filtered, page]
    );

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    function startEdit(cat: EquipmentCategory) {
        setEditingId(cat._id);
        setName(cat.name);
        setDescription(cat.description || "");
        setIsActive(cat.isActive);
        setSuccess(null);
        setError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setName("");
        setDescription("");
        setIsActive(true);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/api/equipment-categories/${editingId}`, {
                    name,
                    description: description || undefined,
                    isActive,
                });
                setSuccess("Category updated");
            } else {
                await api.post("/api/equipment-categories", { name, description: description || undefined });
                setSuccess("Category created");
            }
            cancelEdit();
            loadCategories();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to save category");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/equipment-categories/${deleteTarget._id}`);
            setDeleteTarget(null);
            loadCategories();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete category");
            setDeleteTarget(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-2xl font-semibold text-white">Equipment Categories</h1>

                <form onSubmit={onSubmit} className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <h2 className="text-sm font-medium text-[#e5e2e1]">
                        {editingId ? "Edit Category" : "New Category"}
                    </h2>

                    {error && (
                        <div className="bg-[#c42727] text-[#fafafa] text-sm rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-[#29c063] text-[#fafafa] text-sm rounded-lg px-4 py-3">
                            {success}
                        </div>
                    )}

                    <div>
                        <label htmlFor="category-name" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Name</label>
                        <input
                            id="category-name"
                            value={name}
                            autoComplete="off"
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={1}
                            maxLength={50}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            placeholder="e.g. Cameras"
                        />
                    </div>

                    <div>
                        <label htmlFor="category-description" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Description (optional)</label>
                        <textarea
                            id="category-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={300}
                            rows={3}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            placeholder="Short description"
                        />
                    </div>

                    {editingId && (
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-[#e5e2e1]">Status</label>
                            <button
                                type="button"
                                onClick={() => setIsActive((s) => !s)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                    isActive
                                        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30"
                                        : "bg-red-900/30 text-red-400 border border-red-500/30"
                                }`}
                            >
                                {isActive ? "Active" : "Inactive"}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : editingId ? "Update Category" : "Create Category"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 rounded-lg border border-[#434656] text-[#e5e2e1] text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="space-y-3">
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <p className="text-sm text-[#a0a3b5]">No categories found.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#1a1a1a] text-left text-[#a0a3b5]">
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Description</th>
                                        <th className="px-4 py-3 font-medium">Items</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Created</th>
                                        <th className="px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((c) => (
                                        <tr key={c._id} className="border-t border-[#2a2a2a]">
                                            <td className="px-4 py-3 text-[#e5e2e1]">{c.name}</td>
                                            <td className="px-4 py-3 text-[#c3c5d9] max-w-xs truncate">{c.description || "—"}</td>
                                            <td className="px-4 py-3 text-[#c3c5d9]">{itemCounts[c._id] || 0}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        c.isActive
                                                            ? "bg-emerald-900/30 text-emerald-400"
                                                            : "bg-red-900/30 text-red-400"
                                                    }`}
                                                >
                                                    {c.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#a0a3b5]">
                                                {new Date(c.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-3">
                                                    <button onClick={() => startEdit(c)} className="text-[#a0a3b5] hover:text-[#0052ff]">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(c)} className="text-[#a0a3b5] hover:text-red-400">
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

                    {filtered.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-[#a0a3b5]">
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} categories
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-2 py-1.5 rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40"
                            >
                                ‹
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    className={`px-3 py-1.5 rounded-lg text-sm ${
                                        n === page ? "bg-[#0052ff] text-white" : "border border-[#434656] text-[#e5e2e1]"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-2 py-1.5 rounded-lg border border-[#434656] text-[#e5e2e1] disabled:opacity-40"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-white font-semibold">Delete category?</h3>
                        <p className="text-sm text-[#a0a3b5]">
                            Are you sure you want to delete <span className="text-[#e5e2e1]">{deleteTarget.name}</span>? This cannot be undone.
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

export default function AdminCategoriesPage() {
    return (
        <ProtectedRoute adminOnly>
            <AdminCategoriesContent />
        </ProtectedRoute>
    );
}