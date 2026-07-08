"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Camera, User, ShieldCheck, KeyRound, LogOut, ChevronDown } from "lucide-react";

const HIDDEN_ON = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user || HIDDEN_ON.includes(pathname)) return null;

    const navLinkClass = (path: string) =>
        `pb-1 border-b-2 font-medium transition ${
            pathname === path ? "text-[#60a5fa] border-[#60a5fa]" : "text-[#8d90a2] border-transparent hover:text-[#e5e2e1]"
        }`;

    return (
        <nav className="w-full bg-[#131313] border-b border-[#252525] px-6 py-4 grid grid-cols-3 items-center">
            <Link href="/equipment" className="flex items-center gap-2 justify-self-start">
                <Camera size={20} className="text-[#a5c1fc]" />
                <span className="font-semibold text-[#a5c1fc]">SHUTTER</span>
            </Link>

            {user.role === "admin" ? (
                <div className="flex items-center gap-6 text-sm justify-self-center">
                    <Link href="/admin/users" className={navLinkClass("/admin/users")}>Users</Link>
                    <Link href="/admin/categories" className={navLinkClass("/admin/categories")}>Categories</Link>
                    <Link href="/admin/equipment" className={navLinkClass("/admin/equipment")}>Equipment</Link>
                    <Link href="/admin/rentals" className={navLinkClass("/admin/rentals")}>Rentals</Link>
                </div>
            ) : (
                <div className="flex items-center gap-6 text-sm justify-self-center">
                    <Link href="/rentals" className={navLinkClass("/rentals")}>My Rentals</Link>
                </div>
            )}

            <div className="relative justify-self-end" ref={menuRef}>
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="flex items-center gap-2 text-sm text-[#e5e2e1] hover:text-[#6495ED] transition"
                >
                    <User size={18} />
                    Hi, {user.username}
                    <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg py-1 z-50">
                        <Link
                            href="/settings/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#e5e2e1] hover:bg-[#201f1f]"
                        >
                            <User size={14} /> Profile
                        </Link>
                        <Link
                            href="/settings/account"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#e5e2e1] hover:bg-[#201f1f]"
                        >
                            <KeyRound size={14} /> Account Details
                        </Link>
                        <Link
                            href="/settings/security"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#e5e2e1] hover:bg-[#201f1f]"
                        >
                            <ShieldCheck size={14} /> MFA
                        </Link>
                        <div className="border-t border-[#2a2a2a] my-1" />
                        <button
                            onClick={() => { setOpen(false); logout(); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[#201f1f] w-full text-left"
                        >
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}