"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  Loader2,
  Phone,
  Tag,
  Search,
  IndianRupee
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AddListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    breed: "",
    ageMonths: "",
    price: "",
    contactPhone: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/marketplace"), 2000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Link 
        href="/marketplace" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-[hsl(var(--primary))] font-bold text-sm mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="bg-white rounded-[3.5rem] p-12 border border-gray-50 shadow-sm relative overflow-hidden">
        <AnimatePresence>
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-orange-50 text-[hsl(var(--primary))] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-[hsl(var(--secondary))] mb-2">Listing Submitted!</h2>
              <p className="text-gray-500 font-medium">Your listing will be live once approved by our team.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-[hsl(var(--secondary))]">Create a Listing</h1>
                  <p className="text-gray-500 font-medium tracking-tight">Help your pet find its next loving family.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pet Photo</label>
                   <div className="h-full min-h-[300px] border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center bg-gray-50 hover:bg-orange-50 hover:border-[hsl(var(--primary))] transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-gray-300 group-hover:text-[hsl(var(--primary))]" />
                      </div>
                      <p className="text-sm font-bold text-gray-400 group-hover:text-[hsl(var(--primary))]">Upload high-quality images</p>
                      <p className="text-[10px] text-gray-300 mt-1 uppercase font-black">JPG, PNG up to 5MB</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Breed / Type</label>
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                         <input 
                           required
                           type="text" 
                           placeholder="e.g. Beagle Puppy"
                           className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold"
                           value={formData.breed}
                           onChange={(e) => setFormData({...formData, breed: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Age (Months)</label>
                         <input 
                           required
                           type="number" 
                           placeholder="e.g. 3"
                           className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold"
                           value={formData.ageMonths}
                           onChange={(e) => setFormData({...formData, ageMonths: e.target.value})}
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Price (₹)</label>
                         <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                            <input 
                              required
                              type="number" 
                              placeholder="0"
                              className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                      <div className="relative">
                         <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                         <input 
                           required
                           type="tel" 
                           placeholder="+91"
                           className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold"
                           value={formData.contactPhone}
                           onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 text-gray-400">Detailed Description</label>
                 <div className="relative">
                    <Tag className="absolute left-4 top-6 text-gray-300 w-5 h-5" />
                    <textarea 
                      required
                      placeholder="Describe the pet's temperament, health, and what kind of home you're looking for..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[2.5rem] border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-medium h-48"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                 </div>
              </div>

              <button 
                disabled={loading}
                className="w-full btn-primary py-6 text-xl font-black flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-orange-500/30"
              >
                {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                  <>Create Listing <ShoppingBag className="w-6 h-6" /></>
                )}
              </button>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
