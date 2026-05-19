"use client";

import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Trash2, IndianRupee, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("pawstore_wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (productId: number) => {
    const updated = wishlist.filter((id: number) => id !== productId);
    setWishlist(updated);
    localStorage.setItem("pawstore_wishlist", JSON.stringify(updated));
  };

  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem("pawstore_cart") || "[]");
    const existing = cart.find((item: any) => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        qty: 1,
        imageUrl: product.imageUrl || "/images/food.png",
      });
    }
    localStorage.setItem("pawstore_cart", JSON.stringify(cart));
    window.location.href = "/shop";
  };

  const wishlistProducts = products.filter((p: any) => wishlist.includes(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-3 tracking-tight flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500" />
          My Wishlist
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          {wishlist.length} saved items
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 border border-gray-50 shadow-sm text-center space-y-4">
          <Heart className="w-16 h-16 text-gray-200 mx-auto" />
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">Your wishlist is empty</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Save items you love for later</p>
          <Link
            href="/shop"
            className="inline-block px-8 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product: any, i: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all"
            >
              <div className="relative aspect-square bg-[#FBF9F5] rounded-[2rem] overflow-hidden mb-5 flex items-center justify-center">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4 transition-transform duration-700 group-hover:scale-108" />
                ) : (
                  <div className="text-4xl">📦</div>
                )}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating || 4.7) ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                  ))}
                </div>
                <h3 className="font-black text-[hsl(var(--secondary))] tracking-tight group-hover:text-orange-500 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-0.5 text-xl font-black text-[hsl(var(--secondary))]">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {parseFloat(product.price).toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-5 py-3 bg-[hsl(var(--secondary))] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-500 transition-all shadow-md flex items-center gap-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
