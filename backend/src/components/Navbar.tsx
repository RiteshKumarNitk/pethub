"use client";

import Link from "next/link";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  User,
  PawPrint,
  Scissors,
  Store,
  Bell,
  ChevronDown,
} from "lucide-react";

// Lightweight global cart-count context fed by server cart API
const CartContext = createContext<{ count: number; refresh: () => void }>({ count: 0, refresh: () => {} });
export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCount(data.itemCount || 0);
        window.dispatchEvent(new CustomEvent("cart-updated", { detail: data.itemCount }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const handler = (e: Event) => setCount((e as CustomEvent).detail || 0);
    window.addEventListener("cart-updated", handler);
    window.addEventListener("refresh-cart", refresh);
    return () => {
      window.removeEventListener("cart-updated", handler);
      window.removeEventListener("refresh-cart", refresh);
    };
  }, [refresh]);

  return <CartContext.Provider value={{ count, refresh }}>{children}</CartContext.Provider>;
}

const primaryNav = [
  { label: "Shop", href: "/shop", icon: Store },
  { label: "Pets", href: "/pets", icon: PawPrint },
  { label: "Services", href: "/services", icon: Scissors },
  { label: "Sell / Rehome", href: "/sell-rehome", icon: Heart },
  { label: "Pet Care", href: "/pet-care", icon: null },
  { label: "About", href: "/about", icon: null },
  { label: "Contact", href: "/contact", icon: null },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string | null; role?: string } | null>(null);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/mobile/me");
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          const nres = await fetch("/api/notifications");
          if (nres.ok) {
            const ndata = await nres.json();
            setUnread(ndata.unread || 0);
          }
        }
      } catch {}
    };
    checkAuth();
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="bg-teal-700 text-white/90 text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-medium">🐾 Everything your pet needs in one place</span>
          <span className="hidden sm:inline">Free delivery above ₹499 · Mon–Sun 9AM–8PM</span>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-gray-900">
            Paw<span className="text-orange-500">Store</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {primaryNav.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(link.href.split("?")[0]) && link.href !== "/"
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-orange-300">
          <input
            type="text"
            placeholder="Search products, pets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
          <button type="submit" className="px-3 text-gray-400 hover:text-orange-500">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-1 flex-shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1.5 px-2 py-2 text-gray-600 hover:text-orange-600"
              >
                <User className="w-5 h-5" />
                <span className="hidden xl:inline text-sm font-medium">{user.name?.split(" ")[0] || "Account"}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-2 w-52 z-50">
                    <div className="px-4 py-1.5 text-xs text-gray-400 border-b border-gray-50">
                      {user.name || "Pet Parent"}
                    </div>
                    {[
                      ["My Pets", "/account/pets"],
                      ["Orders", "/account/orders"],
                      ["Bookings", "/account/bookings"],
                      ["My Listings", "/account/listings"],
                      ["Wishlist", "/account/wishlist"],
                      ["Notifications", "/account/notifications"],
                      ["Settings", "/account/settings"],
                    ].map(([label, href]) => (
                      <Link key={href} href={href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                        {label}
                      </Link>
                    ))}
                    {user.role === "admin" && (
                      <Link href="/admin" className="block px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50">
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 border-t border-gray-50">
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:flex px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600">
              Sign in
            </Link>
          )}

          {user && (
            <Link href="/account/notifications" className="p-2 text-gray-500 hover:text-orange-500 relative">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}

          <Link href="/cart" className="p-2 text-gray-600 hover:text-orange-500 relative">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 shadow">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          <Link href="/account/wishlist" className="p-2 text-gray-600 hover:text-red-500 hidden sm:block">
            <Heart className="w-5 h-5" />
          </Link>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-600">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-2 md:hidden">
            <input
              type="text"
              placeholder="Search products, pets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none"
            />
            <button type="submit" className="px-3 text-gray-400">
              <Search className="w-4 h-4" />
            </button>
          </form>
          {primaryNav.map((link) => (
            <Link key={link.label} href={link.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600">
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link href="/login" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50">
              Sign in / Create account
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
