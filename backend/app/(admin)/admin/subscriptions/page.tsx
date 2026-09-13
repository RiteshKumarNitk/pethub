"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Search } from "lucide-react";

interface Sub {
  id: number;
  productName: string;
  variantName: string | null;
  qty: number;
  unitPrice: string;
  frequencyDays: number;
  status: string;
  nextOrderAt: string;
  lastOrderAt: string | null;
  userName: string | null;
  userPhone: string | null;
  productSlug: string | null;
}

interface Counts {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-teal-50 text-teal-700",
  paused: "bg-amber-50 text-amber-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSubs(data.subscriptions || []);
      setCounts(data.counts || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(statusFilter); }, [load, statusFilter]);

  const filtered = search.trim()
    ? subs.filter(
        (s) =>
          s.productName.toLowerCase().includes(search.toLowerCase()) ||
          (s.userName || "").toLowerCase().includes(search.toLowerCase()) ||
          (s.userPhone || "").includes(search)
      )
    : subs;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Subscriptions</h1>
          {counts && (
            <p className="text-sm text-gray-400 mt-1">
              {counts.active} active · {counts.paused} paused · {counts.cancelled} cancelled
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or customer…"
              className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-400"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
          <RefreshCw className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No subscriptions found</p>
          <p className="text-gray-600 text-sm mt-1">Customers create subscriptions from eligible product pages.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Next order</th>
                <th className="px-4 py-3">Last order</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{s.userName || "—"}</p>
                    <p className="text-xs text-gray-500">{s.userPhone || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-200 font-medium">
                      {s.productSlug ? (
                        <Link href={`/shop/${s.productSlug}`} target="_blank" className="hover:text-orange-400">{s.productName}</Link>
                      ) : s.productName}
                    </p>
                    {s.variantName && <p className="text-xs text-gray-500">{s.variantName}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">Every {s.frequencyDays}d · {s.qty}×</td>
                  <td className="px-4 py-3 text-gray-300">{new Date(s.nextOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-3 text-gray-400">{s.lastOrderAt ? new Date(s.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${STATUS_STYLES[s.status] || "bg-gray-100 text-gray-500"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
