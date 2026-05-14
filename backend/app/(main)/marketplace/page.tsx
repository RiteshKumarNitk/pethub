"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, MapPin, Heart, ChevronRight, Loader2, AlertCircle, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "Dogs", "Cats", "Birds", "Others"];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      if (data.listings) {
        // Public view only shows approved listings
        setListings(data.listings.filter((l: any) => l.isApproved === "true"));
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l => 
    l.breed?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-28 pb-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-black text-[hsl(var(--secondary))] mb-6 tracking-tight leading-tight">
              Adopt A <span className="text-[hsl(var(--primary))]">Partner</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs leading-relaxed">
              Verified pet listings from trusted shelters. <br /> Our admin team verifies every detail for a safe experience.
            </p>
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-4">
             <div className="relative flex-1 md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search breeds..." 
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:border-[hsl(var(--primary))] focus:ring-8 focus:ring-orange-500/5 transition-all outline-none font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <button className="p-5 bg-[hsl(var(--secondary))] text-white rounded-[2rem] shadow-xl shadow-blue-900/10 hover:scale-105 transition-transform">
                <Filter className="w-7 h-7" />
             </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-4 mb-16 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? "bg-[hsl(var(--primary))] text-white shadow-xl shadow-orange-500/20" 
                  : "bg-gray-50 text-gray-400 hover:text-[hsl(var(--secondary))] border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="relative min-h-[400px]">
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-[3.5rem] h-[550px] animate-pulse"></div>
                ))}
             </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {filteredListings.map((listing, idx) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-3xl hover:shadow-orange-500/5 transition-all flex flex-col"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image 
                      src={listing.images?.[0] || "/images/hero.png"} 
                      alt={listing.breed} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute top-6 right-6">
                      <button className="w-12 h-12 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-sm">
                        <Heart className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <div className="glass-morphism px-4 py-2 rounded-2xl flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-black text-[hsl(var(--secondary))] uppercase tracking-widest">India</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">{listing.breed}</h3>
                      <div className="flex items-center gap-1 text-[hsl(var(--primary))] font-black text-2xl tracking-tighter">
                        {listing.showPrice ? (
                          <>
                            <IndianRupee className="w-5 h-5 mb-0.5" />
                            {listing.price}
                          </>
                        ) : (
                          <span className="text-sm uppercase tracking-widest text-gray-300">Adopt</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-10">
                      <span className="px-4 py-1.5 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-xl border border-gray-100">
                        {listing.ageMonths} Months Old
                      </span>
                    </div>

                    <div className="mt-auto">
                      <Link 
                        href={`/marketplace/${listing.id}`}
                        className="flex items-center justify-center gap-3 w-full py-5 bg-[hsl(var(--secondary))] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-[hsl(var(--primary))] transition-all shadow-xl shadow-blue-900/5 active:scale-95"
                      >
                        Profile <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center space-y-8">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-12 h-12 text-gray-200" />
               </div>
               <div className="space-y-2">
                  <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No pets found</p>
                  <p className="text-gray-300 text-xs">Be the first to list a pet for adoption today.</p>
               </div>
               <Link href="/dashboard/listings/add" className="inline-flex btn-primary !px-12">Submit Listing</Link>
            </div>
          )}
        </div>

        {/* Informational Footer */}
        <div className="mt-32 p-20 bg-gray-50 rounded-[4rem] text-center space-y-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] -ml-32 -mt-32"></div>
           <h2 className="text-4xl font-black text-[hsl(var(--secondary))] tracking-tight">Our Verification Process</h2>
           <p className="text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed">
             Every pet listed on PetHub goes through a strict verification process. Once you show interest, an admin will personally call you and the owner to verify all details before connecting you.
           </p>
           <div className="flex flex-wrap items-center justify-center gap-12 pt-8">
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">1</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Apply</span>
              </div>
              <div className="w-12 h-px bg-gray-200 hidden md:block"></div>
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">2</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Call</span>
              </div>
              <div className="w-12 h-px bg-gray-200 hidden md:block"></div>
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 bg-[hsl(var(--primary))] text-white rounded-3xl flex items-center justify-center shadow-sm">3</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Meet Pet</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
