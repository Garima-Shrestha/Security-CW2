"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Equipment } from "@/types/equipment.types";
import { ArrowLeft } from "lucide-react";

function EquipmentDetailContent() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        setError(null);

        api
            .get(`/api/equipment/${id}`)
            .then((res) => {
                if (!active) return;
                setEquipment(res.data.data);
            })
            .catch((err) => {
                if (!active) return;
                setError(err?.response?.data?.message || "Equipment not found");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id]);

    if (isLoading) {
        return <div className="min-h-screen bg-[#131313] flex items-center justify-center text-[#8d90a2]">Loading...</div>;
    }

    if (error || !equipment) {
        return (
            <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-sm">{error || "Equipment not found"}</p>
                <button onClick={() => router.push("/equipment")} className="text-[#b7c4ff] text-sm underline">
                    Back to equipment
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131313] px-6 py-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <button
                    onClick={() => router.push("/equipment")}
                    className="flex items-center gap-1 text-sm text-[#8d90a2] hover:text-[#e5e2e1]"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                    <div className="aspect-video bg-[#0d0d0d] rounded-xl overflow-hidden">
                        {equipment.images?.[activeImage] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${equipment.images[activeImage]}`}
                                alt={equipment.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    {equipment.images.length > 1 && (
                        <div className="flex gap-2">
                            {equipment.images.map((img, idx) => (
                                <button
                                    key={img}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border ${
                                        idx === activeImage ? "border-[#0052ff]" : "border-[#2a2a2a]"
                                    }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
                                        alt={`${equipment.title} thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="pt-6">
                        <h1 className="text-3xl font-semibold text-white">{equipment.title}</h1>
                    </div>

                        <div className="grid grid-cols-4 gap-4 border-t border-b border-[#2a2a2a] py-4">
                            <div>
                                <p className="text-xs text-[#8d90a2] uppercase tracking-wide">Brand</p>
                                <p className="text-[#e5e2e1] font-medium mt-1">{equipment.brand}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#8d90a2] uppercase tracking-wide">Model</p>
                                <p className="text-[#e5e2e1] font-medium mt-1">{equipment.model}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#8d90a2] uppercase tracking-wide">Category</p>
                                <p className="text-[#e5e2e1] font-medium mt-1">{equipment.category?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#8d90a2] uppercase tracking-wide">Condition</p>
                                <p className="text-[#0052ff] font-medium mt-1 capitalize">{equipment.condition}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-medium text-[#8d90a2] uppercase tracking-wide">Description</h3>
                            <p className="text-[#c3c5d9] text-sm leading-relaxed">{equipment.description}</p>
                        </div>

                        {equipment.specs && Object.keys(equipment.specs).length > 0 && (
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-[#e5e2e1]">Specifications</h3>
                                {Object.entries(equipment.specs).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm text-[#8d90a2] border-b border-[#2a2a2a] py-1">
                                        <span>{key}</span>
                                        <span className="text-[#c3c5d9]">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-4 h-fit">
                        <div>
                            <p className="text-xs text-[#8d90a2] uppercase tracking-wide">Daily Rate</p>
                            <p className="text-2xl font-semibold text-[#b7c4ff] mt-1">
                                Rs. {equipment.dailyRate} <span className="text-sm text-[#8d90a2] font-normal">/ day</span>
                            </p>
                        </div>

                        <div className="border-t border-[#2a2a2a] pt-4 flex justify-between text-sm">
                            <span className="text-[#8d90a2]">Deposit</span>
                            <span className="text-[#e5e2e1] font-semibold">Rs. {equipment.depositAmount}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-[#8d90a2]">Availability</span>
                            <span className={`font-semibold ${!equipment.isBooked ? "text-emerald-400" : "text-red-400"}`}>
                                {equipment.isBooked ? "Currently Rented" : "In Stock"}
                            </span>
                        </div>

                        <button
                            onClick={() => router.push(`/rentals/new?equipmentId=${equipment._id}`)}
                            className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold transition"
                        >
                            Rent this equipment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EquipmentDetailPage() {
    return (
        <ProtectedRoute>
            <EquipmentDetailContent />
        </ProtectedRoute>
    );
}