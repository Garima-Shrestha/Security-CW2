"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

function PaymentCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pidx = searchParams.get("pidx");

    const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!pidx) {
            setStatus("failed");
            setMessage("Missing payment reference");
            return;
        }
        api
            .post("/api/rentals/pay/verify", { pidx })
            .then((res) => {
                if (res.data.data.status === "Completed") {
                    setStatus("success");
                    setTimeout(() => router.push(`/rentals/${res.data.data.rentalId}`), 1500);
                } else {
                    setStatus("failed");
                    setMessage(`Payment status: ${res.data.data.status}`);
                }
            })
            .catch((err) => {
                setStatus("failed");
                setMessage(err?.response?.data?.message || "Payment verification failed");
            });
    }, [pidx, router]);

    return (
        <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-4 px-6 text-center">
            {status === "verifying" && (
                <>
                    <Loader2 size={28} className="animate-spin text-[#0052ff]" />
                    <p className="text-[#a0a3b5]">Verifying payment...</p>
                </>
            )}
            {status === "success" && (
                <p className="text-emerald-400">Payment confirmed! Redirecting...</p>
            )}
            {status === "failed" && (
                <>
                    <p className="text-red-400 text-sm">{message}</p>
                    <button onClick={() => router.push("/rentals")} className="text-[#b7c4ff] text-sm underline">
                        Go to my rentals
                    </button>
                </>
            )}
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={null}>
                <PaymentCallbackContent />
            </Suspense>
        </ProtectedRoute>
    );
}