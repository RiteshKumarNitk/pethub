"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Package, Clock, Loader2, IndianRupee, Heart, ChevronRight, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-blue-400",
  processing: "bg-indigo-400",
  shipped: "bg-purple-400",
  delivered: "bg-green-400",
  cancelled: "bg-red-400",
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "tracking">("orders");
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch("/api/mobile/me"),
          fetch("/api/orders"),
        ]);
        const meJson = await meRes.json();
        const ordersJson = await ordersRes.json();
        if (meJson.authenticated) setData(meJson);
        if (ordersJson.orders) setOrders(ordersJson.orders);

        const savedWishlist = localStorage.getItem("pawstore_wishlist");
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCurrentStatusIndex = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.indexOf(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  const completedOrders = orders.filter((o: any) => o.status === "delivered" || o.status === "completed");
  const pendingOrdersList = orders.filter((o: any) => o.status !== "delivered" && o.status !== "completed" && o.status !== "cancelled");

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-3 tracking-tight">
          Hello, {data?.user?.name || "Pet Parent"}! 👋
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Manage your orders and wishlist
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Active Orders", value: pendingOrdersList.length.toString(), icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Delivered", value: completedOrders.length.toString(), icon: Package, color: "text-green-500", bg: "bg-green-50" },
          { label: "Wishlist", value: wishlist.length.toString(), icon: Heart, color: "text-red-500", bg: "bg-red-50" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-5 group-hover:rotate-12 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-[hsl(var(--secondary))]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-50 shadow-sm w-fit">
        {[
          { id: "orders", label: "Order History" },
          { id: "tracking", label: "Track Orders" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-[hsl(var(--primary))] text-white shadow-md"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-[hsl(var(--secondary))] uppercase tracking-tighter">All Orders</h3>
            <Link href="/shop" className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              Shop Now <ChevronRight className="w-4 h-4" />
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
              {orders.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    setTrackingOrder(order);
                    setActiveTab("tracking");
                  }}
                >
                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        order.status === "delivered" || order.status === "completed"
                          ? "bg-green-50 text-green-600"
                          : order.status === "cancelled"
                          ? "bg-red-50 text-red-500"
                          : "bg-orange-50 text-orange-600"
                      }`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-[hsl(var(--secondary))]">Order #{order.id}</p>
                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            order.status === "delivered" || order.status === "completed"
                              ? "bg-green-50 text-green-600"
                              : order.status === "cancelled"
                              ? "bg-red-50 text-red-500"
                              : "bg-orange-50 text-orange-600"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {parseFloat(order.total).toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString("en-IN")}
                          </p>
                          {order.items && (
                            <p className="text-xs text-gray-400 font-bold">{order.items.length} item(s)</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === "tracking" && (
        <div className="space-y-6">
          {!trackingOrder && pendingOrdersList.length === 0 && (
            <div className="bg-white rounded-[3rem] p-16 border border-gray-50 shadow-sm text-center space-y-4">
              <Truck className="w-16 h-16 text-gray-200 mx-auto" />
              <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No Active Orders</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">All your orders have been delivered</p>
            </div>
          )}

          {trackingOrder && (
            <div className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">Order #{trackingOrder.id}</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    Placed on {new Date(trackingOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Back to List
                </button>
              </div>

              {/* Order Items */}
              {trackingOrder.items && trackingOrder.items.length > 0 && (
                <div className="space-y-3 mb-8">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Items</p>
                  {trackingOrder.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-[hsl(var(--secondary))]">{item.productName || `Product #${item.productId}`}</p>
                        <p className="text-xs text-gray-400 font-medium">Qty: {item.qty} × ₹{parseFloat(item.unitPrice).toLocaleString("en-IN")}</p>
                      </div>
                      <p className="font-black text-[hsl(var(--secondary))] flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {(item.qty * parseFloat(item.unitPrice)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tracking Progress */}
              <div className="p-6 bg-gray-50 rounded-[2rem]">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-6">Tracking Status</p>
                <div className="relative">
                  {trackingOrder.status === "cancelled" ? (
                    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-red-500 text-lg">✕</span>
                      </div>
                      <div>
                        <p className="font-black text-red-600">Order Cancelled</p>
                        <p className="text-xs text-red-400 font-medium">This order has been cancelled</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {statusSteps.map((step, i) => {
                        const currentIdx = getCurrentStatusIndex(trackingOrder.status);
                        const isCompleted = i <= currentIdx;
                        const isCurrent = i === currentIdx;

                        return (
                          <div key={step} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                                isCompleted ? statusColors[step] + " text-white" : "bg-gray-200 text-gray-400"
                              } ${isCurrent ? "ring-4 ring-orange-200" : ""}`}>
                                {isCompleted ? "✓" : i + 1}
                              </div>
                              {i < statusSteps.length - 1 && (
                                <div className={`w-0.5 h-12 ${isCompleted && i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />
                              )}
                            </div>
                            <div className={`pb-10 ${i < statusSteps.length - 1 ? "" : "pb-0"}`}>
                              <p className={`font-black text-sm capitalize ${isCompleted ? "text-[hsl(var(--secondary))]" : "text-gray-300"}`}>
                                {step}
                              </p>
                              <p className="text-xs text-gray-400 font-medium capitalize">
                                {isCurrent ? "Current status" : isCompleted ? "Completed" : "Pending"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-800">Order Total: ₹{parseFloat(trackingOrder.total).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-orange-600 font-medium">Payment via Razorpay</p>
                </div>
              </div>
            </div>
          )}

          {/* List of active orders to track */}
          {!trackingOrder && pendingOrdersList.length > 0 && (
            <div className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-sm">
              <h3 className="text-xl font-black text-[hsl(var(--secondary))] uppercase tracking-tighter mb-8">Active Orders</h3>
              <div className="space-y-4">
                {pendingOrdersList.map((order: any) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-orange-100 hover:bg-orange-50/30 transition-all"
                    onClick={() => setTrackingOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          statusColors[order.status]?.replace("bg-", "bg-").replace("400", "100") || "bg-gray-100"
                        }`}>
                          <Clock className={`w-5 h-5 ${statusColors[order.status]?.replace("bg-", "text-") || "text-gray-500"}`} />
                        </div>
                        <div>
                          <p className="font-black text-[hsl(var(--secondary))]">Order #{order.id}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 font-bold">₹{parseFloat(order.total).toLocaleString("en-IN")}</span>
                            <span className={`inline-block w-2 h-2 rounded-full ${statusColors[order.status] || "bg-gray-300"}`} />
                            <span className="text-xs font-bold text-gray-400 capitalize">{order.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                        Track <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Truck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
