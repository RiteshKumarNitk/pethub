"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, TrendingUp, RefreshCw, Star, Coins, CalendarCheck } from "lucide-react";

interface DayPoint {
  day: string;
  revenue: number;
  orders: number;
}

interface Analytics {
  window: { days: number };
  totals: { revenue: number; orders: number };
  timeseries: DayPoint[];
  topProducts: { productId: number | null; name: string; qty: number; revenue: number }[];
  topCategories: { category: string; slug: string; revenue: number; qty: number }[];
  subscriptions: { total: number; active: number; paused: number; cancelled: number; mrr: number };
  loyalty: { members: number; pointsIssued: number; pointsOutstanding: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number } | null;
}

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

function RevenueChart({ series }: { series: DayPoint[] }) {
  const w = 760;
  const h = 220;
  const pad = { top: 16, right: 12, bottom: 24, left: 44 };
  const max = Math.max(1, ...series.map((p) => p.revenue));
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const n = series.length;

  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const linePoints = series.map((p, i) => `${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(" ");
  const areaPoints = `${pad.left},${(pad.top + innerH).toFixed(1)} ${linePoints} ${(pad.left + innerW).toFixed(1)},${(pad.top + innerH).toFixed(1)}`;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Revenue chart">
      {gridValues.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} x2={w - pad.right} y1={y(v)} y2={y(v)} stroke="#374151" strokeDasharray="3 4" strokeWidth="1" />
          <text x={pad.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">₹{Math.round(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}</text>
        </g>
      ))}
      <polygon points={areaPoints} fill="rgba(249,115,22,0.12)" />
      <polyline points={linePoints} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((p, i) => (
        <circle key={p.day} cx={x(i)} cy={y(p.revenue)} r={n > 45 ? 0 : 2.5} fill="#f97316" />
      ))}
      {series.map((p, i) =>
        i % Math.ceil(n / 6) === 0 ? (
          <text key={p.day} x={x(i)} y={h - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {p.day.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics?days=${d}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(days); }, [load, days]);

  const fmt = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Revenue, products, subscriptions and loyalty at a glance.</p>
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${days === w.days ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Revenue</p>
              <p className="text-2xl font-black text-white mt-1">{fmt(data.totals.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{data.totals.orders} paid orders</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Avg order value</p>
              <p className="text-2xl font-black text-white mt-1">
                {fmt(data.totals.orders ? data.totals.revenue / data.totals.orders : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">in the last {data.window.days} days</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Subscription MRR</p>
              <p className="text-2xl font-black text-white mt-1">{fmt(data.subscriptions.mrr)}</p>
              <p className="text-xs text-gray-500 mt-1">{data.subscriptions.active} active of {data.subscriptions.total}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Points outstanding</p>
              <p className="text-2xl font-black text-white mt-1">{data.loyalty.pointsOutstanding.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-500 mt-1">{data.loyalty.members} members</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" /> Daily revenue</h2>
              <span className="text-xs text-gray-500">paid orders only</span>
            </div>
            <RevenueChart series={data.timeseries} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4"><Star className="w-4 h-4 text-amber-400" /> Top products</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-gray-500">No paid orders in this window yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topProducts.map((p) => (
                    <div key={`${p.productId}-${p.name}`} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.qty} sold</p>
                      </div>
                      <p className="text-sm font-black text-white shrink-0">{fmt(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top categories */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4"><Star className="w-4 h-4 text-teal-400" /> Top categories</h2>
              {data.topCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No paid orders in this window yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topCategories.map((c) => (
                    <div key={c.slug} className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-200 truncate">{c.category}</p>
                      <p className="text-sm font-black text-white shrink-0">{fmt(c.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bookings strip */}
          {data.bookings && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4"><CalendarCheck className="w-4 h-4 text-orange-400" /> Bookings (this window)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div><p className="text-2xl font-black text-white">{data.bookings.total}</p><p className="text-xs text-gray-500">Total</p></div>
                <div><p className="text-2xl font-black text-amber-400">{data.bookings.pending}</p><p className="text-xs text-gray-500">Pending</p></div>
                <div><p className="text-2xl font-black text-teal-400">{data.bookings.confirmed}</p><p className="text-xs text-gray-500">Confirmed</p></div>
                <div><p className="text-2xl font-black text-gray-400">{data.bookings.completed}</p><p className="text-xs text-gray-500">Completed</p></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
