"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { User as UserIcon, Mail, Phone, ShieldCheck } from "lucide-react";

const profileSchema = z.object({
    username: z.string().min(2, "Username must be at least 2 characters").max(30),
    email: z.string().email("Enter a valid email"),
    phone: z.string().regex(/^\d{8,15}$/, "Phone must be 8-15 digits").optional().or(z.literal("")),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileSettingsContent() {
    const { user, setUserAndToken, token } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { username: user?.username || "", email: user?.email || "", phone: user?.phone || "" },
    });

    async function handleExport() {
        const res = await api.get("/api/users/export", { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "shutter-my-data.json");
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    async function onSubmit(values: ProfileFormValues) {
        setServerError(null);
        setSuccess(null);
        setIsSubmitting(true);
        try {
            const res = await api.put("/api/auth/profile", {
                username: values.username,
                email: values.email,
                phone: values.phone || undefined,
            });
            if (token) setUserAndToken(res.data.data, token);
            setSuccess("Profile updated successfully");
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-semibold text-white">Profile Settings</h1>
                    <p className="text-sm text-[#8d90a2]">Manage your account credentials and security</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0f1420] border border-[#1e2536] rounded-xl overflow-hidden">
                    <div className="flex items-start gap-3 p-4 border-b border-[#1e2536]">
                        <ShieldCheck 
                            size={20} 
                            className={user?.isTotpEnabled ? "text-emerald-500" : "text-red-600"} 
                        />
                        <div>
                            <p className={`text-sm font-semibold ${user?.isTotpEnabled ? "text-emerald-500" : "text-red-600"}`}>
                                MFA {user?.isTotpEnabled ? "enabled" : "disabled"}
                            </p>
                            <p className="text-xs text-[#8d90a2] mt-0.5">
                                Enable multi-factor authentication to secure your account.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4 p-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Display Name</label>
                        <div className="relative">
                            <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                            <input
                                id="username"
                                type="text"
                                {...register("username")}
                                className="w-full bg-[#131a2a] border border-[#252d42] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            />
                        </div>
                        {errors.username && <p className="text-red-600 text-xs mt-1.5">{errors.username.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                            <input
                                id="email"
                                type="email"
                                {...register("email")}
                                className="w-full bg-[#131a2a] border border-[#252d42] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            />
                        </div>
                        {errors.email && <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Phone Number</label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                            <input
                                id="phone"
                                type="tel"
                                {...register("phone")}
                                className="w-full bg-[#131a2a] border border-[#252d42] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            />
                        </div>
                        {errors.phone && <p className="text-red-600 text-xs mt-1.5">{errors.phone.message}</p>}
                    </div>

                    {success && <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">{success}</div>}
                    {serverError && <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{serverError}</div>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                        type="button"
                        onClick={handleExport}
                        className="w-full border border-[#252d42] text-[#c3c5d9] rounded-lg py-2.5 text-sm font-semibold transition hover:bg-[#131a2a]"
                    >
                        Export My Data
                    </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProfileSettingsPage() {
    return (
        <ProtectedRoute>
            <ProfileSettingsContent />
        </ProtectedRoute>
    );
}