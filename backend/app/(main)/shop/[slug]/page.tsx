"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Star, Check, ShieldCheck, Truck, Package, Loader2,
  Heart, ChevronRight, MessageCircle,
} from "lucide-react";
import { useCart } from "@/components/Navbar";

interface ProductDetail {
  product: {
    id: number; slug: string; name: string; description: string | null; shortDescription: string | null;
    price: string; mrp: string | null; stock: number; imageUrl: string | null;
    specifications: Record<string, string>; petType: string;
    categoryName: string | null; categorySlug: string | null; brandName: string | null;
  };
  images: { id: number; url: string; alt: string | null }[];
  variants: { id: number; name: string; priceDelta: string; stock: number }[];
  reviews: { id: number; rating: number; title: string | null; comment: string | null; userName: string | null; createdAt: string }[];
  rating: number;
  reviewCount: number;
  related: { id: number; slug: string; name: string; price: string; mrp: string | null; imageUrl: string | null }[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { refresh } = useCart();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"description" | "specs" | "reviews">("description");

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        if (d.variants?.length) setSelectedVariant(d.variants[0].id);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }
  if (notFound || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-32 px-4">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Product not found</h1>
        <p className="text-gray-500 text-sm mt-1">It may have been removed or is no longer available.</p>
        <Link href="/shop" className="mt-5 inline-block bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl">Back to Shop</Link>
      </div>
    );
  }

  const { product: p, images, variants, reviews, related } = data;
  const price = parseFloat(p.price);
  const mrp = p.mrp ? parseFloat(p.mrp) : null;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const variant = variants.find((v) => v.id === selectedVariant);
  const finalPrice = price + (variant ? parseFloat(variant.priceDelta) : 0);
  const stock = variant ? variant.stock : p.stock;
  const gallery = [
    ...(p.imageUrl ? [{ id: 0, url: p.imageUrl, alt: p.name }] : []),
    ...images,
  ];

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/shop" className="hover:text-orange-600">Shop</Link>
        {p.categorySlug && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/shop?category=${p.categorySlug}`} className="hover:text-orange-600">{p.categoryName}</Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 truncate max-w-[200px]">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100">
            {gallery[selectedImage] ? (
              <Image src={gallery[selectedImage].url} alt={p.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-200" /></div>
            )}
            {off > 0 && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{off}% OFF</span>}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {gallery.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? "border-orange-500" : "border-gray-100"}`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          {p.brandName && <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">{p.brandName}</p>}
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{p.name}</h1>

          {data.reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-amber-700">{data.rating}</span>
              </div>
              <span className="text-sm text-gray-500">{data.reviewCount} review{data.reviewCount !== 1 ? "s" : ""}</span>
            </div>
          )}

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

          {/* Stock + qty */}
          <div className="flex items-center gap-4 mt-5">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-2.5 text-gray-500 hover:bg-gray-50 font-bold">−</button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(stock, qty + 1, 10))} className="px-3.5 py-2.5 text-gray-500 hover:bg-gray-50 font-bold">+</button>
            </div>
            <p className={`text-sm font-semibold ${stock === 0 ? "text-red-500" : stock <= 5 ? "text-amber-600" : "text-teal-600"}`}>
              {stock === 0 ? "Out of stock" : stock <= 5 ? `Only ${stock} left!` : "In stock"}
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

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            {[
              { icon: Truck, label: "Fast delivery" },
              { icon: ShieldCheck, label: "Genuine products" },
              { icon: MessageCircle, label: "Expert support" },
            ].map((t) => (
              <div key={t.label} className="bg-gray-50 rounded-xl py-3 px-2">
                <t.icon className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-[11px] font-semibold text-gray-600">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b border-gray-100">
          {(["description", "specs", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-bold capitalize transition-colors ${tab === t ? "text-orange-600 border-b-2 border-orange-500" : "text-gray-400 hover:text-gray-600"}`}
            >
              {t === "specs" ? "Specifications" : t === "reviews" ? `Reviews (${data.reviewCount})` : "Description"}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === "description" && (
            <div className="max-w-3xl prose prose-sm text-gray-600">
              <p className="whitespace-pre-line">{p.description || p.shortDescription || "No description available."}</p>
            </div>
          )}
          {tab === "specs" && (
            <div className="max-w-2xl">
              {Object.keys(p.specifications || {}).length > 0 ? (
                <dl className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {Object.entries(p.specifications).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 text-sm">
                      <dt className="px-4 py-2.5 bg-gray-50 font-semibold text-gray-600">{k}</dt>
                      <dd className="px-4 py-2.5 col-span-2 text-gray-800">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-400">No specifications listed.</p>
              )}
            </div>
          )}
          {tab === "reviews" && (
            <div className="max-w-3xl space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews yet. Be the first to review after purchasing!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</div>
                      <span className="text-sm font-bold text-gray-900">{r.userName || "Customer"}</span>
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.title && <p className="font-semibold text-gray-800 text-sm">{r.title}</p>}
                    <p className="text-sm text-gray-600">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-black text-gray-900 mb-5">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/shop/${r.slug}`} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-gray-50 relative">
                  {r.imageUrl ? (
                    <Image src={r.imageUrl} alt={r.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="200px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2">{r.name}</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">₹{parseFloat(r.price).toFixed(0)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
