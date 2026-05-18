"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // We'll create a single stats API for efficiency
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Products", value: stats?.totalProducts || "0", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Orders", value: stats?.totalOrders || "0", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Registered Users", value: stats?.totalUsers || "0", icon: Users, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-12 relative">
      {loading && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--primary))]" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-5xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tighter">Command Center</h1>
            <div className="flex items-center gap-3">
               <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">System Status: Operational</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-50 shadow-sm">
            <button className="px-6 py-3 bg-gray-50 text-[hsl(var(--secondary))] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Export Report</button>
            <button className="px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">New Listing</button>
         </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 bg-white rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all group"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
               <div className="flex items-center justify-between">
                  <p className="text-4xl font-black text-[hsl(var(--secondary))]">{stat.value}</p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Performance "Chart" Simulation */}
        <div className="bg-white rounded-[3.5rem] p-12 border border-gray-50 shadow-sm">
           <div className="flex items-center justify-between mb-12">
              <div>
                 <h3 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">Platform Overview</h3>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Sales & Orders Monitor</p>
              </div>
           </div>
           
           <div className="flex items-end justify-between gap-4 h-64 px-4">
              {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                   <div className="w-full relative">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }}
                        className="w-full bg-gradient-to-t from-orange-500/10 to-orange-500 rounded-2xl group-hover:to-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                      ></motion.div>
                   </div>
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Day {i+1}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Integration Status & System Heartbeat */}
        <div className="bg-[hsl(var(--secondary))] rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
           <h3 className="text-xl font-bold mb-8 italic flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              System Health
           </h3>
           <div className="space-y-4">
              {[
                { label: "Postgres Cluster", status: "Nominal", color: "text-green-400" },
                { label: "Cloudinary Assets", status: "Live", color: "text-green-400" },
                { label: "Auth Middleware", status: "Secure", color: "text-green-400" },
                { label: "Razorpay API", status: "Online", color: "text-green-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                   <span className="text-[11px] font-bold text-white/70 tracking-tight">{item.label}</span>
                   <span className={`text-[9px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                </div>
              ))}
           </div>
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
