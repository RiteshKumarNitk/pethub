"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Loader2, Scissors, XCircle, PawPrint } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancelBooking = async (id: number) => {
    if (!confirm("Cancel this appointment?")) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    } else {
      const d = await res.json();
      alert(d.error || "Failed to cancel");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => ["pending", "confirmed"].includes(b.status) && new Date(`${b.bookingDate}T${b.slotTime}`) >= now
  );
  const past = bookings.filter(
    (b) => !["pending", "confirmed"].includes(b.status) || new Date(`${b.bookingDate}T${b.slotTime}`) < now
  );
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${tab === t ? "bg-teal-700 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {t} ({t === "upcoming" ? upcoming.length : past.length})
            </button>
          ))}
        </div>
        <Link href="/services" className="text-sm font-bold text-teal-700 hover:underline">+ New booking</Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No {tab} bookings</h3>
          <p className="text-sm text-gray-500 mt-1">
            {tab === "upcoming" ? "Book a grooming session for your pet." : "Your past appointments will appear here."}
          </p>
          <Link href="/services" className="mt-5 inline-block bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl">Explore Services</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Scissors className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{b.serviceName}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    b.status === "confirmed" ? "bg-blue-50 text-blue-700"
                    : b.status === "completed" ? "bg-teal-50 text-teal-700"
                    : b.status === "cancelled" ? "bg-red-50 text-red-600"
                    : b.status === "no_show" ? "bg-gray-100 text-gray-500"
                    : "bg-amber-50 text-amber-700"
                  }`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-1"><PawPrint className="w-3.5 h-3.5" /> {b.petName}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.bookingDate}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {String(b.slotTime).slice(0, 5)}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Ref {b.bookingRef} · ₹{parseFloat(b.amount).toFixed(0)}</p>
              </div>
              {["pending", "confirmed"].includes(b.status) && (
                <button onClick={() => cancelBooking(b.id)} className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1.5 self-start sm:self-center">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
