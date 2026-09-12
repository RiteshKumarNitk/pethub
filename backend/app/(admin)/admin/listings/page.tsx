"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PawPrint, Loader2, Check, X, PauseCircle, Tag, Heart, Plus, Pencil,
  BadgeCheck, Users, Eye, Ban,
} from "lucide-react";

interface Listing {
  id: number; slug: string; name: string; species: string; breed: string | null;
  gender: string | null; ageText: string | null; price: string | null; priceType: string;
  listingType: string; status: string; city: string | null; description: string | null;
  temperament: string | null; healthInfo: string | null; vaccinated: boolean;
  vaccinationDetails: string | null; moderationNote: string | null; isVerified: boolean;
  featured: boolean; ownerName: string | null; ownerPhone: string | null;
  media: { id: number; url: string }[];
  createdAt: string;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const [listings, setListings] = useState<Listing[]>([]);
  const [counts, setCounts] = useState<{ status: string; cnt: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Listing | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/listings?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => {
        setListings(d.listings || []);
        setCounts(d.counts || []);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (listing: Listing, action: string, moderationNote?: string) => {
    setBusy(listing.id);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listing.id, action, moderationNote }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Action failed");
      }
      load();
    } finally {
      setBusy(null);
      setRejecting(null);
      setRejectNote("");
    }
  };

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "pending_review", label: "Pending Review" },
    { value: "approved", label: "Live" },
    { value: "rejected", label: "Rejected" },
    { value: "suspended", label: "Suspended" },
    { value: "sold", label: "Sold" },
    { value: "adopted", label: "Adopted" },
    { value: "closed", label: "Closed" },
  ];
  const countFor = (s: string) => counts.find((c) => c.status === s)?.cnt ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Pet Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Moderate community submissions and manage business pets.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowBusinessForm(true); }}
          className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Business Pet
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
        {statusTabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/listings?status=${t.value}`}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === t.value ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {t.label} {t.value !== "all" && `(${countFor(t.value)})`}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700">No listings with this status</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Media */}
                <div className="flex gap-2 flex-shrink-0">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden relative">
                    {l.media?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.media[0].url} alt={l.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><PawPrint className="w-6 h-6 text-gray-300" /></div>
                    )}
                  </div>
                  {l.media?.length > 1 && (
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden relative opacity-60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.media[1].url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/30">
                        +{l.media.length - 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{l.name}</h3>
                    {l.listingType === "business" ? (
                      <span className="text-[9px] font-black bg-teal-600 text-white px-2 py-0.5 rounded uppercase flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Business</span>
                    ) : (
                      <span className="text-[9px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Community</span>
                    )}
                    <StatusBadge status={l.status} />
                    {l.featured && <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded uppercase">Featured</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {[l.breed, l.species, l.ageText, l.city].filter(Boolean).join(" · ")} · {l.price ? `₹${parseFloat(l.price).toFixed(0)}` : l.priceType}
                  </p>
                  {l.listingType === "community" && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Owner: <strong>{l.ownerName || "Unknown"}</strong> {l.ownerPhone && `· ${l.ownerPhone}`}
                    </p>
                  )}
                  {l.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{l.description}</p>}
                  {l.moderationNote && (
                    <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">Note: {l.moderationNote}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col flex-wrap gap-1.5 flex-shrink-0 md:w-44">
                  {l.status === "pending_review" && (
                    <>
                      <button onClick={() => act(l, "approve")} disabled={busy === l.id} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setRejecting(l)} disabled={busy === l.id} className="flex-1 border border-red-200 text-red-500 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-red-50 disabled:opacity-50">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {l.status === "approved" && (
                    <>
                      <button onClick={() => act(l, "mark_sold")} disabled={busy === l.id} className="flex-1 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Tag className="w-3.5 h-3.5" /> Sold
                      </button>
                      <button onClick={() => act(l, "mark_adopted")} disabled={busy === l.id} className="flex-1 bg-pink-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Heart className="w-3.5 h-3.5" /> Adopted
                      </button>
                      <button onClick={() => act(l, "feature")} disabled={busy === l.id} className="border border-amber-200 text-amber-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Eye className="w-3.5 h-3.5" /> {l.featured ? "Unfeature" : "Feature"}
                      </button>
                      {l.listingType === "community" && (
                        <button onClick={() => act(l, "suspend")} disabled={busy === l.id} className="border border-gray-200 text-gray-500 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                          <PauseCircle className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                    </>
                  )}
                  {["suspended", "rejected"].includes(l.status) && (
                    <button onClick={() => act(l, "approve")} disabled={busy === l.id} className="flex-1 bg-teal-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Re-approve
                    </button>
                  )}
                  {l.listingType === "business" && (
                    <button onClick={() => { setEditing(l); setShowBusinessForm(true); }} className="border border-gray-200 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <Link href={`/pets/${l.slug}`} className="text-xs font-semibold text-teal-700 hover:underline text-center py-1">View page</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900">Reject "{rejecting.name}"</h3>
            <p className="text-xs text-gray-500 mt-1 mb-3">The owner will see this reason and can resubmit after changes.</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Reason (e.g. photos unclear, missing vaccination info, prohibited species…)"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:border-red-300"
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejecting(null); setRejectNote(""); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
              <button
                onClick={() => act(rejecting, "reject", rejectNote || undefined)}
                disabled={busy === rejecting.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business listing form */}
      {showBusinessForm && (
        <BusinessListingForm
          listing={editing}
          onClose={() => { setShowBusinessForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_review: "bg-amber-50 text-amber-700",
    approved: "bg-teal-50 text-teal-700",
    rejected: "bg-red-50 text-red-600",
    sold: "bg-gray-100 text-gray-600",
    adopted: "bg-pink-50 text-pink-600",
    closed: "bg-gray-100 text-gray-500",
    suspended: "bg-red-50 text-red-600",
  };
  return <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${map[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
}

function BusinessListingForm({ listing, onClose }: { listing: Listing | null; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(listing?.media?.map((m) => m.url) || []);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: listing?.name || "", species: listing?.species || "Dog", breed: listing?.breed || "",
    gender: listing?.gender || "", ageMonths: listing?.ageText || "", price: listing?.price || "",
    priceType: listing?.priceType || "fixed", city: listing?.city || "",
    description: listing?.description || "", temperament: listing?.temperament || "",
    healthInfo: listing?.healthInfo || "", vaccinated: listing?.vaccinated ?? false,
    vaccinationDetails: listing?.vaccinationDetails || "", featured: listing?.featured ?? false,
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 8 - images.length)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json();
        if (d.url) setImages((prev) => [...prev, d.url]);
      }
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listing?.id,
          ...form,
          ageMonths: undefined,
          ageText: form.ageMonths,
          images,
          status: "approved",
          isVerified: true,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
        <h3 className="font-bold text-gray-900 text-lg mb-4">{listing ? `Edit ${listing.name}` : "New Business Pet"}</h3>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input required placeholder="Pet name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className={input}>
              {["Dog", "Cat", "Bird", "Small Pet", "Other"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <input placeholder="Breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className={input} />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={input}>
              <option value="">Gender…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input placeholder='Age e.g. "3 months"' value={form.ageMonths} onChange={(e) => setForm({ ...form, ageMonths: e.target.value })} className={input} />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
            <select value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })} className={input}>
              <option value="fixed">Fixed price</option>
              <option value="negotiable">Negotiable</option>
              <option value="adoption_fee">Adoption fee</option>
              <option value="free">Free</option>
            </select>
            {form.priceType !== "free" && (
              <input required type="number" placeholder="Price ₹" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
            )}
          </div>
          <textarea required placeholder="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={input} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Temperament" value={form.temperament} onChange={(e) => setForm({ ...form, temperament: e.target.value })} className={input} />
            <input placeholder="Health info" value={form.healthInfo} onChange={(e) => setForm({ ...form, healthInfo: e.target.value })} className={input} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.vaccinated} onChange={(e) => setForm({ ...form, vaccinated: e.target.checked })} className="accent-teal-600" /> Vaccinated
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-amber-500" /> Featured on homepage
            </label>
          </div>
          {form.vaccinated && (
            <input placeholder="Vaccination details" value={form.vaccinationDetails} onChange={(e) => setForm({ ...form, vaccinationDetails: e.target.value })} className={input} />
          )}

          {/* Images */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Photos *</p>
            <div className="flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((u) => u !== url))} className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-0.5">
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-teal-400">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
            <button type="submit" disabled={saving || images.length === 0} className="flex-1 py-3 rounded-xl bg-teal-700 text-white font-bold disabled:opacity-50">
              {saving ? "Saving…" : listing ? "Save Changes" : "Publish Listing"}
            </button>
          </div>
          {images.length === 0 && <p className="text-xs text-amber-600">Add at least one photo.</p>}
        </form>
      </div>
    </div>
  );
}

export default function AdminListingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <ListingsContent />
    </Suspense>
  );
}
