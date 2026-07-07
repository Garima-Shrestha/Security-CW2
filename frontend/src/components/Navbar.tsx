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

    const navLinkClass = (path: string) =>
    `pb-1 border-b-2 font-medium transition ${
        pathname === path
            ? "text-[#60a5fa] border-[#60a5fa]"
            : "text-[#8d90a2] border-transparent hover:text-[#e5e2e1]"
    }`;

    return (
        <nav className="w-full bg-[#131313] border-b border-[#252525] px-6 py-4 grid grid-cols-3 items-center">
            <Link href="/equipment" className="flex items-center gap-2 justify-self-start">
                <Camera size={20} className="text-[#a5c1fc]" />
                <span className="font-semibold text-[#a5c1fc]">SHUTTER</span>
            </Link>
            {user.role === "admin" ? (
                <div className="flex items-center gap-6 text-sm justify-self-center">
                     <Link href="/admin/users" className={navLinkClass("/admin/users")}>
                        Users
                    </Link>
                    <Link href="/admin/categories" className={navLinkClass("/admin/categories")}>
                        Categories
                    </Link>
                    <Link href="/admin/equipment" className={navLinkClass("/admin/equipment")}>
                        Equipment
                    </Link>
                    <Link href="/admin/rentals" className={navLinkClass("/admin/rentals")}>
                        Rentals
                    </Link>
                </div>
            ) : (
                <div className="flex items-center gap-6 text-sm justify-self-center">
                    <Link href="/rentals" className={navLinkClass("/rentals")}>
                        My Rentals
                    </Link>
                </div>
            )}
            <div className="flex items-center gap-4 text-sm justify-self-end">
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