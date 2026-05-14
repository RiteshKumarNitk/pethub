"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Dog, 
  ShoppingBag, 
  Calendar, 
  Store, 
  Settings,
  LogOut,
  Plus
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Dog, label: "My Pets", href: "/dashboard/pets" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: Store, label: "Pet Shop", href: "/shop" },
  { icon: Calendar, label: "Bookings", href: "/dashboard/bookings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 pt-20">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-8 flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 ml-2">Main Menu</p>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium ${
                    isActive 
                      ? "bg-orange-50 text-[hsl(var(--primary))] shadow-sm shadow-orange-500/5" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-[hsl(var(--secondary))]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-orange-500" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-8 border-t border-gray-100 space-y-4">
           <Link
            href="/dashboard/settings"
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all font-medium"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-medium">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
