"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ShoppingBag, 
  Star, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  ShoppingCart, 
  IndianRupee, 
  Loader2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MessageSquare,
  User,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "Food", "Accessories", "Care & Hygiene", "Toys", "Health"];

const fallbackProducts = [
  { id: 1, name: "Royal Canin Maxi Puppy Kibble", price: 1599, rating: 4.8, reviews: 120, imageUrl: "/images/food.png", category: "Food", description: "Premium dry puppy food.", active: true },
  { id: 2, name: "Premium Retractable Dog Leash (5m)", price: 899, rating: 4.9, reviews: 85, imageUrl: "/images/hero.png", category: "Accessories", description: "Heavy duty retractable leash.", active: true },
  { id: 3, name: "Orthopedic Memory Foam Pet Bed (Large)", price: 3499, rating: 4.7, reviews: 210, imageUrl: "/images/hero.png", category: "Accessories", description: "Joint relief bed for pets.", active: true },
  { id: 4, name: "Organic Aloe Vera Dog Shampoo (500ml)", price: 450, rating: 4.8, reviews: 110, imageUrl: "/images/grooming.png", category: "Care & Hygiene", description: "Hypoallergenic shampoo.", active: true },
  { id: 5, name: "Self-Cleaning Deshedding Grooming Brush", price: 599, rating: 4.6, reviews: 60, imageUrl: "/images/grooming.png", category: "Care & Hygiene", description: "Easy deshedding brush.", active: true },
  { id: 6, name: "Interactive Wobble Treat Dispensing Dog Toy", price: 699, rating: 4.6, reviews: 56, imageUrl: "/images/adoption.png", category: "Toys", description: "Stimulating rubber toy.", active: true }
];

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState(5000);
  const [sortBy, setSortBy] = useState("rating"); // rating, price-low, price-high

  // Cart
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<{id: number, name: string, price: number, qty: number, imageUrl: string}[]>([]);

  // Reviews State
  const [reviewModalProduct, setReviewModalProduct] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [productReviews, setProductReviews] = useState<Record<number, any[]>>({});
  const [reviewStats, setReviewStats] = useState<Record<number, { averageRating: number; totalReviews: number }>>({});
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviewsForProduct = useCallback(async (productId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (data.reviews) {
        setProductReviews(prev => ({ ...prev, [productId]: data.reviews }));
      }
      if (data.averageRating !== undefined) {
        setReviewStats(prev => ({ ...prev, [productId]: { averageRating: data.averageRating, totalReviews: data.totalReviews } }));
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  }, []);

  const openReviewModal = (product: any) => {
    setReviewModalProduct(product);
    setReviewForm({ rating: 5, comment: "" });
    fetchReviewsForProduct(product.id);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalProduct) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${reviewModalProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        fetchReviewsForProduct(reviewModalProduct.id);
        setReviewForm({ rating: 5, comment: "" });
        setReviewModalProduct(null);
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          // Parse decimal prices to float
          const parsed = data.products.map((p: any) => ({
            ...p,
            price: parseFloat(p.price) || 0
          }));
          setProductsList(parsed);
        } else {
          setProductsList(fallbackProducts);
        }
      } catch (err) {
        console.error("Failed to load products, using fallback", err);
        setProductsList(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Load Cart from LocalStorage
    const savedCart = localStorage.getItem("pawstore_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart", e);
      }
    }
  }, []);

    // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem("pawstore_cart", JSON.stringify(cart));
  }, [cart]);

  // Sync Category from URL params if changed
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
    
    const search = searchParams.get("search");
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        qty: 1, 
        imageUrl: product.imageUrl || "/images/food.png"
      }];
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

  // Filter & Sort Products
  const filteredProducts = productsList.filter(prod => {
    const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = prod.price <= priceRange;
    return matchesCategory && matchesSearch && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === "rating") return (b.rating || 4.7) - (a.rating || 4.7);
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0;
  });

  const getWhatsAppCheckoutUrl = () => {
    const phoneNumber = "919876543210"; // standard Indian support number
    let message = `*PawStore Order Details* 🐾\n\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* (Qty: ${item.qty}) - ₹${item.price * item.qty}\n`;
    });
    message += `\n*Total Amount:* ₹${total}\n\nPlease confirm my order!`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="pt-28 pb-24 bg-[#FDFBF7] min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Shop Header Banner */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 px-8 md:px-16 py-16 bg-[hsl(var(--secondary))] rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-6">
            <span className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-orange-500/20">
              PawStore Premium Shop
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tighter">
              Boutique Food & <br /> Care Essentials
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-widest text-[10px] leading-relaxed max-w-md">
              Top veterinary-recommended kibbles, organic grooming shampoos, joint-relief beds, and durable toys delivered straight to your door.
            </p>
            <div className="flex items-center gap-6 pt-2">
               <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                     {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[hsl(var(--secondary))] bg-gray-200 flex items-center justify-center text-[10px] text-gray-700 font-bold">🐶</div>)}
                  </div>
                  <span className="font-black text-[9px] uppercase tracking-widest text-white/80">Trusted by 50k+ Pet Parents</span>
               </div>
            </div>
          </div>
          
          <div className="relative z-10 w-full lg:w-[320px] aspect-square rounded-[2.5rem] overflow-hidden border-8 border-white/5 shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700 shrink-0 bg-[#FBF9F5] flex items-center justify-center">
             <Image src="/images/food.png" alt="Pet Supplies" fill className="object-contain p-6" />
          </div>

          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </div>

        {/* Core Layout: Sidebar Filters + Products Grid */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Sidebar Filter Section */}
          <aside className="w-full lg:w-72 shrink-0 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 h-fit lg:sticky lg:top-28">
             
             {/* Search Bar Widget */}
             <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))]">Search Item</h4>
                <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                   />
                   <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
             </div>

             {/* Categories Section */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))]">
                   <SlidersHorizontal className="w-4 h-4 text-orange-500" /> Categories
                </div>
                <div className="flex flex-wrap lg:flex-col gap-2">
                   {categories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-all ${
                         selectedCategory === cat 
                           ? "bg-orange-500 text-white shadow-md shadow-orange-500/10" 
                           : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                       }`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
             </div>

             {/* Price Filter Widget */}
             <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))]">
                   <span>Max Price</span>
                   <span className="text-orange-500 font-bold">₹{priceRange}</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="50"
                  value={priceRange} 
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
             </div>

             {/* Sorting Widget */}
             <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))]">
                   <ArrowUpDown className="w-4 h-4 text-orange-500" /> Sort By
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold text-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                   <option value="rating">Top Customer Rated</option>
                   <option value="price-low">Price: Low to High</option>
                   <option value="price-high">Price: High to Low</option>
                </select>
             </div>
          </aside>

          {/* Right Product Grid Section */}
          <div className="flex-1 space-y-8">
             
             {/* Shop Filter Status & Cart Trigger */}
             <div className="flex items-center justify-between gap-4 bg-white px-6 py-4 rounded-[2rem] border border-gray-100 shadow-sm flex-wrap sm:flex-nowrap">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                   Showing <span className="text-[hsl(var(--secondary))]">{filteredProducts.length}</span> Premium Items
                </div>

                <button 
                  onClick={() => setCartOpen(true)}
                  className="group relative flex items-center gap-4 pl-6 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all shrink-0"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--secondary))]">My Bag</span>
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-gray-600">
                    <ShoppingCart className="w-4.5 h-4.5" />
                  </div>
                  {cart.length > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      {cart.reduce((s, i) => s + i.qty, 0)}
                    </div>
                  )}
                </button>
             </div>

             {/* Products Grid */}
             {loading ? (
                <div className="flex items-center justify-center py-40">
                   <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                </div>
             ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm space-y-4">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-3xl">📦</div>
                   <h3 className="text-lg font-black text-[hsl(var(--secondary))] tracking-tight">No Products Match Filters</h3>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Try adjusting search filters or categories.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                      className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image aspect-ratio box */}
                        <div className="relative aspect-square bg-[#FBF9F5] rounded-[2rem] overflow-hidden mb-6 flex items-center justify-center">
                           {product.imageUrl ? (
                             <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4 transition-transform duration-700 group-hover:scale-108" />
                           ) : (
                             <div className="text-4xl">📦</div>
                           )}
                           <div className="absolute top-4 left-4">
                             <span className="px-3.5 py-1.5 bg-white/80 backdrop-blur-md rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest shadow-sm border border-white/50">{product.category}</span>
                           </div>
                        </div>

                        {/* Ratings & Title */}
                        <div className="space-y-2">
                           <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.round(reviewStats[product.id]?.averageRating || product.rating || 4.7) ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                              ))}
                              <span className="text-[9px] font-black text-gray-300 ml-2 tracking-widest uppercase">{reviewStats[product.id]?.totalReviews || product.reviews || 80} Reviews</span>
                           </div>
                           <h3 className="text-lg font-black text-[hsl(var(--secondary))] tracking-tight group-hover:text-orange-500 transition-colors line-clamp-2 h-12 leading-tight">{product.name}</h3>
                           <p className="text-gray-400 text-xs font-bold leading-relaxed line-clamp-2">{product.description || "Premium veterinary care product."}</p>
                        </div>

                        {/* Recent Reviews */}
                        {productReviews[product.id] && productReviews[product.id].length > 0 && (
                          <div className="mt-4 space-y-2 pt-4 border-t border-gray-50">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Recent Reviews</p>
                            {productReviews[product.id].slice(0, 3).map((review: any) => (
                              <div key={review.id} className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                                    ))}
                                  </div>
                                  <span className="text-[8px] font-bold text-gray-300">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-[9px] font-bold text-gray-500">{review.userName || "Anonymous"}</span>
                                </div>
                                {review.comment && (
                                  <p className="text-[10px] font-medium text-gray-500 line-clamp-2">{review.comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Price, Add to Cart & Write Review */}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-6">
                        <div className="flex items-center gap-0.5 text-2xl font-black text-[hsl(var(--secondary))]">
                          <IndianRupee className="w-4 h-4" />
                          {product.price}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openReviewModal(product)}
                            className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-500 transition-all cursor-pointer"
                            title="Write a Review"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => addToCart(product)}
                            className="w-12 h-12 bg-[hsl(var(--secondary))] text-white rounded-xl flex items-center justify-center hover:bg-orange-500 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewModalProduct(null)}
              className="fixed inset-0 bg-[hsl(var(--secondary))]/20 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight">Write a Review</h3>
                  <button onClick={() => setReviewModalProduct(null)} className="p-2 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm font-bold text-gray-500 mb-6 line-clamp-1">{reviewModalProduct.name}</p>

                <form onSubmit={submitReview} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="transition-all hover:scale-110"
                        >
                          <Star className={`w-8 h-8 ${star <= reviewForm.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comment (optional)</label>
                    <textarea
                      rows={4}
                      placeholder="Share your experience with this product..."
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium resize-none"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewModalProduct(null)}
                      className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={submittingReview}
                      className="flex-1 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Review</>}
                    </button>
                  </div>
                </form>

                {/* Existing Reviews in Modal */}
                {productReviews[reviewModalProduct.id] && productReviews[reviewModalProduct.id].length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      All Reviews ({productReviews[reviewModalProduct.id].length})
                    </p>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {productReviews[reviewModalProduct.id].map((review: any) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-bold text-gray-500">{review.userName || "Anonymous"}</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-300">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-xs font-medium text-gray-500">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sidebar Panel */}
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
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl p-8 flex flex-col rounded-l-[3rem]"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">Shopping Bag</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cart.length} Premium Items</p>
                  </div>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-3 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Products Scroll */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-24 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-2xl">🛍️</div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Your bag is currently empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-50 group items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-[hsl(var(--secondary))] text-sm tracking-tight leading-tight line-clamp-1">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                             <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-0.5 text-base font-black text-orange-500">
                             <IndianRupee className="w-3.5 h-3.5" />
                             {item.price}
                           </div>
                           <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                              <button 
                                onClick={() => updateQty(item.id, -1)}
                                className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                              >
                                 <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-xs w-4 text-center">{item.qty}</span>
                              <button 
                                onClick={() => updateQty(item.id, 1)}
                                className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center hover:bg-green-50 hover:text-green-500 transition-all cursor-pointer"
                              >
                                 <Plus className="w-3 h-3" />
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Controls */}
              <div className="pt-8 border-t border-gray-100 space-y-4 mt-6">
                <div className="flex items-center justify-between text-xl font-black">
                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                  <div className="flex items-center gap-0.5 text-[hsl(var(--secondary))]">
                    <IndianRupee className="w-5 h-5" />
                    {total.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <Link 
                     href="/checkout" 
                     className="w-full py-4.5 bg-[hsl(var(--secondary))] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-orange-500 transition-all"
                   >
                     Confirm Order <ChevronRight className="w-4.5 h-4.5" />
                   </Link>

                   {cart.length > 0 && (
                     <a 
                       href={getWhatsAppCheckoutUrl()}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full py-4.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-md transition-all"
                     >
                       Order via WhatsApp 💬
                     </a>
                   )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="pt-40 text-center font-bold text-gray-400 uppercase tracking-widest text-xs">Loading PawStore...</div>}>
      <ShopContent />
    </Suspense>
  );
}
