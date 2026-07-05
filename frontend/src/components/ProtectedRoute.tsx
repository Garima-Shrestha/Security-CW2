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
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        if (adminOnly && user.role !== "admin") {
            router.replace("/");
        }
    }, [user, isLoading, adminOnly, router]);

    if (isLoading) return null;
    if (!user) return null;
    if (adminOnly && user.role !== "admin") return null;

    return <>{children}</>;
}