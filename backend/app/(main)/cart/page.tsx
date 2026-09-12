"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Loader2, Trash2, Minus, Plus, ArrowRight, Truck } from "lucide-react";
import { useCart } from "@/components/Navbar";

interface CartLine {
  id: number; productId: number; name: string; slug: string; imageUrl: string | null;
  variantName: string | null; unitPrice: number; qty: number; stock: number; lineTotal: number;
}
interface Totals { subtotal: number; discount: number; shipping: number; tax: number; total: number }

export default function CartPage() {
  const router = useRouter();
  const { refresh } = useCart();
  const [items, setItems] = useState<CartLine[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setItems(data.items || []);
      setTotals(data.totals || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateQty = async (itemId: number, qty: number) => {
    setUpdating(itemId);
    try {
      if (qty <= 0) {
        await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      } else {
        const res = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, qty }),
        });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Failed to update");
        }
      }
      await load();
      refresh();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900">Your cart is empty</h1>
        <p className="text-gray-500 mt-2">Add some products, or meet our pets while you're here!</p>
        <div className="flex gap-3 mt-6 justify-center">
          <Link href="/shop" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl">Shop Products</Link>
          <Link href="/pets" className="border border-gray-200 font-bold px-6 py-3 rounded-xl text-gray-700">Meet Pets</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Your Cart ({items.reduce((s, i) => s + i.qty, 0)} items)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4">
              <Link href={`/shop/${item.slug}`} className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden relative flex-shrink-0">
                {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/shop/${item.slug}`} className="font-semibold text-gray-900 text-sm line-clamp-1 hover:text-orange-600">{item.name}</Link>
                    {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">₹{item.unitPrice.toFixed(0)} each</p>
                  </div>
                  <button onClick={() => updateQty(item.id, 0)} className="p-1.5 text-gray-300 hover:text-red-500" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} disabled={updating === item.id} className="px-2.5 py-1 text-gray-500 hover:bg-gray-50"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} disabled={updating === item.id || item.qty >= item.stock} className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="font-extrabold text-gray-900">₹{item.lineTotal.toFixed(0)}</p>
                </div>
                {item.qty >= item.stock && <p className="text-[10px] text-amber-600 mt-1">Max available quantity reached</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit lg:sticky lg:top-24">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{totals?.subtotal.toFixed(0)}</span></div>
              {totals && totals.shipping === 0 ? (
                <div className="flex justify-between text-teal-600 font-semibold"><span>Shipping</span><span>FREE</span></div>
              ) : (
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>₹{totals?.shipping.toFixed(0)}</span></div>
              )}
              {totals && totals.tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹{totals.tax.toFixed(0)}</span></div>}
              <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>₹{totals?.total.toFixed(0)}</span></div>
            </div>

            {totals && totals.shipping > 0 && (
              <div className="mt-3 bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2.5 flex items-center gap-2">
                <Truck className="w-4 h-4 flex-shrink-0" />
                Add items worth ₹{(500 - totals.subtotal).toFixed(0)} more for FREE delivery
              </div>
            )}

            <button
              onClick={() => router.push("/checkout")}
              className="w-full mt-5 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/shop" className="block text-center text-sm font-semibold text-gray-500 hover:text-orange-600 mt-3">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
