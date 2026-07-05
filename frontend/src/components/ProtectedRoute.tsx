"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({
    children,
    adminOnly = false,
}: {
    children: React.ReactNode;
    adminOnly?: boolean;
}) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.replace("/login");
            return;
        }
        if (adminOnly && user.role !== "admin") {
            router.replace("/");
        }
    }, [user, adminOnly, router]);

    if (!user) return null;
    if (adminOnly && user.role !== "admin") return null;

    return <>{children}</>;
}