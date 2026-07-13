"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Lock, Check, X, Eye, EyeOff } from "lucide-react";
import { getPasswordStrength } from "@/lib/passwordStrength";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(12, "Password must be at least 12 characters")
        .max(64)
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const PASSWORD_RULES = [
    { label: "At least 12 characters", test: (v: string) => v.length >= 12 },
    { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
    { label: "One number", test: (v: string) => /[0-9]/.test(v) },
    { label: "One special character", test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

function AccountSettingsContent() {
    const router = useRouter();
    const { logout } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

    const newPasswordValue = watch("newPassword") || "";
    const strength = getPasswordStrength(newPasswordValue);

    async function onSubmit(values: ChangePasswordValues) {
        setServerError(null);
        setSuccess(null);
        setIsSubmitting(true);
        try {
            await api.put("/api/auth/change-password", {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            setSuccess("Password changed successfully. Redirecting to login...");
            reset();
            setTimeout(() => {
                logout();
                router.push("/login");
            }, 1500);
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Failed to change password");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md space-y-6">
                <h1 className="text-2xl font-semibold text-white">Account Details</h1>

                {success && <div className="bg-[#29c063] text-[#fafafa] text-sm rounded-lg px-4 py-3">{success}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Current Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                            <input
                                type={showOld ? "text" : "password"}
                                autoComplete="current-password"
                                {...register("oldPassword")}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            />
                            <button type="button" onClick={() => setShowOld((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3b5] hover:text-[#e5e2e1]" tabIndex={-1}>
                                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.oldPassword && <p className="text-red-600 text-xs mt-1.5">{errors.oldPassword.message}</p>}
                        {serverError && <p className="text-red-600 text-xs mt-1.5">{serverError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">New Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                            <input
                                type={showNew ? "text" : "password"}
                                autoComplete="new-password"
                                {...register("newPassword")}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            />
                            <button type="button" onClick={() => setShowNew((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3b5] hover:text-[#e5e2e1]" tabIndex={-1}>
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {newPasswordValue.length > 0 && (
                            <div className="mt-2">
                                <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all"
                                        style={{ width: `${(strength.score + 1) * 20}%`, backgroundColor: strength.color }}
                                    />
                                </div>
                                <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                            </div>
                        )}

                        {newPasswordValue.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {PASSWORD_RULES.map((rule) => {
                                    const passed = rule.test(newPasswordValue);
                                    return (
                                        <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                                            {passed ? <Check size={12} className="text-emerald-400 shrink-0" /> : <X size={12} className="text-[#a0a3b5] shrink-0" />}
                                            <span className={passed ? "text-[#c3c5d9]" : "text-[#a0a3b5]"}>{rule.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Confirm New Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                            <input
                                type={showConfirm ? "text" : "password"}
                                autoComplete="new-password"
                                {...register("confirmPassword")}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                            />
                            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3b5] hover:text-[#e5e2e1]" tabIndex={-1}>
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-red-600 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Updating..." : "Change Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AccountSettingsPage() {
    return (
        <ProtectedRoute>
            <AccountSettingsContent />
        </ProtectedRoute>
    );
}