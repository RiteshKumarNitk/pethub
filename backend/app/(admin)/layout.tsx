"use client";

import {
  LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut,
  PawPrint, Calendar, Scissors, MessageCircle, Star, Tag, FileText, Ticket, Tag as TagIcon,
  RefreshCw, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: ShoppingBag, label: "Products", href: "/admin/products" },
  { icon: Package, label: "Orders", href: "/admin/orders" },
  { icon: RefreshCw, label: "Subscriptions", href: "/admin/subscriptions" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: PawPrint, label: "Pet Listings", href: "/admin/listings" },
  { icon: Calendar, label: "Bookings", href: "/admin/bookings" },
  { icon: Scissors, label: "Services", href: "/admin/services" },
  { icon: MessageCircle, label: "Inquiries", href: "/admin/inquiries" },
  { icon: Users, label: "Customers", href: "/admin/users" },
  { icon: Star, label: "Reviews", href: "/admin/reviews" },
  { icon: TagIcon, label: "Coupons", href: "/admin/coupons" },
  { icon: FileText, label: "Pet Care Content", href: "/admin/blogs" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

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
      router.push("/admin/login");
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
          <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-50 overflow-y-auto flex-shrink-0">
            <div className="p-6">
              <Link href="/admin" className="flex items-center gap-2.5 mb-8">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight block leading-none">PawStore</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Admin Panel</span>
                </div>
              </Link>

              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all font-semibold text-[13px]"
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/5">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all font-semibold text-[13px] w-full"
              >
                <LogOut className="w-4.5 h-4.5" /> {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8 max-w-6xl">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
