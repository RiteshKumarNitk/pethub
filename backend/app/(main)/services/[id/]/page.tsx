"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  MapPin, 
  Star, 
  Phone, 
  CheckCircle2, 
  Scissors, 
  Clock,
  Calendar,
  ShieldCheck,
  MessageCircle,
  IndianRupee
} from "lucide-react";
import { motion } from "framer-motion";

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const service = {
    title: "Expert Pet Grooming",
    price: "850",
    rating: "4.9",
    reviews: "128",
    description: "Treat your pet to a luxurious spa day! Our expert groomers provide a full range of services including haircuts, deep cleaning baths, nail trimming, and ear cleaning. We use premium pet-safe organic shampoos and ensure a stress-free environment.",
    includes: [
      "Full Body Haircut & Styling",
      "Deep Cleansing Organic Bath",
      "Nail Clipping & Filing",
      "Ear & Eye Cleaning",
      "Scented Finishing Spray"
    ],
    duration: "90 - 120 mins",
    location: "Available in Mumbai, Delhi & Bangalore",
    image: "/images/grooming.png"
  };

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-6">
        <Link 
          href="/services" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[hsl(var(--primary))] font-bold text-sm mb-12 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
           {/* Left: Image / Showcase */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="sticky top-32"
           >
              <div className="relative h-[500px] rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white group">
                 <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute top-8 left-8 flex gap-3">
                    <div className="glass-morphism px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))]">Professional</div>
                    <div className="glass-morphism px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-orange-600">Best Seller</div>
                 </div>
              </div>
              <div className="mt-8 p-8 bg-white rounded-[2.5rem] border border-gray-50 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                       <Star className="w-5 h-5 fill-yellow-500" />
                       <span className="text-lg font-black">{service.rating}</span>
                    </div>
                    <span className="text-gray-400 font-bold text-sm">({service.reviews} Reviews)</span>
                 </div>
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                         <Image src="/images/dog.png" alt="user" width={40} height={40} className="object-cover" />
                      </div>
                    ))}
                 </div>
              </div>
           </motion.div>

           {/* Right: Info / Booking */}
           <div className="space-y-10">
              <div>
                 <div className="flex items-center gap-2 text-orange-500 font-extrabold text-xs uppercase tracking-[0.2em] mb-4">
                    <Scissors className="w-4 h-4" /> Grooming & Spa
                 </div>
                 <h1 className="text-5xl font-black text-[hsl(var(--secondary))] mb-6">{service.title}</h1>
                 <div className="flex items-center gap-2">
                    <IndianRupee className="w-8 h-8 text-[hsl(var(--primary))]" />
                    <span className="text-5xl font-black text-[hsl(var(--primary))] tracking-tighter">{service.price}</span>
                    <span className="text-gray-400 font-bold text-sm ml-2">/ per pet</span>
                 </div>
              </div>

              <div className="bg-gray-50 rounded-[2.5rem] p-10 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                       <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Typical Duration</p>
                       <p className="font-bold text-[hsl(var(--secondary))]">{service.duration}</p>
                    </div>
                 </div>
                 <p className="text-lg text-gray-500 font-medium leading-relaxed">{service.description}</p>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-bold text-[hsl(var(--secondary))]">What's included</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.includes.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-green-500" />
                         <span className="text-sm font-bold text-gray-600">{item}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-10 border-t border-gray-100 flex gap-4">
                 <button className="flex-1 btn-primary py-5 text-lg font-black flex items-center justify-center gap-3">
                    Book Appointment <Calendar className="w-6 h-6" />
                 </button>
                 <button className="px-8 bg-gray-50 text-[hsl(var(--secondary))] rounded-[2rem] hover:bg-gray-100 transition-colors">
                    <MessageCircle className="w-7 h-7" />
                 </button>
              </div>

              <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex items-center gap-4">
                 <ShieldCheck className="w-8 h-8 text-blue-500" />
                 <div>
                    <h4 className="font-bold text-[hsl(var(--secondary))] leading-tight">Professional Guarantee</h4>
                    <p className="text-xs text-gray-400 font-medium">All our partners are vetted and follow strict hygiene protocols.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
