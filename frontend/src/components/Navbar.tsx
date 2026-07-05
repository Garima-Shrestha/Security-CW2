"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Camera, ShieldCheck, LogOut } from "lucide-react";

const HIDDEN_ON = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user || HIDDEN_ON.includes(pathname)) return null;

    return (
        <nav className="w-full bg-[#131313] border-b border-[#252525] px-6 py-4 flex items-center justify-between">
            <Link href="/equipment" className="flex items-center gap-2">
                <Camera size={20} className="text-[#a5c1fc]" />
                <span className="font-semibold text-[#a5c1fc]">SHUTTER</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
                <span className="text-[#8d90a2]">Hi, {user.username}</span>
                <Link href="/settings/security" className="flex items-center gap-1 text-[#e5e2e1] hover:text-[#0052ff]">
                    <ShieldCheck size={16} /> MFA
                </Link>
                <button onClick={logout} className="flex items-center gap-1 text-[#e5e2e1] hover:text-red-400">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
}