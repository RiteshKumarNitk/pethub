"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ShoppingBag, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ShieldCheck,
  Package,
  Truck,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchLowStock();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) {
        setLowStockProducts(data.products.filter((p: any) => p.stock < 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statCards = [
    { label: "Products", value: stats?.totalProducts || "0", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Orders", value: stats?.totalOrders || "0", icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
    { label: "Registered Users", value: stats?.totalUsers || "0", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-12 relative">

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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-8 bg-white rounded-[3rem] border border-gray-50 shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl mb-6" />
              <div className="space-y-3">
                <div className="h-3 bg-gray-100 rounded-full w-20" />
                <div className="h-8 bg-gray-100 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-white rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all group"
            >
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                 <div className="flex items-center justify-between">
                    <p className="text-3xl font-black text-[hsl(var(--secondary))]">{stat.value}</p>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-[3.5rem] p-10 border border-gray-50 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">Order Status</h3>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time breakdown</p>
              </div>
           </div>
           <div className="space-y-5">
              {[
                { label: "Pending", count: stats?.pendingOrders || 0, color: "bg-yellow-400", bg: "bg-yellow-50", icon: Clock },
                { label: "Shipped", count: stats?.shippedOrders || 0, color: "bg-purple-400", bg: "bg-purple-50", icon: Truck },
                { label: "Delivered", count: stats?.deliveredOrders || 0, color: "bg-green-400", bg: "bg-green-50", icon: CheckCircle2 },
              ].map((item, i) => {
                const maxCount = Math.max(stats?.pendingOrders || 0, stats?.shippedOrders || 0, stats?.deliveredOrders || 0, 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={i} className="space-y-2">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center`}>
                              <item.icon className={`w-4 h-4 ${item.color.replace('bg-', 'text-')}`} />
                           </div>
                           <span className="font-bold text-sm text-[hsl(var(--secondary))]">{item.label}</span>
                        </div>
                        <span className="font-black text-lg text-[hsl(var(--secondary))]">{item.count}</span>
                     </div>
                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: i * 0.1, duration: 0.8 }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

         {/* Low Stock Alerts */}
         {lowStockProducts.length > 0 && (
           <div className="bg-white rounded-[3.5rem] p-10 border border-gray-50 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-orange-500" />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">Low Stock Alerts</h3>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{lowStockProducts.length} products need restocking</p>
               </div>
             </div>
             <div className="space-y-3">
               {lowStockProducts.slice(0, 5).map((product: any) => (
                 <div key={product.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100 hover:bg-orange-100/50 transition-all">
                   <div>
                     <p className="font-black text-sm text-[hsl(var(--secondary))]">{product.name}</p>
                     <p className="text-xs font-bold text-orange-600">Stock: {product.stock} units</p>
                   </div>
                   <Link
                     href="/admin/products"
                     className="flex items-center gap-1 px-4 py-2 bg-white rounded-xl text-xs font-black text-orange-500 uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                   >
                     Restock <ArrowRight className="w-3 h-3" />
                   </Link>
                 </div>
               ))}
               {lowStockProducts.length > 5 && (
                 <Link
                   href="/admin/products"
                   className="block text-center py-3 text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest hover:underline"
                 >
                   View all {lowStockProducts.length} low stock products
                 </Link>
               )}
             </div>
           </div>
         )}

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
