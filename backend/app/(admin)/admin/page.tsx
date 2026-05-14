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
  Loader2
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
    { label: "Total Listings", value: stats?.totalListings || "0", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Approval", value: stats?.pendingListings || "0", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Registered Users", value: stats?.totalUsers || "0", icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Bookings", value: stats?.totalBookings || "0", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-12 relative">
      {loading && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--primary))]" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2">Overview</h1>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Platform Status: {stats ? 'Live' : 'Fetching...'}</p>
         </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 bg-white rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
               <p className="text-4xl font-black text-[hsl(var(--secondary))]">{stat.value}</p>
               <div className="text-green-500 flex items-center text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                  Stable
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Actions */}
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 border border-gray-50 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-[hsl(var(--secondary))]">Quick Actions</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/listings" className="p-8 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-[hsl(var(--primary))] transition-all group">
                 <ShoppingBag className="w-8 h-8 text-orange-500 mb-4" />
                 <h4 className="font-black text-[hsl(var(--secondary))] mb-1">Moderate Listings</h4>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Approve pets for adoption</p>
              </Link>
              <Link href="/admin/users" className="p-8 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-[hsl(var(--primary))] transition-all group">
                 <Users className="w-8 h-8 text-blue-500 mb-4" />
                 <h4 className="font-black text-[hsl(var(--secondary))] mb-1">User Directory</h4>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage platform members</p>
              </Link>
           </div>
        </div>

        {/* Integration Status */}
        <div className="bg-[hsl(var(--secondary))] rounded-[3.5rem] p-10 text-white relative overflow-hidden">
           <h3 className="text-xl font-bold mb-8 italic">System Heartbeat</h3>
           <div className="space-y-4">
              {[
                { label: "Postgres", status: "Live", color: "text-green-400" },
                { label: "Edge Middleware", status: "Active", color: "text-green-400" },
                { label: "Admin Auth", status: "Secure", color: "text-green-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                   <span className="text-xs font-bold text-white/70 tracking-tight">{item.label}</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                </div>
              ))}
           </div>
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[hsl(var(--primary))]/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
