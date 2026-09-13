"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Users, IndianRupee, Calendar, PawPrint, MessageCircle,
  Star, Package, AlertTriangle, Loader2, Clock,
  CheckCircle2, Check, XCircle, Truck, Box,
} from "lucide-react";

interface AttentionItem { id: number; [k: string]: any }
interface AttentionSection { items: AttentionItem[]; total: number }
interface Stats {
  attention: Record<string, AttentionSection>;
  totalRevenue: number; deliveredRevenue: number; totalOrders: number; pendingOrders: number;
  todayBookings: number; upcomingBookings: number; totalUsers: number;
  recentActivity: any[];
}

const statusPill: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-teal-50 text-teal-700",
  processing: "bg-blue-50 text-blue-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const act = async (key: string, run: () => Promise<Response>, okText: string) => {
    setBusy(key);
    try {
      const res = await run();
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast({ type: "ok", text: okText });
        load();
      } else {
        setToast({ type: "err", text: d.error || "Action failed" });
      }
    } catch {
      setToast({ type: "err", text: "Something went wrong" });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  const a = stats?.attention;
  const hasWork = ["bookingsToday", "ordersToProcess", "listingsPending", "inquiriesOpen", "lowStock", "reviewsPending"]
    .some((k) => (a?.[k]?.total ?? 0) > 0);

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
          <h1 className="text-2xl font-black text-gray-900">Today at the Shop</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* ===== Needs attention — the operating queue ===== */}
      <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        Needs Attention
        {hasWork && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
      </h2>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {/* --- Today's bookings --- */}
        <Section
          title="Bookings today"
          icon={Calendar}
          tone="text-teal-600 bg-teal-50"
          count={a?.bookingsToday?.total ?? 0}
          viewAll={{ href: "/admin/bookings", label: "Full calendar" }}
        >
          {(a?.bookingsToday?.items ?? []).length === 0 ? (
            <Clear text="No bookings for today ✓" />
          ) : (
            (a?.bookingsToday?.items ?? []).map((b) => (
              <Row key={b.id}>
                <div className="w-14 flex-shrink-0">
                  <p className="font-black text-gray-900 text-sm">{String(b.slotTime).slice(0, 5)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {b.serviceName} · {b.petName}
                    <span className="text-gray-400 font-medium"> ({b.petSpecies})</span>
                  </p>
                  <p className="text-xs text-gray-400 truncate">{b.customerName} · {b.customerPhone}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${statusPill[b.status] || "bg-gray-100"}`}>{b.status}</span>
                {b.status === "pending" && (
                  <MiniBtn
                    busy={busy === `bk-${b.id}`}
                    onClick={() => act(`bk-${b.id}`, () => fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, action: "confirm" }) }), `Booking ${b.bookingRef} confirmed`)}
                  >
                    Confirm
                  </MiniBtn>
                )}
                {b.status === "confirmed" && (
                  <>
                    <MiniBtn
                      busy={busy === `bk-${b.id}`}
                      onClick={() => act(`bk-${b.id}`, () => fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, action: "complete" }) }), `${b.bookingRef} completed`)}
                    >
                      Done
                    </MiniBtn>
                    <MiniBtn
                      busy={busy === `bk-${b.id}`}
                      tone="ghost"
                      onClick={() => act(`bk-${b.id}`, () => fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, action: "no_show" }) }), `${b.bookingRef} marked no-show`)}
                    >
                      No-show
                    </MiniBtn>
                  </>
                )}
              </Row>
            ))
          )}
        </Section>

        {/* --- Orders to process --- */}
        <Section
          title="Orders to process"
          icon={Package}
          tone="text-orange-600 bg-orange-50"
          count={a?.ordersToProcess?.total ?? 0}
          viewAll={{ href: "/admin/orders?status=paid", label: "All orders" }}
        >
          {(a?.ordersToProcess?.items ?? []).length === 0 ? (
            <Clear text="No paid orders waiting ✓" />
          ) : (
            (a?.ordersToProcess?.items ?? []).map((o) => (
              <Row key={o.id}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">
                    {o.itemCount} item{o.itemCount !== 1 ? "s" : ""} · ₹{parseFloat(o.total).toFixed(0)} · paid {hoursAgo(o.createdAt)}
                  </p>
                </div>
                {o.status === "processing" ? (
                  <MiniBtn
                    busy={busy === `od-${o.id}`}
                    onClick={() => act(`od-${o.id}`, () => fetch(`/api/admin/orders/${o.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "shipped" }) }), `${o.orderNumber} marked shipped`)}
                  >
                    <><Truck className="w-3.5 h-3.5" /> Ship</>
                  </MiniBtn>
                ) : (
                  <MiniBtn
                    busy={busy === `od-${o.id}`}
                    onClick={() => act(`od-${o.id}`, () => fetch(`/api/admin/orders/${o.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "processing" }) }), `${o.orderNumber} now being prepared`)}
                  >
                    <><Box className="w-3.5 h-3.5" /> Start packing</>
                  </MiniBtn>
                )}
              </Row>
            ))
          )}
        </Section>

        {/* --- Listings to review --- */}
        <Section
          title="Pet listings to review"
          icon={PawPrint}
          tone="text-amber-600 bg-amber-50"
          count={a?.listingsPending?.total ?? 0}
          viewAll={{ href: "/admin/listings?status=pending_review", label: "Review queue" }}
        >
          {(a?.listingsPending?.items ?? []).length === 0 ? (
            <Clear text="Nothing awaiting review ✓" />
          ) : (
            (a?.listingsPending?.items ?? []).map((l) => (
              <Row key={l.id}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {l.name}
                    <span className="text-gray-400 font-medium"> · {l.breed || l.species}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {l.listingType === "community" ? "Community" : "Business"} · {l.intent === "adoption" ? "for adoption" : "for sale"} · {hoursAgo(l.createdAt)}
                  </p>
                </div>
                <MiniBtn
                  busy={busy === `ls-${l.id}`}
                  onClick={() => act(`ls-${l.id}`, () => fetch("/api/admin/listings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id, action: "approve" }) }), `Listing for ${l.name} approved`)}
                >
                  <><Check className="w-3.5 h-3.5" /> Approve</>
                </MiniBtn>
                <Link href="/admin/listings?status=pending_review" className="text-xs font-bold text-gray-400 hover:text-gray-600 whitespace-nowrap">Review</Link>
              </Row>
            ))
          )}
        </Section>

        {/* --- Open inquiries --- */}
        <Section
          title="New inquiries"
          icon={MessageCircle}
          tone="text-blue-600 bg-blue-50"
          count={a?.inquiriesOpen?.total ?? 0}
          viewAll={{ href: "/admin/inquiries?status=open", label: "Inbox" }}
        >
          {(a?.inquiriesOpen?.items ?? []).length === 0 ? (
            <Clear text="Inbox is clear ✓" />
          ) : (
            (a?.inquiriesOpen?.items ?? []).map((q) => (
              <Row key={q.id}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{q.subject}</p>
                  <p className="text-xs text-gray-400 capitalize">{q.type} · {hoursAgo(q.createdAt)}</p>
                </div>
                <Link href="/admin/inquiries?status=open" className="flex-shrink-0 text-xs font-bold text-blue-600 hover:underline whitespace-nowrap">
                  Reply →
                </Link>
              </Row>
            ))
          )}
        </Section>

        {/* --- Low stock --- */}
        <Section
          title="Low stock"
          icon={AlertTriangle}
          tone="text-amber-600 bg-amber-50"
          count={a?.lowStock?.total ?? 0}
          viewAll={{ href: "/admin/products", label: "Manage" }}
        >
          {(a?.lowStock?.items ?? []).length === 0 ? (
            <Clear text="All products sufficiently stocked ✓" />
          ) : (
            (a?.lowStock?.items ?? []).map((p) => (
              <Row key={p.id}>
                <p className="flex-1 min-w-0 text-sm text-gray-700 truncate">{p.name}</p>
                <span className={`text-sm font-bold whitespace-nowrap ${p.stock === 0 ? "text-red-500" : "text-amber-600"}`}>
                  {p.stock} left
                </span>
              </Row>
            ))
          )}
        </Section>

        {/* --- Reviews --- */}
        <Section
          title="Reviews to moderate"
          icon={Star}
          tone="text-purple-600 bg-purple-50"
          count={a?.reviewsPending?.total ?? 0}
          viewAll={{ href: "/admin/reviews", label: "Moderate" }}
        >
          {(a?.reviewsPending?.items ?? []).length === 0 ? (
            <Clear text="No reviews waiting ✓" />
          ) : (
            (a?.reviewsPending?.items ?? []).map((r) => (
              <Row key={r.id}>
                <div className="flex flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < (r.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="flex-1 min-w-0 text-sm text-gray-700 truncate">{r.title || `${r.targetType} review`}</p>
                <Link href="/admin/reviews" className="flex-shrink-0 text-xs font-bold text-purple-600 hover:underline whitespace-nowrap">Moderate →</Link>
              </Row>
            ))
          )}
        </Section>
      </div>

      {/* ===== Metrics ===== */}
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

      {/* ===== Recent activity ===== */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Clock className="w-4.5 h-4.5 text-gray-400" /> Recent Activity</h2>
        {stats?.recentActivity?.length ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.recentActivity.map((act_: any) => (
              <div key={act_.id} className="text-sm py-1.5 border-b border-gray-50 last:border-0 flex items-start gap-2">
                <span className="font-mono text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap">{act_.action}</span>
                <span className="text-gray-400 text-xs">{new Date(act_.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-3">No activity yet.</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-semibold ${
          toast.type === "ok" ? "bg-teal-700 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}

function hoursAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Section({
  title, icon: Icon, tone, count, viewAll, children,
}: {
  title: string; icon: any; tone: string; count: number;
  viewAll?: { href: string; label: string }; children: React.ReactNode;
}) {
  const urgent = count > 0;
  return (
    <div className={`bg-white border rounded-2xl p-4 ${urgent ? "border-amber-200" : "border-gray-100"}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm flex-1">{title}</h3>
        {urgent && <span className="text-xs font-black text-amber-600 bg-amber-50 rounded-full px-2.5 py-0.5">{count}</span>}
        {viewAll && (
          <Link href={viewAll.href} className="text-xs font-bold text-orange-600 hover:underline whitespace-nowrap">
            {viewAll.label}
          </Link>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-1 border-b border-gray-50 last:border-0 flex-wrap">
      {children}
    </div>
  );
}

function Clear({ text }: { text: string }) {
  return (
    <p className="text-xs text-teal-600 bg-teal-50/60 rounded-lg px-3 py-2 font-semibold">✓ {text}</p>
  );
}

function MiniBtn({
  children, onClick, busy, tone = "solid",
}: {
  children: React.ReactNode; onClick: () => void; busy?: boolean; tone?: "solid" | "ghost";
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap disabled:opacity-50 transition-colors flex-shrink-0 ${
        tone === "solid"
          ? "bg-teal-700 hover:bg-teal-800 text-white"
          : "border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
      }`}
    >
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : children}
    </button>
  );
}
