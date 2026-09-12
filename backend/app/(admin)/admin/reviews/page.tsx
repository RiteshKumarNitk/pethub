"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Loader2, Check, X } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/reviews?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id: number, status: string) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Only approved reviews appear on the storefront.</p>
        </div>
        <div className="flex gap-1.5">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize ${
                statusFilter === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700">No {statusFilter === "all" ? "" : statusFilter} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{r.userName || "Customer"}</span>
                    <span className="text-xs text-gray-400">{r.targetType} #{r.targetId}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.title && <p className="font-semibold text-gray-800 text-sm mt-1.5">{r.title}</p>}
                  <p className="text-sm text-gray-600 mt-0.5">{r.comment}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {r.status !== "approved" && (
                    <button onClick={() => moderate(r.id, "approved")} className="bg-teal-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => moderate(r.id, "rejected")} className="border border-red-200 text-red-500 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
