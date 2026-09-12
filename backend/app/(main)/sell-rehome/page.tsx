"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PawPrint, Upload, X, Loader2, Check, ShieldCheck, ImagePlus, Info,
} from "lucide-react";

const SPECIES = ["Dog", "Cat", "Bird", "Small Pet", "Other"];
const PRICE_TYPES = [
  { value: "fixed", label: "Fixed price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "adoption_fee", label: "Adoption fee" },
  { value: "free", label: "Free to good home" },
];

export default function SellRehomePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ name: string; notice: string } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", species: "Dog", breed: "", gender: "", ageMonths: "", ageText: "",
    price: "", priceType: "fixed", city: "", description: "", temperament: "",
    healthInfo: "", vaccinated: false, vaccinationDetails: "", videoUrl: "",
    contactName: "", contactPhone: "", contactPreference: "platform",
  });

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 8 - images.length)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploaded.push(data.url);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 8));
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (images.length === 0) {
      setError("Please add at least one photo of the pet.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/pet-listings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, images }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
      } else {
        setDone({ name: data.listing.name, notice: data.notice });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Listing submitted!</h1>
        <p className="text-gray-500 mt-2">
          Thank you for choosing a responsible way to rehome <strong>{done.name}</strong>. Our team reviews every listing
          within 24 hours before it goes live.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-6 text-sm text-amber-800 text-left">
          <p className="font-bold flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /> What happens next?</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700/90">
            <li>Our team reviews the listing and photos</li>
            <li>You'll be notified when it's approved (or if we need changes)</li>
            <li>Interested families contact you through the platform</li>
          </ol>
        </div>
        <div className="flex gap-3 mt-8 justify-center">
          <Link href="/account/listings" className="bg-teal-700 text-white font-bold px-6 py-3 rounded-xl">View My Listings</Link>
          <Link href="/pets" className="border border-gray-200 font-bold px-6 py-3 rounded-xl text-gray-700">Browse Pets</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-gray-900">Sell or Rehome Your Pet</h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          Finding a new home for a pet is a big decision. We help you do it safely — every listing is reviewed by our
          team before going live.
        </p>
      </div>

      {/* Moderation notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Listings are subject to review.</p>
          <p className="mt-0.5 text-amber-700/90">
            Your listing will appear publicly only after our team approves it. Listings that appear unsafe, misleading,
            or related to prohibited species are rejected. We may contact you for more information.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-8">
        {/* Pet details */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><PawPrint className="w-5 h-5 text-orange-500" /> About the pet</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Pet name *">
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Bruno" />
            </Field>
            <Field label="Pet type *">
              <select value={form.species} onChange={(e) => set("species", e.target.value)} className={inputCls}>
                {SPECIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Breed">
              <input value={form.breed} onChange={(e) => set("breed", e.target.value)} className={inputCls} placeholder="e.g. Labrador" />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Age">
              <div className="flex gap-2">
                <input value={form.ageMonths} onChange={(e) => set("ageMonths", e.target.value)} type="number" min="0" className={inputCls} placeholder="Months" />
                <input value={form.ageText} onChange={(e) => set("ageText", e.target.value)} className={inputCls} placeholder='or text like "2 years"' />
              </div>
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} placeholder="e.g. Mumbai" />
            </Field>
          </div>
        </section>

        {/* Photos */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><ImagePlus className="w-5 h-5 text-orange-500" /> Photos *</h2>
          <p className="text-xs text-gray-500 mb-4">Clear, recent photos help pets get adopted faster. Up to 8 photos.</p>
          <div className="grid grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((u) => u !== url))}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow"
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
            {images.length < 8 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-400"
              >
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Upload className="w-6 h-6 mb-1" /><span className="text-xs font-semibold">Add photo</span></>}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
          <input
            value={form.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            placeholder="Video URL (optional — YouTube/Drive link)"
            className={`${inputCls} mt-4`}
          />
        </section>

        {/* Rehoming details */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Rehoming details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Listing type *">
              <select value={form.priceType} onChange={(e) => set("priceType", e.target.value)} className={inputCls}>
                {PRICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            {form.priceType !== "free" && (
              <Field label="Price (₹) *">
                <input value={form.price} onChange={(e) => set("price", e.target.value)} type="number" min="0" className={inputCls} placeholder="e.g. 5000" />
              </Field>
            )}
            <Field label="Reason for rehoming / description *">
              <textarea
                required
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                className={inputCls}
                placeholder="Tell potential adopters about the pet's personality, routine, and why a new home is needed…"
              />
            </Field>
            <div>
              <Field label="Temperament">
                <input value={form.temperament} onChange={(e) => set("temperament", e.target.value)} className={inputCls} placeholder="e.g. Friendly, playful" />
              </Field>
              <Field label="Health information">
                <input value={form.healthInfo} onChange={(e) => set("healthInfo", e.target.value)} className={inputCls} placeholder="e.g. Fully healthy, neutered" />
              </Field>
              <label className="flex items-center gap-2 mt-1 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.vaccinated} onChange={(e) => set("vaccinated", e.target.checked)} className="accent-teal-600" />
                Vaccinated
              </label>
              {form.vaccinated && (
                <Field label="Vaccination details">
                  <input value={form.vaccinationDetails} onChange={(e) => set("vaccinationDetails", e.target.value)} className={inputCls} placeholder="e.g. DHPPi + Rabies, Mar 2025" />
                </Field>
              )}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Your contact details</h2>
          <p className="text-xs text-gray-500 mb-4">
            Shown only to serious enquirers through the platform. Never displayed publicly on the listing.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Your name *">
              <input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone *">
              <input required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} type="tel" className={inputCls} placeholder="+91…" />
            </Field>
            <Field label="Preferred contact">
              <select value={form.contactPreference} onChange={(e) => set("contactPreference", e.target.value)} className={inputCls}>
                <option value="platform">Through platform</option>
                <option value="call">Phone call</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : "Submit for Review"}
        </button>
        <p className="text-xs text-gray-400 text-center -mt-4">
          By submitting, you confirm the information and photos are accurate and you have the right to rehome this pet.
        </p>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
