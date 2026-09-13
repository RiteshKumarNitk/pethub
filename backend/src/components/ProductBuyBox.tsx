"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check, Loader2, Heart, RefreshCw } from "lucide-react";
import { useCart } from "@/components/Navbar";

const SUBSCRIBE_FREQUENCIES = [
  { days: 7, label: "Weekly" },
  { days: 15, label: "Every 2 weeks" },
  { days: 30, label: "Monthly" },
  { days: 45, label: "Every 45 days" },
  { days: 60, label: "Every 2 months" },
];

interface Variant {
  id: number;
  name: string;
  priceDelta: string;
  stock: number;
}

interface Props {
  product: {
    id: number;
    name: string;
    price: string;
    mrp: string | null;
    stock: number;
    lowStockThreshold: number;
    imageUrl: string | null;
    shortDescription: string | null;
    petType: string;
    lifeStages: string[];
    needSlugs: string[];
    specifications: Record<string, string>;
    subscriptionEligible: boolean;
  };
  brandName: string | null;
  variants: Variant[];
  storeStock: number;
}

export default function ProductBuyBox({ product: p, brandName, variants, storeStock }: Props) {
  const router = useRouter();
  const { refresh } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<number | null>(variants.length ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [subFreq, setSubFreq] = useState(30);
  const [subLoading, setSubLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState("");

  const price = parseFloat(p.price);
  const mrp = p.mrp ? parseFloat(p.mrp) : null;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const variant = variants.find((v) => v.id === selectedVariant);
  const finalPrice = price + (variant ? parseFloat(variant.priceDelta) : 0);
  const stock = variant ? variant.stock : p.stock;
  const maxQty = Math.max(1, Math.min(stock, 10));

  const subscribe = async () => {
    setSubLoading(true);
    setSubError("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, variantId: selectedVariant, qty, frequencyDays: subFreq }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        setSubscribed(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubError(data.error || "Could not create subscription");
      }
    } catch {
      setSubError("Network error — please try again");
    } finally {
      setSubLoading(false);
    }
  };

  const addToCart = async (buyNow = false) => {
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, variantId: selectedVariant, qty }),
      });
      if (res.ok) {
        refresh();
        if (buyNow) router.push("/checkout");
        else {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add to cart");
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id }),
    });
    if (res.status === 401) router.push("/login");
  };

  return (
    <div>
      {brandName && <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">{brandName}</p>}
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{p.name}</h1>

      <div className="flex items-end gap-3 mt-4">
        <span className="text-3xl font-black text-gray-900">₹{finalPrice.toFixed(0)}</span>
        {mrp && mrp > price && <span className="text-lg text-gray-400 line-through mb-0.5">₹{mrp.toFixed(0)}</span>}
        {off > 0 && <span className="text-sm font-bold text-teal-600 mb-1">Save ₹{(mrp! - price).toFixed(0)}</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-bold text-gray-900 mb-2">Choose option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                disabled={v.stock === 0}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  selectedVariant === v.id
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : v.stock === 0
                      ? "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                      : "border-gray-200 text-gray-700 hover:border-orange-300"
                }`}
              >
                {v.name}
                {v.stock === 0 && <span className="block text-[10px]">Out of stock</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty + stock */}
      <div className="flex items-center gap-4 mt-5">
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-2.5 text-gray-500 hover:bg-gray-50 font-bold">−</button>
          <span className="w-10 text-center font-bold">{qty}</span>
          <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="px-3.5 py-2.5 text-gray-500 hover:bg-gray-50 font-bold">+</button>
        </div>
        <p className={`text-sm font-semibold ${stock === 0 ? "text-red-500" : stock <= p.lowStockThreshold ? "text-amber-600" : "text-teal-600"}`}>
          {stock === 0 ? "Out of stock online" : stock <= p.lowStockThreshold ? `Only ${stock} left online!` : "In stock online"}
          {storeStock > 0 && <span className="text-teal-700 font-bold"> · also at our store</span>}
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => addToCart(false)}
          disabled={adding || stock === 0}
          className={`flex-1 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : added ? "bg-teal-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : added ? <><Check className="w-4 h-4" /> Added to Cart</> : <><ShoppingBag className="w-4 h-4" /> Add to Cart</>}
        </button>
        <button
          onClick={() => addToCart(true)}
          disabled={adding || stock === 0}
          className="flex-1 py-3.5 rounded-xl font-bold bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
        >
          Buy Now
        </button>
        <button onClick={toggleWishlist} className="p-3.5 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200" aria-label="Add to wishlist">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Subscribe & Save */}
      {p.subscriptionEligible && stock > 0 && (
        <div className="mt-5 border border-teal-200 bg-teal-50/50 rounded-xl p-4">
          {subscribed ? (
            <p className="text-sm font-bold text-teal-700 flex items-center gap-2">
              <Check className="w-4 h-4" /> Subscription created — manage it in My Account
            </p>
          ) : (
            <>
              {subError && <p className="text-sm text-red-600 font-semibold mb-2">{subError}</p>}
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-teal-600" /> Subscribe &amp; never run out
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Save time — we'll prepare a new order automatically. Skip or cancel anytime.</p>
              <div className="flex gap-2 mt-3">
                <select
                  value={subFreq}
                  onChange={(e) => setSubFreq(parseInt(e.target.value))}
                  className="flex-1 border border-teal-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-teal-400"
                >
                  {SUBSCRIBE_FREQUENCIES.map((f) => (
                    <option key={f.days} value={f.days}>Deliver {f.label}</option>
                  ))}
                </select>
                <button
                  onClick={subscribe}
                  disabled={subLoading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold px-4 rounded-lg flex items-center gap-1.5"
                >
                  {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Subscribe</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tags */}
      {(p.lifeStages.length > 0 || p.needSlugs.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-5">
          {p.petType !== "all" && (
            <span className="text-xs font-semibold bg-orange-50 text-orange-700 rounded-full px-3 py-1 capitalize">{p.petType.replace("_", " ")}</span>
          )}
          {p.lifeStages.map((s) => (
            <span key={s} className="text-xs font-semibold bg-teal-50 text-teal-700 rounded-full px-3 py-1 capitalize">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
