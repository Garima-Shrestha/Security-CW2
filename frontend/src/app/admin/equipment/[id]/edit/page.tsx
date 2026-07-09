"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EquipmentCategory, Equipment } from "@/types/equipment.types";

export default function EditEquipmentPage() {
    return (
        <ProtectedRoute adminOnly>
            <EditEquipmentContent />
        </ProtectedRoute>
    );
}

function EditEquipmentContent() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [condition, setCondition] = useState("good");
    const [dailyRate, setDailyRate] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [catRes, eqRes] = await Promise.all([
                    api.get("/api/equipment-categories"),
                    api.get(`/api/equipment/${id}`),
                ]);
                setCategories(catRes.data.data);

                const eq: Equipment = eqRes.data.data;
                setTitle(eq.title);
                setDescription(eq.description);
                setCategory(eq.category?._id || "");
                setBrand(eq.brand);
                setModel(eq.model);
                setCondition(eq.condition);
                setDailyRate(String(eq.dailyRate));
                setDepositAmount(String(eq.depositAmount));
                setIsActive(eq.isActive);
                setImages(eq.images || []);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to load equipment");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [id]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const totalCount = images.length + (newImages?.length || 0);
        if (totalCount === 0) {
            setError("At least one image is required");
            return;
        }
        if (totalCount > 6) {
            setError("Max 6 images allowed");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("brand", brand);
            formData.append("model", model);
            formData.append("condition", condition);
            formData.append("dailyRate", dailyRate);
            formData.append("depositAmount", depositAmount);
            formData.append("isActive", String(isActive));
            formData.append("existingImages", JSON.stringify(images));
            if (newImages) {
                Array.from(newImages).forEach((file) => formData.append("images", file));
            }

            await api.put(`/api/equipment/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            router.push("/admin/equipment");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update equipment");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="min-h-screen bg-[#131313] flex items-center justify-center text-[#a0a3b5]">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-semibold text-white">Edit Equipment</h1>

                <form onSubmit={onSubmit} className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <div>
                        <label htmlFor="edit-equipment-title" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Title</label>
                        <input
                            id="edit-equipment-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            minLength={2}
                            maxLength={100}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-equipment-description" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Description</label>
                        <textarea
                            id="edit-equipment-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            maxLength={2000}
                            rows={4}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-equipment-category" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Category</label>
                        <select
                            id="edit-equipment-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                        >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-equipment-brand" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Brand</label>
                            <input
                                id="edit-equipment-brand"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                required
                                maxLength={50}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-equipment-model" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Model</label>
                            <input
                                id="edit-equipment-model"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                required
                                maxLength={50}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-equipment-condition" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Condition</label>
                        <select
                            id="edit-equipment-condition"
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                        >
                            <option value="new">New</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-equipment-daily-rate" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Daily rate (Rs.)</label>
                            <input
                                id="edit-equipment-daily-rate"
                                type="number"
                                min="1"
                                step="0.01"
                                value={dailyRate}
                                onChange={(e) => setDailyRate(e.target.value)}
                                required
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-equipment-deposit" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Deposit (Rs.)</label>
                            <input
                                id="edit-equipment-deposit"
                                type="number"
                                min="0"
                                step="0.01"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                required
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                            />
                        </div>
                    </div>

                    <div>
                        <label id="edit-current-images-label" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Current Images</label>
                        {images.length === 0 ? (
                            <p className="text-xs text-[#a0a3b5]">No images</p>
                        ) : (
                            <div className="flex gap-2 flex-wrap">
                                {images.map((img) => (
                                    <div key={img} className="relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
                                            alt={`${title || "Equipment"} photo`}
                                            className="w-20 h-20 rounded-lg object-cover border border-[#434656]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImages((prev) => prev.filter((i) => i !== img))}
                                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                            Add New Images (max {6 - images.length} more)
                        </label>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            multiple
                            onChange={(e) => setNewImages(e.target.files)}
                            disabled={images.length >= 6}
                            className="w-full text-sm text-[#a0a3b5] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#0052ff] file:text-white file:text-sm disabled:opacity-50"
                        />
                    </div>

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

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/admin/equipment")}
                            className="px-4 rounded-lg border border-[#434656] text-[#e5e2e1] text-sm"
                        >
                            Cancel
                        </button>
                    </div>

                    {error && (
                        <div className="bg-[#c02424] border border-[#c02424] text-white-900 text-sm rounded-lg px-4 py-2 mt-4">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}