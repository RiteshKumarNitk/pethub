"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star, Plus, Minus, X, ChevronRight, ShoppingCart, IndianRupee, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "Food", "Toys", "Health", "Gear"];

const mockProducts = [
  { id: 1, name: "Premium Puppy Kibble", price: 1450, rating: 4.8, reviews: 120, image: "/images/food.png", category: "Food" },
  { id: 2, name: "GPS Tracking Collar", price: 4289, rating: 4.9, reviews: 85, image: "/images/hero.png", category: "Gear" },
  { id: 3, name: "Orthopedic Memory Bed", price: 3650, rating: 4.7, reviews: 210, image: "/images/hero.png", category: "Gear" },
  { id: 4, name: "Smart Interactive Toy", price: 924, rating: 4.6, reviews: 56, image: "/images/adoption.png", category: "Toys" },
];

export default function ShopPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<{id: number, name: string, price: number, qty: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="pt-28 pb-20 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        {/* Shop Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-20 px-12 py-20 bg-[hsl(var(--secondary))] rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-4 py-1.5 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-[hsl(var(--primary))]/20">
              PetHub Store
            </span>
            <h1 className="text-5xl md:text-6xl font-black mb-8 leading-tight tracking-tighter">Premium Care for <br /> Your <span className="text-[hsl(var(--primary))]">Friends</span></h1>
            <p className="text-white/60 mb-10 font-bold uppercase tracking-widest text-xs leading-loose">
              Curated selection of high-quality food, toys, and gadgets. <br /> Fast delivery across India guaranteed.
            </p>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[hsl(var(--secondary))] bg-gray-200"></div>)}
                 </div>
                 <span className="font-black text-xs uppercase tracking-widest text-white/80">50k+ Happy Parents</span>
               </div>
            </div>
          </div>
          
          <div className="relative z-10 w-full lg:w-[450px] aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700">
             <Image src="/images/food.png" alt="Pet Supplies" fill className="object-cover" />
          </div>

          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--primary))]/10 rounded-full blur-[100px] -mr-64 -mt-64"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </div>

        {/* Filters and Cart Trigger */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
           <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat 
                      ? "bg-[hsl(var(--secondary))] text-white shadow-xl shadow-blue-900/10" 
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
           
           <button 
             onClick={() => setCartOpen(true)}
             className="group relative flex items-center gap-4 pl-6 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all"
           >
             <span className="text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))]">My Bag</span>
             <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-all">
               <ShoppingBag className="w-5 h-5" />
             </div>
             {cart.length > 0 && (
               <div className="absolute -top-2 -right-2 w-7 h-7 bg-[hsl(var(--primary))] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                 {cart.length}
               </div>
             )}
           </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {mockProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all"
            >
              <div className="relative aspect-square bg-gray-50 rounded-[2rem] overflow-hidden mb-8">
                <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-xl text-[10px] font-black text-[hsl(var(--secondary))] uppercase tracking-widest shadow-sm border border-white/50">{product.category}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < 4 ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                      ))}
                      <span className="text-[10px] font-black text-gray-300 ml-2 tracking-widest uppercase">{product.reviews} Reviews</span>
                   </div>
                   <h3 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight h-14 leading-tight">{product.name}</h3>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-0.5 text-2xl font-black text-[hsl(var(--secondary))]">
                    <IndianRupee className="w-4 h-4" />
                    {product.price}
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-14 h-14 bg-[hsl(var(--secondary))] text-white rounded-2xl flex items-center justify-center hover:bg-[hsl(var(--primary))] transition-all shadow-xl shadow-blue-500/10 active:scale-95"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-[hsl(var(--secondary))]/20 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-[70] shadow-2xl p-12 flex flex-col rounded-l-[4rem]"
            >
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[hsl(var(--secondary))] tracking-tight">Shopping Bag</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cart.length} Premium Items</p>
                  </div>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-32 space-y-6">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                       <ShoppingBag className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Your bag is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-8 pb-8 border-b border-gray-50 group">
                      <div className="w-32 h-32 bg-gray-50 rounded-[2rem] overflow-hidden shrink-0 relative">
                        <Image src="/images/dog.png" alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="flex items-start justify-between">
                          <h4 className="font-black text-[hsl(var(--secondary))] text-lg tracking-tight leading-tight">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                             <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-0.5 text-xl font-black text-[hsl(var(--primary))]">
                             <IndianRupee className="w-4 h-4" />
                             {item.price}
                           </div>
                           <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <button 
                                onClick={() => updateQty(item.id, -1)}
                                className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                              >
                                 <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black text-sm w-4 text-center">{item.qty}</span>
                              <button 
                                onClick={() => updateQty(item.id, 1)}
                                className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-green-50 hover:text-green-500 transition-all"
                              >
                                 <Plus className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-12 border-t border-gray-100 space-y-8">
                <div className="flex items-center justify-between text-2xl font-black">
                  <span className="text-gray-400 uppercase tracking-widest text-xs">Subtotal</span>
                  <div className="flex items-center gap-1 text-[hsl(var(--secondary))]">
                    <IndianRupee className="w-6 h-6" />
                    {total.toLocaleString('en-IN')}
                  </div>
                </div>
                <Link 
                  href="/checkout" 
                  className="w-full py-6 bg-[hsl(var(--secondary))] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/20 hover:bg-[hsl(var(--primary))] hover:shadow-orange-500/20 transition-all"
                >
                  Confirm Order <ChevronRight className="w-6 h-6" />
                </Link>
                <div className="flex items-center justify-center gap-4 opacity-30 grayscale pointer-events-none">
                   <div className="w-10 h-6 bg-gray-400 rounded"></div>
                   <div className="w-10 h-6 bg-gray-400 rounded"></div>
                   <div className="w-10 h-6 bg-gray-400 rounded"></div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
