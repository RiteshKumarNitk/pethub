"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LayoutDashboard,
  ShieldCheck,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Heart,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

const navLinks = [
  { label: "Food", href: "/shop?category=Food" },
  { label: "Accessories", href: "/shop?category=Accessories" },
  { label: "Grooming", href: "/shop?category=Care%20%26%20Hygiene" },
  { label: "Toys", href: "/shop?category=Toys" },
  { label: "All Products", href: "/shop" },
  { label: "Pet Care Guides", href: "/blog" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Delhi NCR");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    const syncCartCount = () => {
      try {
        const stored = localStorage.getItem("pawstore_cart");
        if (stored) {
          const items = JSON.parse(stored);
          const total = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        console.error("Cart sync error", err);
      }
    };

    syncCartCount();
    const interval = setInterval(syncCartCount, 1500);

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
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/shop");
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white/80 text-[11px] py-1.5 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-orange-400" />
              <span>Deliver to: <strong className="text-white">{selectedLocation}</strong></span>
              <ChevronDown className="w-2.5 h-2.5 text-white/50" />
            </button>
            {showLocationDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLocationDropdown(false)} />
                <div className="absolute top-6 left-0 bg-white text-gray-900 border border-gray-100 rounded-lg shadow-lg py-1.5 w-36 z-50 text-xs font-medium">
                  {["Delhi NCR", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata"].map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+919876543210" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-orange-400" />
              <span className="hidden sm:inline">+91 98765 43210</span>
            </a>
            <span className="hidden sm:inline text-orange-400 font-medium">Free delivery above ₹499</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`w-full transition-all duration-200 ${
          scrolled ? "bg-white shadow-sm border-b border-gray-100" : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              Paw<span className="text-orange-500">Store</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-sm bg-gray-50 border border-gray-100 rounded-lg overflow-hidden focus-within:border-orange-300 focus-within:ring-1 focus-within:ring-orange-200 transition-all">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            <button type="submit" className="px-3 text-gray-400 hover:text-orange-500 transition-colors cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Utilities */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Wishlist */}
            <Link href="/shop" className="hidden sm:flex p-2 text-gray-400 hover:text-red-500 transition-colors relative">
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link href="/checkout" className="p-2 text-gray-400 hover:text-orange-500 transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            <span className="w-px h-5 bg-gray-100 hidden sm:block" />

            {/* User */}
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-semibold uppercase hover:bg-orange-100 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin
                  </Link>
                )}
                <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg overflow-hidden focus-within:border-orange-300 transition-all">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  <button type="submit" className="px-3 text-gray-400 cursor-pointer">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-gray-50" />
              <a href="tel:+919876543210" className="block px-4 py-2.5 text-sm text-gray-600 hover:text-orange-600 rounded-lg transition-colors">
                📞 +91 98765 43210
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
