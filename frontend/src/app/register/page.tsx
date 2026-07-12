"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Check, X, ShieldCheck, Lock, Mail, User as UserIcon } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, RegisterFormValues } from "@/lib/validation/auth.schema";
import cameraImg from "@/assets/camera.png";

const PASSWORD_RULES = [
    { label: "At least 12 characters", test: (v: string) => v.length >= 12 },
    { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
    { label: "One number", test: (v: string) => /[0-9]/.test(v) },
    { label: "One special character", test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

export default function RegisterPage() {
    const router = useRouter();
    const { user, isInitializing } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
    });

    const passwordValue = watch("password") || "";

    useEffect(() => {
        if (!isInitializing && user) {
            router.replace(user.role === "admin" ? "/admin/users" : "/equipment");
        }
    }, [user, isInitializing, router]);

    if (isInitializing || user) {
        return null;
    }

    async function onSubmit(values: RegisterFormValues) {
        setServerError(null);
        setIsSubmitting(true);
        try {
            await api.post("/api/auth/register", {
                username: values.username,
                email: values.email,
                phone: values.phone,
                password: values.password,
            });
            router.push("/login?registered=true");
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#131313]">
            {/* Left panel - branding */}
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden">
                <Image src={cameraImg} alt="Camera lens" fill priority className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/95 via-[#131313]/70 to-black/50" />

                <div className="relative z-10 p-12 flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-3xl text-[#b7c4ff]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                    <span className="text-3xl font-bold text-[#b7c4ff]">Shutter</span>
                </div>

                <div className="relative z-10 p-12 space-y-4 text-white">
                    <span className="inline-block bg-[#1e65ff] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        PROFESSIONAL GEAR
                    </span>
                    <h2 className="text-3xl font-semibold leading-tight max-w-sm">
                        Create your creative kit.
                    </h2>
                    <p className="text-neutral-300 text-sm max-w-sm">
                        Join the world's most elite cinematographers. Rent the tools you need to tell your story, from anywhere on earth.
                    </p>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex items-center justify-center px-6 py-12 bg-[#131313]">
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-3xl text-[#b7c4ff]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                        <span className="text-3xl font-bold text-[#b7c4ff]">Shutter</span>
                    </div>

                    <div>
                        <h1 className="text-3xl font-semibold text-white">Join Shutter</h1>
                        <p className="text-[#abbad5] mt-2">Start your next production with professional precision.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="off"
                                    {...register("username")}
                                    className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                    placeholder="Ram Thapa"
                                />
                            </div>
                            {errors.username && <p className="text-red-600 text-xs mt-1.5">{errors.username.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="off"
                                    {...register("email")}
                                    className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                    placeholder="example@gmail.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                autoComplete="off"
                                {...register("phone")}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                placeholder="98XXXXXXXX"
                            />
                            {errors.phone && (
                                <p className="text-red-600 text-xs mt-1.5">{errors.phone.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...register("password")}
                                    className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                    placeholder="••••••••••••"
                                />
                                <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3b5] hover:text-[#e5e2e1]"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {passwordValue.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {PASSWORD_RULES.map((rule) => {
                                        const passed = rule.test(passwordValue);
                                        return (
                                            <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                                                {passed ? (
                                                    <Check size={12} className="text-emerald-400 shrink-0" />
                                                ) : (
                                                    <X size={12} className="text-[#a0a3b5] shrink-0" />
                                                )}
                                                <span className={passed ? "text-[#c3c5d9]" : "text-[#a0a3b5]"}>
                                                    {rule.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#e5e2e1] mb-1.5">
                                Confirm password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...register("confirmPassword")}
                                    className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3b5] hover:text-[#e5e2e1]"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-600 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                id="acceptTerms"
                                type="checkbox"
                                {...register("acceptTerms")}
                                className="mt-1 accent-[#0052ff]"
                            />
                            <label htmlFor="acceptTerms" className="text-sm text-[#a0a3b5]">
                                I agree to the{" "}
                                <Link href="/terms" target="_blank" className="text-[#b7c4ff] underline underline-offset-2 hover:text-white">
                                    Terms & Conditions
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" target="_blank" className="text-[#b7c4ff] underline underline-offset-2 hover:text-white">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>
                        {errors.acceptTerms && (
                            <p className="text-red-600 text-xs">{errors.acceptTerms.message}</p>
                        )}

                        {serverError && (
                            <div className="bg-[#c42727] text-[#fafafa] text-sm rounded-lg px-4 py-3">
                                {serverError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-sm text-[#a0a3b5]">
                                Already have one?{" "}
                                <Link href="/login" className="text-[#b7c4ff] font-medium hover:text-white underline underline-offset-2">
                                    Log in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}