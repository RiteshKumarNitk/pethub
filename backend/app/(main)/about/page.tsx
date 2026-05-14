"use client";

import Image from "next/image";
import { Heart, ShieldCheck, Users, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-6">
        {/* About Hero */}
        <div className="max-w-4xl mx-auto text-center mb-24">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full mb-8 font-extrabold text-xs uppercase tracking-[0.2em]"
           >
              <Heart className="w-4 h-4" /> Our Mission
           </motion.div>
           <h1 className="text-5xl md:text-7xl font-black text-[hsl(var(--secondary))] mb-8 leading-tight">
             Revolutionizing Pet Care in <span className="text-[hsl(var(--primary))]">India</span>
           </h1>
           <p className="text-xl text-gray-500 font-medium leading-relaxed">
             PetHub was born out of a simple idea: every pet deserves a happy home and professional care. 
             We are building India's largest trusted ecosystem for pet parents, shelters, and service providers.
           </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
           {[
             { label: "Pets Adopted", value: "2,500+" },
             { label: "Verified Shelters", value: "150+" },
             { label: "Care Experts", value: "400+" },
             { label: "Happy Parents", value: "10k+" },
           ].map((stat, i) => (
             <div key={i} className="text-center p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                <p className="text-4xl font-black text-[hsl(var(--secondary))] mb-2">{stat.value}</p>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
             </div>
           ))}
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
           {[
             { title: "Trust & Safety", desc: "Every listing and service provider is manually verified by our team.", icon: ShieldCheck },
             { title: "Community First", desc: "We support shelters and independent rescuers with zero listing fees.", icon: Users },
             { title: "Instant Access", desc: "Book services or find products with a seamless, mobile-first experience.", icon: Zap },
           ].map((val, i) => (
             <div key={i} className="space-y-6">
                <div className="w-16 h-16 bg-[hsl(var(--secondary))] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/10">
                   <val.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[hsl(var(--secondary))]">{val.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{val.desc}</p>
             </div>
           ))}
        </div>

        {/* Team / Story Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center p-16 bg-[hsl(var(--secondary))] rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
           <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-8">Building the Future of Pet Ownership</h2>
              <div className="space-y-6 mb-12">
                 {[
                   "Secure OTP-based identity verification",
                   "Verified adoption marketplace across 20+ cities",
                   "Seamless Razorpay-integrated pet shop",
                   "Real-time booking with localized care experts"
                 ].map((point, i) => (
                   <div key={i} className="flex items-center gap-4">
                      <CheckCircle2 className="w-6 h-6 text-[hsl(var(--primary))]" />
                      <p className="font-bold tracking-tight">{point}</p>
                   </div>
                 ))}
              </div>
              <button className="btn-primary">Learn More About Us</button>
           </div>
           <div className="relative h-[500px] rounded-[3rem] overflow-hidden border-8 border-white/10 z-10">
              <Image src="/images/hero.png" alt="Happy Pets" fill className="object-cover" />
           </div>
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--primary))]/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
        </div>
      </div>
    </div>
  );
}
