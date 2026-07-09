"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, LoginFormValues, totpSchema, TotpFormValues } from "@/lib/validation/auth.schema";
import cameraImg from "@/assets/camera.png";

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get("registered") === "true";

    const { user, isInitializing, loginStepOne, loginStepTwo } = useAuth();

    const [step, setStep] = useState<"credentials" | "mfa">("credentials");
    const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [captchaRequired, setCaptchaRequired] = useState(false);
    const captchaTokenRef = useRef<string | null>(null);
    const captchaContainerRef = useRef<HTMLDivElement>(null);
    const captchaWidgetId = useRef<string | null>(null);

    const credentialsForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const totpForm = useForm<TotpFormValues>({
        resolver: zodResolver(totpSchema),
    });

    useEffect(() => {
        if (!isInitializing && user) {
            router.replace(user.role === "admin" ? "/admin/users" : "/equipment");
        }
    }, [user, isInitializing, router]);

    useEffect(() => {
        if (!captchaRequired) return;

        function tryRender() {
            const hcaptcha = (window as any).hcaptcha;
            if (!hcaptcha || !captchaContainerRef.current) {
                setTimeout(tryRender, 200);
                return;
            }
            if (captchaWidgetId.current !== null) return; // already rendered

            captchaWidgetId.current = hcaptcha.render(captchaContainerRef.current, {
                sitekey: "e7f0b744-d8b0-4732-b0a8-f2086638fc7e",
                callback: (token: string) => {
                    (window as any).__hcaptchaToken = token;
                },
            });
        }

        tryRender();
    }, [captchaRequired]);

    if (isInitializing || user) {
        return null;
    }

    async function onSubmitCredentials(values: LoginFormValues) {
        setServerError(null);
        setIsSubmitting(true);
        try {
            const result = await loginStepOne(values.email, values.password, (window as any).__hcaptchaToken || undefined);
            if (result.requiresTotp && result.preAuthToken) {
                setPreAuthToken(result.preAuthToken);
                setStep("mfa");
            } else {
                router.push(result.user?.role === "admin" ? "/admin/users" : "/equipment");
            }
        } catch (err: any) {
            const message = err?.response?.data?.message;
            setServerError(typeof message === "string" ? message : "Login failed. Please try again.");
            if (err?.response?.data?.captchaRequired) setCaptchaRequired(true);
            captchaTokenRef.current = null;
            (window as any).__hcaptchaToken = undefined;
            try {
                if (captchaWidgetId.current !== null) {
                    (window as any).hcaptcha?.reset(captchaWidgetId.current);
                }
            } catch {
                // hcaptcha widget may not be mounted/loaded yet, ignore
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onSubmitTotp(values: TotpFormValues) {
        if (!preAuthToken) return;
        setServerError(null);
        setIsSubmitting(true);
        try {
            const loggedInUser = await loginStepTwo(preAuthToken, values.code);
            router.push(loggedInUser.role === "admin" ? "/admin/users" : "/equipment");
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Invalid or expired code.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function backToCredentials() {
        setStep("credentials");
        setPreAuthToken(null);
        setServerError(null);
        totpForm.reset();
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#131313]">
            {/* Left panel: branding */}
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden">
                <Image src={cameraImg} alt="Camera lens" fill priority className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/95 via-[#131313]/70 to-black/50" />

                <div className="relative z-10 p-12 flex items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-[#b7c4ff]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                    <span className="text-3xl font-bold text-[#b7c4ff]">Shutter</span>
                </div>

                <div className="relative z-10 p-12 space-y-4 text-white">
                    <span className="inline-block bg-[#1e65ff] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        PRECISION ENGINEERED
                    </span>
                    <h2 className="text-3xl font-semibold leading-tight max-w-sm">
                        Master your craft with the world's finest optics.
                    </h2>
                    <p className="text-[#c3c5d9] text-sm max-w-sm">
                        Welcome back. Sign in to access your gear and kits.
                    </p>
                </div>
            </div>

            {/* Right panel: form */}
            <div className="flex items-center justify-center px-6 py-12 bg-[#131313]">
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-3xl text-[#b7c4ff]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                        <span className="text-3xl font-bold text-[#b7c4ff]">Shutter</span>
                    </div>

                    {step === "credentials" ? (
                        <>
                            <div>
                                <h1 className="text-3xl font-semibold text-white">Welcome back.</h1>
                                <p className="text-[#c3c5d9] mt-2">Sign in to access your gear and kits.</p>
                            </div>

                            {justRegistered && (
                                <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
                                    Account created successfully. You can now log in.
                                </div>
                            )}

                            <form onSubmit={credentialsForm.handleSubmit(onSubmitCredentials)} className="space-y-4" noValidate>
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
                                            {...credentialsForm.register("email")}
                                            className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                            placeholder="example@gmail.com"
                                        />
                                    </div>
                                    {credentialsForm.formState.errors.email && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {credentialsForm.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label htmlFor="password" className="block text-sm font-medium text-[#e5e2e1]">
                                            Password
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b5]" />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            {...credentialsForm.register("password")}
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

                                    <div className="text-right mt-1.5">
                                        <Link href="/forgot-password" className="text-xs text-[#b7c4ff] hover:text-white">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    {credentialsForm.formState.errors.password && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {credentialsForm.formState.errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {serverError && (
                                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                        {typeof serverError === "string" ? serverError : "Something went wrong."}
                                    </div>
                                )}

                                {captchaRequired && <div ref={captchaContainerRef} />}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isSubmitting ? "Signing in..." : "SIGN IN"}
                                </button>

                                <div className="text-center pt-3">
                                    <p className="text-sm text-[#a0a3b5]">
                                        Don&apos;t have an account?{" "}
                                        <Link href="/register" className="text-[#b7c4ff] font-medium hover:text-white underline underline-offset-2">
                                            Join Shutter
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div>
                                <button
                                    onClick={backToCredentials}
                                    className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                                >
                                    <ArrowLeft size={14} />
                                    Back
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                    <KeyRound size={20} className="text-[#007AFF]" />
                                    <h1 className="text-2xl font-semibold text-neutral-900">Two-factor code</h1>
                                </div>
                                <p className="text-sm text-neutral-500">
                                    Enter the 6-digit code from your authenticator app.
                                </p>
                            </div>

                            {serverError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                                    {serverError}
                                </div>
                            )}

                            <form onSubmit={totpForm.handleSubmit(onSubmitTotp)} className="space-y-4" noValidate>
                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium text-neutral-700 mb-1.5">
                                        Authentication code
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        {...totpForm.register("code")}
                                        className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.5em] font-medium focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                        placeholder="000000"
                                    />
                                    {totpForm.formState.errors.code && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {totpForm.formState.errors.code.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#0055ff] hover:bg-[#004de6] text-white-900 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isSubmitting ? "Verifying..." : "Verify and log in"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}