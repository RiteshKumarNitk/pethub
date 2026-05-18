"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Package, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch("/api/mobile/me"),
          fetch("/api/orders")
        ]);
        const meJson = await meRes.json();
        const ordersJson = await ordersRes.json();
        if (meJson.authenticated) {
          setData(meJson);
        }
        if (ordersJson.orders) {
          setOrders(ordersJson.orders);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-3 tracking-tight">
            Hello, {data?.user?.name || 'Pet Parent'}! 👋
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            Track your orders and manage your PawStore account
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Completed", value: orders.filter((o: any) => o.status === "completed").length.toString(), icon: Package, color: "text-green-500", bg: "bg-green-50" },
          { label: "Pending", value: orders.filter((o: any) => o.status === "pending").length.toString(), icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
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

      <div className="bg-white rounded-[3.5rem] p-10 border border-gray-50 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-[hsl(var(--secondary))] uppercase tracking-tighter">Recent Orders</h3>
          <Link href="/shop" className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
            Shop Now <Package className="w-4 h-4" />
          </Link>
        </div>
        
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-bold text-gray-400">No orders yet.</p>
            <Link href="/shop" className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest hover:underline px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-black text-[hsl(var(--secondary))]">Order #{order.id}</p>
                  <p className="text-xs text-gray-400 font-bold">₹{order.total} - {order.status}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.status === "completed" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
