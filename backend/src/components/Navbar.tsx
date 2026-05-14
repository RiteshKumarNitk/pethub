"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LayoutDashboard, ShieldCheck, Loader2 } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Fetch user status
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/mobile/me");
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-morphism py-3 shadow-sm border-b border-white/10" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/20">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[hsl(var(--secondary))]">
            Pet<span className="text-[hsl(var(--primary))]">Hub</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          <Link href="/marketplace" className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))] transition-colors">
            Adoption
          </Link>
          <Link href="/shop" className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))] transition-colors">
            Shop
          </Link>
          <Link href="/services" className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))] transition-colors">
            Services
          </Link>
          <Link href="/about" className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))] transition-colors">
            About
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          ) : user ? (
            <div className="flex items-center gap-3">
               {user.role === 'admin' && (
                 <Link 
                   href="/admin" 
                   className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                 >
                   <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
                 </Link>
               )}
               <Link 
                 href="/dashboard" 
                 className="flex items-center gap-3 pl-4 border-l border-gray-100 group"
               >
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Welcome back</p>
                    <p className="text-xs font-bold text-[hsl(var(--secondary))]">{user.name || 'User'}</p>
                 </div>
                 <div className="w-10 h-10 bg-gray-50 text-[hsl(var(--secondary))] border border-gray-100 rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--secondary))] group-hover:text-white transition-all">
                    <LayoutDashboard className="w-5 h-5" />
                 </div>
               </Link>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-xs font-black uppercase tracking-widest !px-8 !py-3.5 shadow-xl shadow-orange-500/20">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
