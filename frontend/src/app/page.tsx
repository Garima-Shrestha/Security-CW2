// "use client";


// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/hooks/useAuth";


// export default function Home() {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();


//   useEffect(() => {
//     if (isLoading) return;
//     if (user) {
//       router.replace(user.role === "admin" ? "/admin/users" : "/equipment");
//     } else {
//       router.replace("/login");
//     }
//   }, [user, isLoading, router]);


//   return null;



"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      {name}
    </span>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(user.role === "admin" ? "/admin/users" : "/equipment");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    function onScroll() {
      const nav = document.getElementById("shutter-nav");
      if (!nav) return;
      if (window.scrollY > 20) {
        nav.classList.add("h-16", "bg-[#131313]/95");
        nav.classList.remove("h-20", "bg-[#131313]/80");
      } else {
        nav.classList.add("h-20", "bg-[#131313]/80");
        nav.classList.remove("h-16", "bg-[#131313]/95");
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading || user) return null;

  const geistSans = { fontFamily: "var(--font-geist-sans)" };
  const geistMono = { fontFamily: "var(--font-geist-mono)" };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] overflow-x-hidden" style={geistMono}>
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          border-color: #0052ff;
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }
        .sapphire-glow { box-shadow: 0 0 40px -10px rgba(0, 82, 255, 0.15); }
        .bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
      `}</style>

      {/* Nav */}
      <nav id="shutter-nav" className="fixed top-0 left-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#434656] h-20 transition-all">
        <div className="flex justify-between items-center px-8 h-full w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <a className="text-3xl font-bold text-[#b7c4ff] flex items-center gap-2" href="#" style={geistSans}>
              <Icon name="camera" />
              Shutter
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="px-4 py-2 text-[#c3c5d9] font-normal hover:text-[#a4c9ff] transition-colors">Sign In</a>
            <a href="/register" className="bg-[#0052ff] text-[#dfe3ff] px-6 py-2 rounded font-medium hover:brightness-110 transition-all">Join Shutter</a>
          </div>
        </div>
      </nav>

      <main className="mt-20">
        {/* Hero */}
        <section className="relative min-h-[600px] flex items-center overflow-hidden py-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/60 to-transparent z-10" />
            <div
              className="w-full h-full bg-cover bg-center opacity-40"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDuHqmMO6zjq8EFSHTDKd2abdCIgM2ia-i0ZfEFi66bMhwiib5oTqcuATqB-6uSB1DTCUb6DRv7CGmI98IqHH7QO4aZdWcnafB_RRIxy21oD2DXj-KCUjzwE82Tb5a4ceb41iEqwe7HqjeOFyRSxVIqbpBOoWpBHVJPEDiJfynRaYgixXBxx_koJ_3yyNbOGkl6Ii-qBKGZ7cv8KWHWM-raeP1I3SzFrBIxuCNQAmtidF1OOw0-XbKXzTQQE3hmIRgOmIJG-ZkrFbA')",
              }}
            />
          </div>
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-8">
            <div className="max-w-2xl space-y-8">
              <p className="text-xs uppercase tracking-widest text-[#a0a3b5] font-medium">
                Professional gear, on demand
              </p>
              <h1 className="text-5xl leading-tight text-[#e5e2e1] font-bold" style={geistSans}>
                The World&apos;s Best Gear, <br /> <span className="text-[#0052ff]">Delivered to Your Set.</span>
              </h1>
              <p className="text-base text-[#c3c5d9] leading-relaxed" style={geistSans}>
                Access an elite catalog of cinema cameras, anamorphic lenses, and professional lighting. Verified by experts, insured for peace of mind, and shipped globally.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/equipment" className="bg-[#0052ff] text-[#dfe3ff] px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(0,82,255,0.4)] transition-all">
                  Browse Equipment
                  <Icon name="arrow_forward" />
                </a>
                <a href="#how-it-works" className="border border-[#434656] text-[#e5e2e1] px-8 py-4 rounded-lg font-bold hover:bg-white/5 transition-all">
                  How it Works
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-24 bg-[#0e0e0e] border-y border-[#434656]">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center rounded text-[#0052ff]">
                  <Icon name="verified" />
                </div>
                <h3 className="text-xl font-medium text-[#e5e2e1]">Verified Quality</h3>
                <p className="text-[#c3c5d9] leading-relaxed" style={geistSans}>Every piece of gear undergoes a 42-point technical inspection before being listed in our catalog.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center rounded text-[#0052ff]">
                  <Icon name="security" />
                </div>
                <h3 className="text-xl font-medium text-[#e5e2e1]">Insurance Included</h3>
                <p className="text-[#c3c5d9] leading-relaxed" style={geistSans}>Global production insurance coverage is built into every rental, protecting you from accidental damage.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center rounded text-[#0052ff]">
                  <Icon name="public" />
                </div>
                <h3 className="text-xl font-medium text-[#e5e2e1]">Global Shipping</h3>
                <p className="text-[#c3c5d9] leading-relaxed" style={geistSans}>Direct delivery to your studio or set location in over 45 countries with real-time logistics tracking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid */}
        <section className="py-16 max-w-[1440px] mx-auto px-8">
          <div className="mb-12">
            <div className="space-y-2">
              <span className="text-xs text-[#b7c4ff] uppercase tracking-widest font-medium">Inventory</span>
              <h2 className="text-3xl font-semibold" style={geistSans}>Explore the Catalog</h2>
            </div>
          </div>
          <div className="bento-grid h-[800px]">
            <div className="col-span-12 md:col-span-8 row-span-2 glass-card rounded-xl overflow-hidden relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEdEABLqcVArT6mDDQ0PnXG12vOgce0AolNvWgxwCozG3H8Ux17P83xC4CEbOy4UqKyadx0TcZaGJNZ8oD7Kmd5agBpcULkDIqiRunOyTWHHiocMTRCdYNGPYz_cCqlmJS8qMmq4INOOFfuomwFc5WCVVuyNNBfpF_te95f9RHLLDCdxKYTV5oUGK25eGTssaHgp3Blat77SGmckeoMoKSYF2QmZpIAatBzRa1rcFifKdBSvtVhDwu0Xe-DqQu5mrJjAvqgBYmte4"
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent px-8 py-10 flex flex-col justify-end">
                <h3 className="text-3xl font-semibold mb-2" style={geistSans}>Camera Bodies</h3>
                <p className="text-[#c3c5d9] max-w-md" style={geistSans}>ARRI, RED, Sony, and Blackmagic systems for world-class productions.</p>
                <div className="mt-6">
                  <span className="text-xs bg-white/10 px-3 py-1 rounded">124 MODELS AVAILABLE</span>
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 glass-card rounded-xl overflow-hidden relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeTofwVQ94Ybsj3RrdyQYJrpJlAo9mKEOQxSMd6XCDE6DGd9KnVyifsxBO0RpooXnwNufhCXQt9kkvx3t7pUX_u1O7x5ZFSUEESJpnQxH9MkB-k-zaC7B4jFiBNNrS2Ty8nhFePe0-kL4lwbMIH2gmK9QlycBuKdtxf8Bi-nxTgC9-R1EVPMnJ12ZXAOo0VMCIjNtwNdSrcrWV7PrJv1OhxmABPcFZNja5YIeIfA9sp8LJIkW8V0ymwAC37ufmDYf1O8s8y4RLOM4"
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent px-6 py-6 flex flex-col justify-end">
                <h4 className="text-xl font-medium">Elite Glass</h4>
                <p className="text-[#c3c5d9] text-sm">Anamorphic &amp; Prime Lenses</p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 glass-card rounded-xl overflow-hidden relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV421Awd5dUudL-P-BIIKDHarKr0DgE8T00Ug7WEwUvjqA5Ig_gWLsVOmq7lpL1UwWK06-c5MieEli_-0FvmstBEsU8FttZ5ftvRObCBiDSU_621BSRJv0Ecc7op1U87r7F04t0fSJrVrWVCQB8MdbOmOb_160Fr0hei2uiGtNrxhh9ZPxs0OWMNoTO2NHWt2cHiYSr-Y9n1eyf4LroZF-5v_l0Lvoc2dlEJsV6jBAR8Lsa6pxW24RDZwfokMiQ6A8i5uc3dY4sOY"
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent px-6 py-6 flex flex-col justify-end">
                <h4 className="text-xl font-medium">Pro Lighting</h4>
                <p className="text-[#c3c5d9] text-sm">COB, LED, and HMI Kits</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-16 bg-[#201f1f]">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <h2 className="text-3xl font-semibold" style={geistSans}>Streamlined for Professionals</h2>
              <p className="text-[#c3c5d9]" style={geistSans}>We&apos;ve removed the friction from high-end rentals so you can focus on the frame.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#131313] border border-[#434656] flex items-center justify-center text-3xl text-[#b7c4ff]" style={geistSans}>01</div>
                <h3 className="text-xl font-medium">Find Gear</h3>
                <p className="text-[#c3c5d9] px-4" style={geistSans}>Browse our real-time inventory and select the specific focal lengths and bodies you need.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#131313] border border-[#434656] flex items-center justify-center text-3xl text-[#b7c4ff]" style={geistSans}>02</div>
                <h3 className="text-xl font-medium">Book Dates</h3>
                <p className="text-[#c3c5d9] px-4" style={geistSans}>Our calendar system ensures availability is guaranteed. Select your rental window and checkout.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0e0e0e] border-t border-[#434656]">
        <div className="max-w-[1440px] mx-auto px-8 py-8 text-center">
          <p className="text-xs text-[#b1c6f9] opacity-80">© {new Date().getFullYear()} Shutter Photography Equipment Rental. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}