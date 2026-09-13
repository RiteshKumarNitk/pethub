"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RefreshCw, Pause, Play, XCircle, Zap, Loader2, PackageOpen, CalendarClock,
} from "lucide-react";

interface Subscription {
  id: number;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: string;
  qty: number;
  frequencyDays: number;
  status: string;
  nextOrderAt: string;
  lastOrderAt: string | null;
  cancelReason: string | null;
  productId: number | null;
  productSlug: string | null;
  productActive: boolean | null;
  productStock: number | null;
  productPrice: string | null;
}

const FREQ_LABELS: Record<number, string> = {
  7: "Weekly", 15: "Every 2 weeks", 30: "Monthly", 45: "Every 45 days", 60: "Every 2 months",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-teal-50 text-teal-700",
  paused: "bg-amber-50 text-amber-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AccountSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [frequencies, setFrequencies] = useState<number[]>([7, 15, 30, 45, 60]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/subscriptions");
    if (res.ok) {
      const data = await res.json();
      setSubs(data.subscriptions || []);
      if (Array.isArray(data.eligibleFrequencies)) setFrequencies(data.eligibleFrequencies);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: number, action: string, extra: Record<string, unknown> = {}) => {
    setBusyId(id);
    setBanner(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBanner({ ok: true, text: `Subscription ${action === "frequency" ? `updated to every ${extra.frequencyDays} days` : action + "d"}.` });
        await load();
      } else {
        setBanner({ ok: false, text: data.error || "Could not update subscription" });
      }
    } catch {
      setBanner({ ok: false, text: "Network error — please try again" });
    } finally {
      setBusyId(null);
    }
  };

  const orderNow = async (id: number) => {
    setBusyId(id);
    setBanner(null);
    try {
      const res = await fetch("/api/subscriptions/order-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBanner({ ok: true, text: "Order created! Complete payment from your Orders page." });
        await load();
      } else {
        setBanner({ ok: false, text: data.error || "Could not order this cycle" });
      }
    } catch {
      setBanner({ ok: false, text: "Network error — please try again" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-gray-900">Subscriptions</h1>
        <Link href="/shop" className="text-sm font-bold text-orange-600 hover:text-orange-700">
          + New subscription
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Food and consumables delivered on your schedule. Pause or cancel anytime.
      </p>

      {banner && (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${banner.ok ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"}`}>
          {banner.text}
        </div>
      )}

      {subs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <PackageOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h2 className="font-bold text-gray-900">No subscriptions yet</h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">Subscribe to food &amp; consumables and never run out.</p>
          <Link href="/shop" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm">
            Browse eligible products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((s) => {
            const next = new Date(s.nextOrderAt);
            const price = parseFloat(s.unitPrice) * s.qty;
            return (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 relative">
                    {s.imageUrl ? (
                      <Image src={s.imageUrl} alt={s.productName} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><PackageOpen className="w-7 h-7" /></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-gray-900 truncate">
                            {s.productSlug ? (
                              <Link href={`/shop/${s.productSlug}`} className="hover:text-orange-600">{s.productName}</Link>
                            ) : s.productName}
                          </h2>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] || "bg-gray-100 text-gray-500"}`}>
                            {s.status}
                          </span>
                        </div>
                        {s.variantName && <p className="text-xs text-gray-400">{s.variantName}</p>}
                        <p className="text-sm text-gray-600 mt-1">
                          ₹{price.toFixed(0)} · every {s.frequencyDays} days ({FREQ_LABELS[s.frequencyDays] || `${s.frequencyDays}d`})
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {s.status === "active"
                            ? `Next order: ${next.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                            : s.status === "paused"
                              ? "Paused — resume to continue deliveries"
                              : `Cancelled${s.cancelReason ? ` (${s.cancelReason.replace(/_/g, " ")})` : ""}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {s.status === "active" && (
                        <>
                          <button
                            onClick={() => orderNow(s.id)}
                            disabled={busyId === s.id}
                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                          >
                            {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Order now</>}
                          </button>
                          <button
                            onClick={() => patch(s.id, "pause")}
                            disabled={busyId === s.id}
                            className="border border-gray-200 hover:border-gray-300 text-gray-600 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                          >
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </button>
                        </>
                      )}
                      {s.status === "paused" && (
                        <button
                          onClick={() => patch(s.id, "resume")}
                          disabled={busyId === s.id}
                          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" /> Resume
                        </button>
                      )}
                      {(s.status === "active" || s.status === "paused") && (
                        <>
                          <select
                            value={s.frequencyDays}
                            onChange={(e) => patch(s.id, "frequency", { frequencyDays: parseInt(e.target.value) })}
                            disabled={busyId === s.id}
                            className="border border-gray-200 rounded-lg text-xs font-bold px-2.5 py-2 text-gray-600 bg-white"
                            aria-label="Change frequency"
                          >
                            {frequencies.map((f) => (
                              <option key={f} value={f}>{FREQ_LABELS[f] || `Every ${f} days`}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (confirm(`Cancel your ${s.productName} subscription?`)) patch(s.id, "cancel", { cancelReason: "user_cancelled" });
                            }}
                            disabled={busyId === s.id}
                            className="border border-red-100 hover:border-red-200 text-red-500 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 flex items-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        Each cycle creates a real order you approve and pay for — no surprise charges, ever.
      </p>
    </div>
  );
}
