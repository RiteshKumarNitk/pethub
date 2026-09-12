"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, Loader2, XCircle, Eye, Clock, Check, AlertTriangle } from "lucide-react";

const STATUS_INFO: Record<string, { label: string; cls: string; icon: typeof Clock; desc: string }> = {
  pending_review: { label: "Pending Review", cls: "bg-amber-50 text-amber-700", icon: Clock, desc: "Our team is reviewing your listing. This usually takes less than 24 hours." },
  approved: { label: "Live", cls: "bg-teal-50 text-teal-700", icon: Check, desc: "Your listing is public. Interested pet parents can contact you." },
  rejected: { label: "Not Approved", cls: "bg-red-50 text-red-600", icon: AlertTriangle, desc: "This listing was not approved. See the note below." },
  sold: { label: "Sold", cls: "bg-gray-100 text-gray-600", icon: Tag, desc: "Marked as sold." },
  adopted: { label: "Adopted", cls: "bg-pink-50 text-pink-600", icon: Check, desc: "Marked as adopted — great news!" },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-500", icon: XCircle, desc: "This listing is closed." },
  suspended: { label: "Suspended", cls: "bg-red-50 text-red-600", icon: AlertTriangle, desc: "Temporarily suspended pending review." },
  draft: { label: "Draft", cls: "bg-gray-100 text-gray-500", icon: Clock, desc: "Not submitted yet." },
};

export default function MyListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pet-listings/mine")
      .then((r) => r.json())
      .then((d) => setListings(d.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const closeListing = async (id: number) => {
    if (!confirm("Close this listing? It will no longer be visible.")) return;
    const res = await fetch(`/api/pet-listings/mine?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: "closed" } : l)));
    } else {
      const d = await res.json();
      alert(d.error || "Failed to close listing");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-black text-gray-900 text-lg">My Pet Listings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Track the review status of your listings.</p>
        </div>
        <Link href="/sell-rehome" className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl">
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No listings yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Need to rehome a pet? Create a listing — our team reviews it within 24 hours.
          </p>
          <Link href="/sell-rehome" className="mt-5 inline-block bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl">Create a Listing</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const info = STATUS_INFO[l.status] || STATUS_INFO.closed;
            const Icon = info.icon;
            return (
              <div key={l.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    {l.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.primaryImage} alt={l.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Tag className="w-5 h-5 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{l.name}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${info.cls}`}>
                        <Icon className="w-3 h-3" /> {info.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{[l.breed, l.species].filter(Boolean).join(" · ")} · {l.price ? `₹${parseFloat(l.price).toFixed(0)}` : l.priceType.replace("_", " ")}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{info.desc}</p>
                    {l.status === "rejected" && l.moderationNote && (
                      <p className="text-xs text-red-500 mt-1 bg-red-50 rounded-lg px-3 py-1.5">Reason: {l.moderationNote}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {l.status === "approved" && (
                      <Link href={`/pets/${l.slug}`} className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View live
                      </Link>
                    )}
                    {!["sold", "adopted", "closed"].includes(l.status) && (
                      <button onClick={() => closeListing(l.id)} className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
