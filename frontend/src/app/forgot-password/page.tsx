"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { Mail, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
    email: z.string().email("Enter a valid email"),
});
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    async function onSubmit(values: ForgotPasswordValues) {
        setServerError(null);
        setIsSubmitting(true);
        try {
            await api.post("/api/auth/request-password-reset", { email: values.email });
            setSubmitted(true);
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Failed to send reset link");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-sm space-y-6">
                <Link href="/login" className="flex items-center gap-1 text-sm text-[#8d90a2] hover:text-[#e5e2e1]">
                    <ArrowLeft size={14} /> Back to login
                </Link>

                <div>
                    <h1 className="text-2xl font-semibold text-white">Reset your password</h1>
                    <p className="text-[#8d90a2] mt-2 text-sm">Enter your email and we'll send you a reset link.</p>
                </div>

                {submitted ? (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
                        If that email is registered, a reset link has been sent.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {serverError && (
                            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{serverError}</div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-[#e5e2e1] mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a2]" />
                                <input
                                    type="email"
                                    autoComplete="off"
                                    {...register("email")}
                                    className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition"
                                    placeholder="example@gmail.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}