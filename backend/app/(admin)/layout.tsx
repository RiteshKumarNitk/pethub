"use client";

import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <html lang="en">
      <body className={`${outfit.className} bg-gray-50 antialiased`}>
        <div className="flex h-screen overflow-hidden">
          {/* Admin Sidebar */}
          <aside className="w-80 bg-[hsl(var(--secondary))] text-white flex flex-col shadow-2xl z-50">
            <div className="p-10">
              <Link href="/admin" className="flex items-center gap-3 mb-12 group">
                <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                  <span className="text-white text-xl font-bold">P</span>
                </div>
                <span className="text-2xl font-black tracking-tight">Admin<span className="text-[hsl(var(--primary))]">Hub</span></span>
              </Link>

              <nav className="space-y-2">
                {[
                  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
                  { icon: ShoppingBag, label: "Listings", href: "/admin/listings" },
                  { icon: Users, label: "Adoption Leads", href: "/admin/interests" },
                  { icon: Calendar, label: "Bookings", href: "/admin/bookings" },
                  { icon: Users, label: "Users", href: "/admin/users" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-6 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-auto p-10 border-t border-white/5 space-y-4">
              <Link href="/admin/settings" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
                <Settings className="w-5 h-5" /> Settings
              </Link>
               <button 
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-100 hover:text-white hover:bg-red-500/20 transition-all font-black text-xs uppercase tracking-[0.2em] disabled:opacity-50"
               >
                 {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />} 
                 Sign Out
               </button>
            </div>
          </aside>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
             {/* Admin Top Bar */}
             <header className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-12 shrink-0">
                <h2 className="text-xl font-black text-[hsl(var(--secondary))]">System Control</h2>
                <div className="flex items-center gap-6">
                   <button className="relative p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-[hsl(var(--primary))] transition-all">
                      <Bell className="w-6 h-6" />
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                   </button>
                   <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                      <div className="text-right hidden md:block">
                         <p className="text-sm font-black text-[hsl(var(--secondary))]">Super Admin</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administrator</p>
                      </div>
                      <div className="w-12 h-12 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center font-black text-white text-lg">A</div>
                   </div>
                </div>
             </header>

             {/* Content Area */}
             <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                {children}
             </main>
          </div>
        </div>
      </body>
    </html>
  );
}
