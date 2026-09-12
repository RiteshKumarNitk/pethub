"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PawPrint, BadgeCheck, Users, MapPin, ShieldCheck, Heart, Flag,
  Syringe, Sparkles, Phone, Mail, ChevronRight, Loader2, Check, MessageCircle,
} from "lucide-react";

interface Detail {
  listing: {
    id: number; slug: string; listingType: string; name: string; species: string; breed: string | null;
    gender: string | null; ageText: string | null; ageMonths: number | null; color: string | null; size: string | null;
    price: string | null; priceType: string; city: string | null; state: string | null;
    description: string | null; temperament: string | null; healthInfo: string | null;
    vaccinated: boolean; vaccinationDetails: string | null; videoUrl: string | null;
    isVerified: boolean; viewCount: number; featured: boolean; createdAt: string;
  };
  media: { id: number; url: string; type: string; alt: string | null }[];
  ownerName: string | null;
  contact: { contactPreference: string };
  related: { id: number; slug: string; name: string; species: string; breed: string | null; ageText: string | null; price: string | null; listingType: string; isVerified: boolean }[];
}

export default function PetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    fetch(`/api/pet-listings/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }
  if (notFound || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-32 px-4">
        <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Pet not found</h1>
        <p className="text-gray-500 text-sm mt-1">This listing may have been adopted, sold, or removed.</p>
        <Link href="/pets" className="mt-5 inline-block bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl">Explore More Pets</Link>
      </div>
    );
  }

  const { listing: l, media, related } = data;
  const isBusiness = l.listingType === "business";
  const isFree = l.priceType === "free";
  const gallery = media.filter((m) => m.type === "image");

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pet",
          subject: `Enquiry about ${l.name}`,
          message: enquiryMsg,
          relatedListingId: l.id,
          contactInfo: undefined,
          contactEmail: contactInfo.includes("@") ? contactInfo : undefined,
          contactPhone: !contactInfo.includes("@") && contactInfo ? contactInfo : undefined,
        }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => { setSent(false); setEnquiryOpen(false); setEnquiryMsg(""); setContactInfo(""); }, 2500);
      }
    } finally {
      setSending(false);
    }
  };

  const submitReport = async () => {
    if (!reportReason) return;
    await fetch("/api/pet-listings/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: l.id, reason: reportReason }),
    });
    setReportSent(true);
    setTimeout(() => { setReportSent(false); setReportOpen(false); }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-teal-700">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/pets" className="hover:text-teal-700">Pets</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">{l.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/3] bg-gray-100 rounded-3xl overflow-hidden relative">
            {gallery[selectedMedia] ? (
              <Image src={gallery[selectedMedia].url} alt={l.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><PawPrint className="w-16 h-16 text-gray-300" /></div>
            )}
            <span className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${isBusiness ? "bg-teal-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}>
              {isBusiness ? <><BadgeCheck className="w-3.5 h-3.5" /> VERIFIED BY OUR SHOP</> : <><Users className="w-3.5 h-3.5" /> COMMUNITY LISTING</>}
            </span>
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {gallery.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMedia(i)}
                  className={`relative w-18 h-14 w-[72px] rounded-xl overflow-hidden border-2 flex-shrink-0 ${i === selectedMedia ? "border-teal-600" : "border-gray-100"}`}
                >
                  <Image src={m.url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
          {l.videoUrl && (
            <a href={l.videoUrl} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline">
              ▶ Watch video of {l.name}
            </a>
          )}
        </div>

        {/* Profile */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{l.name}</h1>
              <p className="text-gray-500 mt-1">{[l.breed, l.species].filter(Boolean).join(" · ")}</p>
            </div>
            {!isFree && l.price && (
              <div className="text-right">
                <p className="text-2xl font-black text-teal-700">₹{parseFloat(l.price).toFixed(0)}</p>
                <p className="text-xs text-gray-400 capitalize">{l.priceType.replace("_", " ")}</p>
              </div>
            )}
            {isFree && <span className="bg-pink-50 text-pink-600 font-bold text-sm px-3 py-1.5 rounded-xl">Free to good home</span>}
          </div>

          {/* Quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Age", value: l.ageText || (l.ageMonths ? `${l.ageMonths} mo` : "—") },
              { label: "Gender", value: l.gender ? l.gender.charAt(0).toUpperCase() + l.gender.slice(1) : "—" },
              { label: "Location", value: l.city || "In-store" },
              { label: "Vaccinated", value: l.vaccinated ? "Yes" : "Info on request" },
            ].map((f) => (
              <div key={f.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{f.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Verification explanation */}
          <div className={`mt-6 rounded-2xl p-4 border ${isBusiness ? "bg-teal-50 border-teal-100" : "bg-amber-50 border-amber-100"}`}>
            <div className="flex items-start gap-3">
              {isBusiness ? <BadgeCheck className="w-6 h-6 text-teal-700 flex-shrink-0" /> : <Users className="w-6 h-6 text-amber-600 flex-shrink-0" />}
              <div>
                <h3 className="font-bold text-sm text-gray-900">
                  {isBusiness ? "Verified by our shop" : "Community listing — reviewed, not verified"}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {isBusiness
                    ? "This pet is at our shop. We've seen this pet in person, reviewed its health records, and stand behind this listing. Visit us to meet them!"
                    : "This listing comes from an individual pet parent and was reviewed by our team for basic safety. It is NOT verified by our shop. Always meet the pet in person and check health records before proceeding."}
                </p>
              </div>
            </div>
          </div>

          {/* Health & temperament chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {l.vaccinated && (
              <span className="flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <Syringe className="w-3.5 h-3.5" /> Vaccinated
              </span>
            )}
            {l.temperament && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <Heart className="w-3.5 h-3.5" /> {l.temperament}
              </span>
            )}
            {l.size && (
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full capitalize">
                <Sparkles className="w-3.5 h-3.5" /> {l.size} size
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <button
              onClick={() => setEnquiryOpen(true)}
              className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              {isBusiness ? "Contact Our Shop" : "Contact Seller"}
            </button>
            <button
              onClick={() => setReportOpen(true)}
              className="px-5 py-4 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Flag className="w-4 h-4" /> Report
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            We respond to enquiries within 24 hours during store hours. No payment is required to enquire.
          </p>
        </div>
      </div>

      {/* Details sections */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        {l.description && (
          <section>
            <h2 className="font-black text-gray-900 text-lg mb-3">About {l.name}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{l.description}</p>
          </section>
        )}
        {(l.healthInfo || l.vaccinationDetails) && (
          <section>
            <h2 className="font-black text-gray-900 text-lg mb-3">Health & Vaccination</h2>
            {l.vaccinationDetails && (
              <p className="text-sm text-gray-600 flex items-start gap-2 mb-2">
                <Syringe className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" /> {l.vaccinationDetails}
              </p>
            )}
            {l.healthInfo && <p className="text-sm text-gray-600">{l.healthInfo}</p>}
          </section>
        )}
      </div>

      {/* Related pets */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-gray-900 mb-5">Other {l.species}s You Might Love</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/pets/${r.slug}`} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  {r.isVerified && <BadgeCheck className="w-4 h-4 text-teal-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{[r.breed, r.ageText].filter(Boolean).join(" · ")}</p>
                <p className="text-sm font-extrabold text-teal-700 mt-1.5">{r.price ? `₹${parseFloat(r.price).toFixed(0)}` : "Enquire"}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== Enquiry Modal ===== */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !sending && setEnquiryOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Enquiry sent!</h3>
                <p className="text-sm text-gray-500 mt-1">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={submitEnquiry}>
                <h3 className="font-bold text-gray-900 text-lg">Enquire about {l.name}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Tell us a little about yourself and your home — this helps us (or the seller) find the right match.
                </p>
                <textarea
                  required
                  minLength={10}
                  value={enquiryMsg}
                  onChange={(e) => setEnquiryMsg(e.target.value)}
                  rows={4}
                  placeholder={`Hi, I'm interested in ${l.name}. Could you tell me more about…`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 mb-3"
                />
                <input
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Your phone or email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 mb-4"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEnquiryOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
                  <button type="submit" disabled={sending} className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Enquiry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===== Report Modal ===== */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setReportOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-6">
                <Check className="w-10 h-10 text-teal-600 mx-auto mb-3" />
                <p className="font-bold text-gray-900">Report received</p>
                <p className="text-xs text-gray-500 mt-1">Our team will review this listing.</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 text-lg">Report this listing</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">Why are you reporting this listing?</p>
                <div className="space-y-2 mb-4">
                  {[
                    ["suspected_scam", "Suspected scam or fraud"],
                    ["animal_welfare", "Animal welfare concern"],
                    ["prohibited_species", "Prohibited species"],
                    ["wrong_information", "Wrong or misleading information"],
                    ["already_sold", "Pet already sold/adopted"],
                    ["other", "Other"],
                  ].map(([value, label]) => (
                    <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm ${reportReason === value ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                      <input type="radio" name="reason" value={value} checked={reportReason === value} onChange={() => setReportReason(value)} className="accent-red-500" />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setReportOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-600 text-sm">Cancel</button>
                  <button onClick={submitReport} disabled={!reportReason} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-50">Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
