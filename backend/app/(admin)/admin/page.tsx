"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Users, IndianRupee, Calendar, PawPrint, MessageCircle,
  Star, Package, AlertTriangle, ArrowRight, Loader2, Clock, TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  const queues = [
    { label: "Listings to review", count: stats?.pendingListings ?? 0, href: "/admin/listings?status=pending_review", icon: PawPrint, color: "text-amber-600 bg-amber-50", urgent: (stats?.pendingListings ?? 0) > 0 },
    { label: "Open inquiries", count: stats?.openInquiries ?? 0, href: "/admin/inquiries?status=open", icon: MessageCircle, color: "text-blue-600 bg-blue-50", urgent: (stats?.openInquiries ?? 0) > 0 },
    { label: "Pending bookings", count: stats?.pendingBookings ?? 0, href: "/admin/bookings", icon: Calendar, color: "text-teal-600 bg-teal-50", urgent: (stats?.pendingBookings ?? 0) > 0 },
    { label: "Pending orders", count: stats?.pendingOrders ?? 0, href: "/admin/orders?status=pending", icon: Package, color: "text-orange-600 bg-orange-50", urgent: (stats?.pendingOrders ?? 0) > 0 },
    { label: "Reviews to moderate", count: stats?.pendingReviews ?? 0, href: "/admin/reviews", icon: Star, color: "text-purple-600 bg-purple-50", urgent: false },
  ];

  const metrics = [
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, sub: `₹${(stats?.deliveredRevenue ?? 0).toLocaleString("en-IN")} delivered` },
    { label: "Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, sub: `${stats?.pendingOrders ?? 0} pending` },
    { label: "Today's Bookings", value: stats?.todayBookings ?? 0, icon: Calendar, sub: `${stats?.upcomingBookings ?? 0} upcoming` },
    { label: "Customers", value: stats?.totalUsers ?? 0, icon: Users, sub: "registered" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
              <m.icon className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{m.label} · <span className="text-gray-500 font-semibold">{m.sub}</span></p>
          </div>
        ))}
      </div>

      {/* Action queues */}
      <h2 className="font-bold text-gray-900 mb-3">Needs Attention</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {queues.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className={`bg-white border rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow ${
              q.urgent ? "border-amber-200" : "border-gray-100"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${q.color}`}>
              <q.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{q.label}</p>
              <p className="text-xs text-gray-400">{q.count} item{q.count !== 1 ? "s" : ""}</p>
            </div>
            {q.urgent && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />}
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-4.5 h-4.5 text-amber-500" /> Low Stock</h2>
            <Link href="/admin/products" className="text-xs font-bold text-orange-600 hover:underline">Manage</Link>
          </div>
          {stats?.lowStock?.length ? (
            <div className="space-y-2">
              {stats.lowStock.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 truncate pr-4">{p.name}</span>
                  <span className={`font-bold whitespace-nowrap ${p.stock === 0 ? "text-red-500" : "text-amber-600"}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-3">All products sufficiently stocked ✓</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Clock className="w-4.5 h-4.5 text-gray-400" /> Recent Activity</h2>
          {stats?.recentActivity?.length ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.recentActivity.map((a: any) => (
                <div key={a.id} className="text-sm py-1.5 border-b border-gray-50 last:border-0 flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap">{a.action}</span>
                  <span className="text-gray-400 text-xs">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-3">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
