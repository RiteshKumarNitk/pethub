"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Dog, ShoppingBag, Calendar, Heart, Tag,
  Settings, LogOut, MapPin, Bell, Loader2, RefreshCw, Gift,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/account" },
  { icon: Dog, label: "My Pets", href: "/account/pets" },
  { icon: ShoppingBag, label: "Orders", href: "/account/orders" },
  { icon: RefreshCw, label: "Subscriptions", href: "/account/subscriptions" },
  { icon: Gift, label: "Rewards", href: "/account/rewards" },
  { icon: Calendar, label: "Bookings", href: "/account/bookings" },
  { icon: Tag, label: "My Listings", href: "/account/listings" },
  { icon: Heart, label: "Wishlist", href: "/account/wishlist" },
  { icon: MapPin, label: "Addresses", href: "/account/addresses" },
  { icon: Bell, label: "Notifications", href: "/account/notifications" },
  { icon: Settings, label: "Settings", href: "/account/settings" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string | null; phone?: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/mobile/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.replace("/login");
        } else {
          setUser(d.user);
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (checking) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Hi, {user?.name?.split(" ")[0] || "Pet Parent"} 👋</h1>
        <p className="text-sm text-gray-500">{user?.phone}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-60 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    active ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 whitespace-nowrap lg:mt-4"
            >
              <LogOut className="w-4.5 h-4.5" /> Log out
            </button>
          </nav>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
