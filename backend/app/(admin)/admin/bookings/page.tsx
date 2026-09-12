"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar, Loader2, Check, X, User, PawPrint, Clock, Phone,
  Ban, ChevronLeft, ChevronRight, Scissors,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [blockouts, setBlockouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<number | null>(null);
  const [showBlockout, setShowBlockout] = useState(false);
  const [blockoutForm, setBlockoutForm] = useState({ date: new Date().toISOString().slice(0, 10), slotTime: "", reason: "" });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFilter) params.set("date", dateFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setBookings(d.bookings || []);
        setBlockouts(d.blockouts || []);
      })
      .finally(() => setLoading(false));
  }, [dateFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, action: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Action failed");
      }
      load();
    } finally {
      setBusy(null);
    }
  };

  const addBlockout = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockoutForm),
    });
    if (res.ok) {
      setShowBlockout(false);
      setBlockoutForm({ date: new Date().toISOString().slice(0, 10), slotTime: "", reason: "" });
      load();
    }
  };

  const removeBlockout = async (id: number) => {
    await fetch(`/api/admin/bookings?blockoutId=${id}`, { method: "DELETE" });
    load();
  };

  const shiftDate = (days: number) => {
    const d = new Date(dateFilter + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDateFilter(d.toISOString().slice(0, 10));
  };

  const dayBlockouts = blockouts.filter((b) => b.date === dateFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage appointments, confirm requests and block dates.</p>
        </div>
        <button onClick={() => setShowBlockout(true)} className="border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-gray-50">
          <Ban className="w-4 h-4" /> Block Date
        </button>
      </div>

      {/* Date nav + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button onClick={() => shiftDate(-1)} className="p-1.5 text-gray-400 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /></button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm font-semibold px-2 py-1 focus:outline-none"
          />
          <button onClick={() => shiftDate(1)} className="p-1.5 text-gray-400 hover:text-gray-700"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          {["all", "pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace("_", " ")}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{bookings.length} booking(s)</span>
      </div>

      {/* Blockouts for the day */}
      {dayBlockouts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4 flex flex-wrap items-center gap-2 text-xs text-amber-700">
          <Ban className="w-3.5 h-3.5" />
          <strong>Blocked:</strong>
          {dayBlockouts.map((b) => (
            <span key={b.id} className="bg-white rounded-lg px-2 py-1 border border-amber-200 flex items-center gap-1.5">
              {b.slotTime ? b.slotTime.slice(0, 5) : "Full day"} {b.reason && `· ${b.reason}`}
              <button onClick={() => removeBlockout(b.id)} className="text-amber-500 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700">No bookings on this date</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 md:w-28 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">{String(b.slotTime).slice(0, 5)}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{b.bookingDate}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{b.serviceName}</p>
                    <StatusBadge status={b.status} />
                    {b.depositPaid && <span className="text-[9px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded uppercase">Deposit paid</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><PawPrint className="w-3.5 h-3.5" /> {b.petName} ({b.petSpecies}{b.petBreed ? ` · ${b.petBreed}` : ""})</span>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {b.customerName}</span>
                    <a href={`tel:${b.customerPhone}`} className="flex items-center gap-1 text-teal-700 hover:underline"><Phone className="w-3.5 h-3.5" /> {b.customerPhone}</a>
                    <span className="font-semibold text-gray-700">₹{parseFloat(b.amount).toFixed(0)}</span>
                  </div>
                  {b.notes && <p className="text-xs text-gray-400 mt-1">📝 {b.notes}</p>}
                  {b.petNotes && b.petNotes !== b.notes && <p className="text-xs text-gray-400">🐾 {b.petNotes}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                  {b.status === "pending" && (
                    <button onClick={() => act(b.id, "confirm")} disabled={busy === b.id} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button onClick={() => act(b.id, "complete")} disabled={busy === b.id} className="bg-gray-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Complete
                    </button>
                  )}
                  {["pending", "confirmed"].includes(b.status) && (
                    <>
                      <button onClick={() => act(b.id, "cancel")} disabled={busy === b.id} className="border border-red-200 text-red-500 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50">Cancel</button>
                      <button onClick={() => act(b.id, "no_show")} disabled={busy === b.id} className="border border-gray-200 text-gray-500 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50">No-show</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blockout modal */}
      {showBlockout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-4">Block date or slot</h3>
            <form onSubmit={addBlockout} className="space-y-3">
              <input required type="date" value={blockoutForm.date} onChange={(e) => setBlockoutForm({ ...blockoutForm, date: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm" />
              <input type="time" value={blockoutForm.slotTime} onChange={(e) => setBlockoutForm({ ...blockoutForm, slotTime: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm" />
              <p className="text-xs text-gray-400 -mt-1.5">Leave time empty to block the whole day</p>
              <input placeholder="Reason (holiday, maintenance…)" value={blockoutForm.reason} onChange={(e) => setBlockoutForm({ ...blockoutForm, reason: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowBlockout(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold">Block</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    completed: "bg-teal-50 text-teal-700",
    cancelled: "bg-red-50 text-red-600",
    no_show: "bg-gray-100 text-gray-500",
  };
  return <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${map[status] || "bg-gray-100"}`}>{status.replace("_", " ")}</span>;
}
