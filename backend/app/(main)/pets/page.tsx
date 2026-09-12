"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PawPrint, BadgeCheck, Users, MapPin, Heart, ShieldCheck, ChevronLeft, ChevronRight, Loader2, Search,
} from "lucide-react";
import { PetGridCard } from "@/components/PetGridCard";

interface Listing {
  id: number; slug: string; name: string; species: string; breed: string | null;
  gender: string | null; ageText: string | null; price: string | null; priceType: string;
  listingType: string; isVerified: boolean; city: string | null; vaccinated: boolean;
  primaryImage: string | null;
}

const speciesOptions = ["all", "Dog", "Cat", "Bird", "Small Pet", "Other"];

function PetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "all";
  const species = searchParams.get("species") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/pets?${params.toString()}`);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (species !== "all") params.set("species", species);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", "12");
    fetch(`/api/pet-listings?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setListings(d.listings || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [type, species, search, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-black text-gray-900">Find Your New Best Friend</h1>
        <p className="text-gray-500 mt-2">
          Pets from our shop are <strong className="text-teal-700">verified by us</strong> — health-checked and seen in person.
          Community listings are reviewed by our team but come from individual pet parents.
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
        {[
          { value: "all", label: "All Pets", icon: PawPrint },
          { value: "business", label: "Verified by Our Shop", icon: BadgeCheck },
          { value: "community", label: "Community Listings", icon: Users },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setParam("type", t.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              type === t.value ? "bg-teal-700 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setParam("search", searchInput); }}
          className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 max-w-xs"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search breed, name…"
            className="w-full px-3 py-2 text-sm focus:outline-none"
          />
          <button type="submit" className="px-3 text-gray-400 hover:text-teal-600"><Search className="w-4 h-4" /></button>
        </form>
        <select
          value={species}
          onChange={(e) => setParam("species", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          {speciesOptions.map((s) => <option key={s} value={s}>{s === "all" ? "All species" : s}</option>)}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{total} pet{total !== 1 ? "s" : ""}</span>
        <Link
          href="/sell-rehome"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          <Heart className="w-4 h-4" /> Sell / Rehome
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-6">
          <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No pets found</h3>
          <p className="text-sm text-gray-500 mt-1">New pets are listed regularly — check back soon, or browse all types.</p>
          <button onClick={() => router.push("/pets")} className="mt-4 text-sm font-bold text-teal-700 hover:underline">View all pets</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {listings.map((pet) => <PetGridCard key={pet.id} pet={pet} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => setParam("page", String(page - 1))} disabled={page <= 1} className="p-2 border border-gray-200 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setParam("page", String(page + 1))} disabled={page >= totalPages} className="p-2 border border-gray-200 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {/* Trust note */}
      <div className="mt-12 bg-teal-50 border border-teal-100 rounded-2xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-teal-700 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-teal-900">Trust & Safety First</h3>
          <p className="text-sm text-teal-800/80 mt-1">
            Never send money in advance for community listings without meeting the pet. Always verify vaccination records and
            health condition in person. <Link href="/contact" className="font-bold underline">Report a suspicious listing</Link> — our team reviews every report.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PetsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>}>
      <PetsContent />
    </Suspense>
  );
}
