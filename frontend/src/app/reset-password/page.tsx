"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { Lock, Check, X, Eye, EyeOff } from "lucide-react";

const resetPasswordSchema = z.object({
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
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const PASSWORD_RULES = [
    { label: "At least 12 characters", test: (v: string) => v.length >= 12 },
    { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
    { label: "One number", test: (v: string) => /[0-9]/.test(v) },
    { label: "One special character", test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const newPasswordValue = watch("newPassword") || "";

    async function onSubmit(values: ResetPasswordValues) {
        if (!token) {
            setServerError("Missing or invalid reset token");
            return;
        }
        setServerError(null);
        setIsSubmitting(true);
        try {
            await api.post("/api/auth/reset-password", { token, newPassword: values.newPassword });
            router.push("/login?registered=true");
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Failed to reset password");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-sm">Invalid or missing reset link</p>
                <Link href="/forgot-password" className="text-[#b7c4ff] text-sm underline">Request a new link</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-sm space-y-6">
                <h1 className="text-2xl font-semibold text-white">Set a new password</h1>

                {serverError && (
                    <div className="bg-[#c42727] text-[#fafafa] text-sm rounded-lg px-4 py-3">{serverError}</div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                        <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Confirm Password</label>
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
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    );
}