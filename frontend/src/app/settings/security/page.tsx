"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { ShieldCheck, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

const enableTotpSchema = z.object({
    code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Digits only"),
});
type EnableTotpValues = z.infer<typeof enableTotpSchema>;

function TotpSetupContent() {
    const { user } = useAuth();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isEnabled, setIsEnabled] = useState(user?.isTotpEnabled ?? false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EnableTotpValues>({ resolver: zodResolver(enableTotpSchema) });

    async function startSetup() {
        setServerError(null);
        setIsStarting(true);
        try {
            const res = await api.post("/api/auth/totp/setup");
            setQrCode(res.data.data.qrCode);
            setSecret(res.data.data.secret);
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Failed to start MFA setup");
        } finally {
            setIsStarting(false);
        }
    }

    async function onConfirmCode(values: EnableTotpValues) {
        setServerError(null);
        try {
            await api.post("/api/auth/totp/enable", { code: values.code });
            setIsEnabled(true);
            setQrCode(null);
            setSecret(null);
            setSuccessMsg("MFA enabled successfully. You will need your authenticator app on next login.");
            reset();
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Invalid code, please try again");
        }
    }

    return (
        <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={22} className="text-[#0052ff]" />
                    <h1 className="text-2xl font-semibold text-white">Two-Factor Authentication</h1>
                </div>

                {isEnabled && !qrCode && (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
                        MFA is currently enabled on your account.
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
                        {successMsg}
                    </div>
                )}

                {serverError && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {serverError}
                    </div>
                )}

                {!isEnabled && !qrCode && (
                    <button
                        onClick={startSetup}
                        disabled={isStarting}
                        className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isStarting && <Loader2 size={16} className="animate-spin" />}
                        {isStarting ? "Generating..." : "Enable MFA"}
                    </button>
                )}

                {qrCode && (
                    <div className="space-y-4">
                        <p className="text-sm text-[#a0a3b5]">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code it shows.
                        </p>
                        <div className="bg-white p-4 rounded-lg w-fit mx-auto">
                            <Image src={qrCode} alt="TOTP QR Code" width={200} height={200} unoptimized />
                        </div>
                        {secret && (
                            <p className="text-xs text-[#a0a3b5] text-center break-all">
                                Manual entry key: <span className="text-[#e5e2e1]">{secret}</span>
                            </p>
                        )}

                        <form onSubmit={handleSubmit(onConfirmCode)} className="space-y-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoComplete="one-time-code"
                                {...register("code")}
                                className="w-full bg-[#201f1f] border border-[#434656] text-[#e5e2e1] rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.5em] font-medium focus:outline-none focus:border-[#0052ff] transition placeholder:text-[#a0a3b5]"
                                placeholder="000000"
                            />
                            {errors.code && <p className="text-red-600 text-xs">{errors.code.message}</p>}

                            <button
                                type="submit"
                                className="w-full bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-2.5 text-sm font-semibold tracking-wide transition"
                            >
                                Confirm and enable
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TotpSetupPage() {
    return (
        <ProtectedRoute>
            <TotpSetupContent />
        </ProtectedRoute>
    );
}