"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Heart,
  Share2,
  CheckCircle2,
  Calendar,
  MessageCircle,
  IndianRupee,
  Loader2,
  Send,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PetDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("about");
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const res = await fetch(`/api/listings/${params.id}`);
        const data = await res.json();
        if (data.listing) {
          setPet(data.listing);
        }
      } catch (err) {
        console.error("Failed to fetch pet details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [params.id]);

  const handleInterest = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/adoption/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: params.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else if (data.error === "Unauthorized") {
        window.location.href = "/login?redirect=/marketplace/" + params.id;
      }
    } catch (err) {
      console.error("Interest submission failed", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-black text-[hsl(var(--secondary))]">Pet Not Found</h2>
        <Link href="/marketplace" className="btn-primary">Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-white">
      <div className="container mx-auto px-6">
        <Link 
          href="/marketplace" 
          className="inline-flex items-center gap-3 text-gray-400 hover:text-[hsl(var(--primary))] font-black text-xs uppercase tracking-widest mb-12 transition-all group"
        >
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/10 group-hover:text-[hsl(var(--primary))] transition-all">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left Column: Gallery */}
          <div className="space-y-10">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="relative h-[650px] rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white"
            >
              <Image 
                src={pet.images?.[0] || "/images/hero.png"} 
                alt={pet.breed} 
                fill 
                className="object-cover" 
              />
              <div className="absolute top-10 left-10">
                 <div className="glass-morphism px-6 py-2.5 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--secondary))]">Verified Profile</span>
                 </div>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-4 gap-6">
               {(pet.images || ["/images/dog.png"]).map((img: string, i: number) => (
                 <div key={i} className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-gray-50 cursor-pointer hover:border-[hsl(var(--primary))] transition-all">
                    <Image src={img} alt="Gallery" fill className="object-cover" />
                 </div>
               ))}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col">
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <span className="px-5 py-2 bg-orange-50 text-[hsl(var(--primary))] rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                  {pet.breed}
                </span>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">India</span>
                </div>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-[hsl(var(--secondary))] mb-6 tracking-tighter leading-tight">
                {pet.breed}
              </h1>
              <div className="flex items-center gap-3">
                 {pet.showPrice ? (
                   <>
                     <IndianRupee className="w-8 h-8 text-[hsl(var(--primary))]" />
                     <span className="text-6xl font-black text-[hsl(var(--primary))] tracking-tighter">{pet.price}</span>
                   </>
                 ) : (
                   <span className="text-2xl font-black text-gray-400 uppercase tracking-widest">Available for Adoption</span>
                 )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mb-12">
               {[
                 { icon: Clock, label: "Age", value: `${pet.ageMonths}m` },
                 { icon: Heart, label: "Vaccinated", value: "Fully" },
                 { icon: ShieldCheck, label: "Health", value: "Verified" },
               ].map((stat, i) => (
                 <div key={i} className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center gap-3 text-center">
                    <stat.icon className="w-7 h-7 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-sm font-black text-[hsl(var(--secondary))]">{stat.value}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* Content Tabs */}
            <div className="flex-1 space-y-8">
              <p className="text-xl text-gray-400 font-bold leading-relaxed">
                {pet.description || "A wonderful companion looking for a loving home in India. This pet is verified by our team and healthy."}
              </p>
              
              <div className="p-8 bg-blue-50 rounded-[3rem] border border-blue-100 flex items-start gap-6">
                 <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="font-black text-blue-900 uppercase tracking-widest text-xs">Pethub Verified</h4>
                    <p className="text-sm font-bold text-blue-800/60 leading-relaxed">This listing has been verified by our platform admins. We facilitate the entire connection to ensure safety.</p>
                 </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="pt-12 mt-12 border-t border-gray-100">
               {sent ? (
                 <div className="p-8 bg-green-50 rounded-[3rem] border border-green-100 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-green-900">Interest Received!</h3>
                    <p className="text-green-800/60 font-bold text-sm uppercase tracking-widest">Our admin will call you within 24 hours to verify and connect you with the owner.</p>
                 </div>
               ) : (
                 <div className="flex gap-4">
                   <button 
                     onClick={handleInterest}
                     disabled={sending}
                     className="flex-1 btn-primary py-6 text-xl font-black flex items-center justify-center gap-4 shadow-2xl shadow-orange-500/20 disabled:opacity-50"
                   >
                     {sending ? (
                       <Loader2 className="w-6 h-6 animate-spin" />
                     ) : (
                       <>I'm Interested <Send className="w-6 h-6" /></>
                     )}
                   </button>
                   <button className="w-20 h-24 bg-gray-50 flex items-center justify-center rounded-[2rem] text-gray-300 hover:text-[hsl(var(--primary))] hover:bg-orange-50 transition-all">
                      <Share2 className="w-7 h-7" />
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
