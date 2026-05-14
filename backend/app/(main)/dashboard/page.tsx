"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Dog, 
  ShoppingBag, 
  Calendar, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/mobile/me");
        const json = await res.json();
        if (json.authenticated) {
          setData(json);
        }
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-3 tracking-tight">
            Hello, {data?.user?.name || 'Pet Parent'}! 👋
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            Here's what's happening with your family today
          </p>
        </div>
        <Link 
          href="/dashboard/listings/add" 
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[hsl(var(--primary))] text-white rounded-[1.5rem] shadow-xl shadow-orange-500/20 font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> List Pet for Adoption
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "My Registered Pets", value: data?.stats?.pets || "0", icon: Dog, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Active Listings", value: data?.stats?.listings || "0", icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Upcoming Bookings", value: "0", icon: Calendar, color: "text-green-500", bg: "bg-green-50" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 bg-white rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 leading-none">{stat.label}</p>
            <p className="text-5xl font-black text-[hsl(var(--secondary))]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-[3.5rem] p-10 border border-gray-50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-[hsl(var(--secondary))] uppercase tracking-tighter">Next Care Session</h3>
            <Link href="/dashboard/bookings" className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
               All Appointments <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-center space-y-4">
             <Calendar className="w-12 h-12 text-gray-200" />
             <p className="text-sm font-bold text-gray-400">No appointments scheduled for this week.</p>
             <Link href="/services" className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest hover:underline px-4 py-2 bg-white rounded-full">Book Service</Link>
          </div>
        </div>

        {/* Quick Tips or Featured Product */}
        <div className="bg-[hsl(var(--secondary))] rounded-[3.5rem] p-12 text-white relative overflow-hidden flex flex-col justify-center">
           <div className="relative z-10 max-w-[70%] space-y-6">
              <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10">Pet Care Insight</span>
              <h3 className="text-3xl font-black leading-tight">Does your pet need <br /> a regular checkup?</h3>
              <p className="text-white/50 text-sm font-bold leading-relaxed uppercase tracking-wide">
                Preventative care is the best way to ensure a long, healthy life for your furry friends. Explore our partner clinics.
              </p>
              <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/20 hover:-translate-y-1 transition-all">
                Find Vets <ArrowUpRight className="w-4 h-4" />
              </Link>
           </div>
           <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-30 select-none pointer-events-none">
              <Image src="/images/dog.png" alt="dog" fill className="object-cover scale-110 origin-bottom-right" />
           </div>
           
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>
      </div>
    </div>
  );
}
