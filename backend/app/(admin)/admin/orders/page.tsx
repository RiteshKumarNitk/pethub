"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Loader2,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

const statusFlow = ["pending", "confirmed", "processing", "shipped", "delivered"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-600 border-blue-200",
  processing: "bg-indigo-50 text-indigo-600 border-indigo-200",
  shipped: "bg-purple-50 text-purple-600 border-purple-200",
  delivered: "bg-green-50 text-green-600 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};
const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: RefreshCw,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle,
};

interface OrderItem {
  id: number;
  productId: number;
  qty: number;
  unitPrice: string;
  productName: string | null;
  productImage: string | null;
}

interface Order {
  id: number;
  userId: number;
  total: string;
  status: string;
  razorpayOrderId: string | null;
  createdAt: string;
  userName: string | null;
  userPhone: string | null;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Delete this order permanently?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const getNextStatus = (current: string) => {
    if (current === "cancelled" || current === "delivered") return null;
    const idx = statusFlow.indexOf(current);
    if (idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
  };

  const filtered = orders.filter((o) =>
    String(o.id).includes(search) ||
    (o.userName && o.userName.toLowerCase().includes(search.toLowerCase())) ||
    (o.userPhone && o.userPhone.includes(search))
  );

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + parseFloat(o.total), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tighter">Orders</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            {orders.length} orders · ₹{totalRevenue.toLocaleString("en-IN")} revenue
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-[hsl(var(--secondary))] hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by order ID, name, or phone..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 py-24 text-center shadow-sm space-y-4">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto" />
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No orders found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => {
            const StatusIcon = statusIcons[order.status] || Package;
            const nextStatus = getNextStatus(order.status);
            const isExpanded = expandedOrder === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden"
              >
                <div
                  className="p-6 flex items-center gap-6 cursor-pointer hover:bg-gray-50/50 transition-all"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className={`p-3 rounded-xl ${statusColors[order.status] || "bg-gray-50 text-gray-500"} border`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order #</p>
                      <p className="font-black text-[hsl(var(--secondary))]">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                      <p className="font-bold text-sm truncate">{order.userName || order.userPhone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                      <p className="font-black text-[hsl(var(--secondary))] flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {parseFloat(order.total).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColors[order.status] || "bg-gray-50 text-gray-500"}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-300 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-gray-50 px-6 py-6 space-y-6"
                  >
                    {/* Order Items */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order Items</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                            {item.productImage ? (
                              <Image src={item.productImage} alt={item.productName || ""} fill className="object-contain p-1" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-300" />
                            )}
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

                    {/* Status Controls */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                        Update Status:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {statusFlow.map((status) => {
                          const isCurrent = order.status === status;
                          const isPast = statusFlow.indexOf(order.status) >= statusFlow.indexOf(status) && order.status !== "cancelled";
                          return (
                            <button
                              key={status}
                              disabled={isCurrent || updating === order.id}
                              onClick={() => updateStatus(order.id, status)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                isCurrent
                                  ? `${statusColors[status]} border-current`
                                  : isPast
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-gray-500 border-gray-100 hover:border-orange-500 hover:text-orange-500"
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                        <button
                          disabled={order.status === "cancelled" || updating === order.id}
                          onClick={() => updateStatus(order.id, "cancelled")}
                          className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border bg-red-50 text-red-500 border-red-200 hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                      {updating === order.id && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-xs">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Date</p>
                        <p className="font-bold text-[hsl(var(--secondary))]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Phone</p>
                        <p className="font-bold text-[hsl(var(--secondary))]">{order.userPhone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Razorpay ID</p>
                        <p className="font-bold text-[hsl(var(--secondary))] truncate">{order.razorpayOrderId || "N/A"}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                      >
                        Delete Order
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
