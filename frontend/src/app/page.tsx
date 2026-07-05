"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, LogOut, Camera } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-2">
        <Camera size={28} className="text-[#a5c1fc]" />
        <span className="text-xl font-semibold text-[#a5c1fc]">SHUTTER</span>
      </div>

      {user ? (
        <>
          <p className="text-[#e5e2e1]">Welcome, {user.username}</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link
              href="/settings/security"
              className="flex items-center justify-center gap-2 bg-[#0052ff] hover:bg-[#0066ff] text-white rounded-lg py-3 text-sm font-semibold transition"
            >
              <ShieldCheck size={16} />
              MFA Settings
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 border border-[#434656] text-[#e5e2e1] rounded-lg py-3 text-sm font-semibold transition hover:bg-[#201f1f]"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </>
      ) : (
        <p className="text-[#8d90a2]">
          Please <Link href="/login" className="text-[#b7c4ff] underline">log in</Link>
        </p>
      )}
    </div>
  );
}