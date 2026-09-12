"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, ShoppingBag, X, Check } from "lucide-react";
import { useCart } from "@/components/Navbar";

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { refresh } = useCart();

  useEffect(() => {
    fetch("/api/wishlist")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return { items: [] };
        }
        return r.json();
      })
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (productId: number) => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const addToCart = async (productId: number) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty: 1 }),
    });
    if (res.ok) {
      setAddedId(productId);
      refresh();
      setTimeout(() => setAddedId(null), 1500);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-bold text-gray-700">Your wishlist is empty</h3>
        <p className="text-sm text-gray-500 mt-1">Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="mt-5 inline-block bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl">Browse Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-black text-gray-900 text-lg mb-5">My Wishlist ({items.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group">
            <div className="aspect-square bg-gray-50 relative">
              <Link href={`/shop/${p.slug}`}>
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="250px" />}
              </Link>
              <button onClick={() => remove(p.productId)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow" aria-label="Remove">
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
              {p.stock === 0 && <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-bold text-gray-500">Out of stock</span>}
            </div>
            <div className="p-3">
              <Link href={`/shop/${p.slug}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-orange-600 min-h-[40px]">{p.name}</Link>
              <p className="font-extrabold text-gray-900 mt-1">₹{parseFloat(p.price).toFixed(0)}</p>
              <button
                onClick={() => addToCart(p.productId)}
                disabled={p.stock === 0}
                className={`w-full mt-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  p.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : addedId === p.productId ? "bg-teal-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {p.stock === 0 ? "Out of stock" : addedId === p.productId ? <><Check className="w-3.5 h-3.5" /> Added</> : <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
