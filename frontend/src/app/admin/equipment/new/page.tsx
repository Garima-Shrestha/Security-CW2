"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EquipmentCategory } from "@/types/equipment.types";

export default function NewEquipmentPage() {
    return (
        <ProtectedRoute adminOnly>
            <NewEquipmentContent />
        </ProtectedRoute>
    );
}

function NewEquipmentContent() {
    const router = useRouter();
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [condition, setCondition] = useState("good");
    const [dailyRate, setDailyRate] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [images, setImages] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get("/api/equipment-categories").then((res) => setCategories(res.data.data));
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!images || images.length === 0) {
            setError("At least one image is required");
            return;
        }
        if (!category) {
            setError("Please select a category");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("brand", brand);
        formData.append("model", model);
        formData.append("condition", condition);
        formData.append("dailyRate", dailyRate);
        formData.append("depositAmount", depositAmount);
        Array.from(images).forEach((file) => formData.append("images", file));

        setIsSubmitting(true);
        try {
            await api.post("/api/equipment", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            router.push("/equipment");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create equipment");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-semibold text-white">Add Equipment</h1>

                <form onSubmit={onSubmit} className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            minLength={2}
                            maxLength={100}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                            placeholder="e.g. Canon EOS R5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            maxLength={2000}
                            rows={4}
                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Category</label>
                        <select
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
                        {categories.length === 0 && (
                            <p className="text-xs text-[#8d90a2] mt-1">
                                No categories yet, create one at /admin/categories first.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Brand</label>
                            <input
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                required
                                maxLength={50}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                                placeholder="e.g. Canon"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Model</label>
                            <input
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                required
                                maxLength={50}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff]"
                                placeholder="e.g. EOS R5"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Condition</label>
                        <select
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
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Daily rate (Rs.)</label>
                            <input
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
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Deposit (Rs.)</label>
                            <input
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
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Images (max 6, jpg/png/webp)</label>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            multiple
                            onChange={(e) => setImages(e.target.files)}
                            required
                            className="w-full text-sm text-[#8d90a2] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#0052ff] file:text-white file:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating..." : "Create Equipment"}
                    </button>
                </form>
            </div>
        </div>
    );
}