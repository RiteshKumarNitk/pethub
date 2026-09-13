"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, ShieldCheck, Star, PawPrint, Scissors, Heart, MapPin,
  Phone, Truck, BadgeCheck, Clock, Sparkles, ChevronRight, Store, CalendarCheck,
} from "lucide-react";
import { useCart } from "@/components/Navbar";

interface Product { id: number; slug: string; name: string; price: string; mrp: string | null; imageUrl: string | null; stock: number }
interface PetCard { id: number; slug: string; name: string; species: string; breed: string | null; ageText: string | null; price: string | null; priceType: string; listingType: string; isVerified: boolean; city: string | null; primaryImage: string | null; intent?: string }
interface ServiceCard { id: number; slug: string; name: string; price: string; imageUrl: string | null; durationMinutes: number; priceNote: string | null }
interface Article { title: string; slug: string; excerpt: string | null; thumbnailUrl: string | null; readMinutes: number }
interface HomeData {
  settings: { storeName: string; tagline: string; storePhone: string; whatsappNumber: string; storeAddress: string; storeHours: string; freeShippingAbove: number };
  heroBanners: { id: number; title: string; subtitle: string | null; description: string | null; ctaLabel: string | null; ctaLink: string | null }[];
  categories: { id: number; name: string; slug: string; icon: string | null }[];
  needs: { id: number; name: string; slug: string; icon: string | null }[];
  featuredProducts: Product[];
  bestSellers: Product[];
  pets: PetCard[];
  services: ServiceCard[];
  articles: Article[];
  faqs: { id: number; question: string; answer: string }[];
  testimonials: { rating: number; comment: string | null; userName: string | null }[];
}

const pillars = [
  { title: "Shop Products", desc: "Food, toys, grooming & more from trusted brands", href: "/shop", icon: Store, color: "bg-orange-50 text-orange-600" },
  { title: "Meet Our Pets", desc: "Pets from our shop — health-checked & verified by us", href: "/pets?type=business", icon: PawPrint, color: "bg-teal-50 text-teal-600" },
  { title: "Book a Service", desc: "Grooming, baths & care at our store", href: "/services", icon: Scissors, color: "bg-blue-50 text-blue-600" },
  { title: "Sell / Rehome", desc: "Find a loving home for your pet — safely", href: "/sell-rehome", icon: Heart, color: "bg-pink-50 text-pink-600" },
];

export default function Home() {
  const { refresh } = useCart();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addToCart = async (p: Product) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, qty: 1 }),
      });
      if (res.ok) {
        setAddedId(p.id);
        refresh();
        setTimeout(() => setAddedId(null), 1500);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="animate-pulse space-y-8">
          <div className="h-72 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}</div>
        </div>
      </div>
    );
  }

  const hero = data?.heroBanners?.[0];

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <section className="bg-gradient-to-br from-teal-50 via-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-teal-700/10 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <BadgeCheck className="w-3.5 h-3.5" /> A TRUSTED LOCAL PET-CARE DESTINATION
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
              Everything your pet needs,{" "}
              <span className="text-orange-500">in one place.</span>
            </h1>
            <p className="text-gray-600 mt-4 text-lg max-w-md">
              Shop quality products, meet pets from our shop, book grooming services, or find a loving home for a pet — all with a real store behind us.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="/shop" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-colors">
                <ShoppingBag className="w-4 h-4" /> Shop Products
              </Link>
              <Link href="/pets" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-bold px-6 py-3 rounded-xl border border-gray-200 transition-colors">
                <PawPrint className="w-4 h-4 text-teal-600" /> Explore Pets
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 text-teal-800 font-bold px-4 py-3 hover:underline">
                Book a Service <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-teal-600" /> Free delivery above ₹{data?.settings.freeShippingAbove ?? 499}</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> Verified pets & genuine products</span>
            </div>
          </div>
          <div className="hidden md:block">
            {data?.pets?.[0]?.primaryImage ? (
              <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] bg-white">
                <Image src={data.pets[0].primaryImage} alt={data.pets[0].name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-2.5 rounded-xl shadow flex items-center gap-3">
                  <BadgeCheck className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{data.pets[0].name}</p>
                    <p className="text-xs text-gray-500">Verified by our shop</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-gradient-to-br from-teal-100 to-orange-100 aspect-[4/3] flex items-center justify-center">
                <PawPrint className="w-24 h-24 text-white/70" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== 4 PILLARS ===== */}
      <section className="max-w-7xl mx-auto px-4 -mt-0 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {pillars.map((p) => (
            <Link key={p.title} href={p.href} className="group bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${p.color}`}>
                <p.icon className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base">{p.title}</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== SHOP BY NEED ===== */}
      {data?.needs && data.needs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-gray-900">Shop by Need</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {data.needs.map((n) => (
              <Link key={n.id} href={`/shop?need=${n.slug}`} className="flex-shrink-0 snap-start bg-teal-50 border border-teal-100 rounded-xl px-5 py-3.5 shadow-sm hover:border-teal-300 hover:shadow transition-all text-sm font-semibold text-teal-800 hover:text-teal-600 whitespace-nowrap">
                {n.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== SHOP BY PET (taxonomy groups) ===== */}
      {data?.categories && data.categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-gray-900">Shop by Pet</h2>
            <Link href="/shop" className="text-sm font-semibold text-orange-600 hover:underline flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {data.categories.map((c) => (
              <Link key={c.id} href={`/c/${c.slug}`} className="flex-shrink-0 snap-start bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm hover:border-orange-300 hover:shadow transition-all text-sm font-semibold text-gray-700 hover:text-orange-600 whitespace-nowrap">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      <Section title="Featured Products" href="/shop" empty={!data?.featuredProducts?.length}>
        {data?.featuredProducts?.map((p) => (
          <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} added={addedId === p.id} />
        ))}
      </Section>

      {/* ===== AVAILABLE PETS ===== */}
      <section className="bg-gradient-to-b from-teal-50/60 to-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-gray-900">Pets Looking for a Home</h2>
            <Link href="/pets" className="text-sm font-semibold text-teal-700 hover:underline flex items-center gap-1">All pets <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <p className="text-gray-500 text-sm mb-6">Every listing is reviewed by our team. Business-verified pets come from our own shop.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.pets?.slice(0, 8).map((pet) => <PetCardMini key={pet.id} pet={pet} />)}
            {(!data?.pets || data.pets.length === 0) && (
              <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <PawPrint className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No pets listed right now — check back soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <Section title="Pet-Care Services" href="/services" empty={!data?.services?.length} accent="teal">
        {data?.services?.map((s) => (
          <Link key={s.id} href={`/services/${s.slug}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="aspect-[4/3] bg-gradient-to-br from-teal-100 to-blue-100 relative flex items-center justify-center">
              {s.imageUrl ? (
                <Image src={s.imageUrl} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="300px" />
              ) : (
                <Scissors className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900">{s.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> ~{s.durationMinutes} min</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-extrabold text-teal-700">₹{parseFloat(s.price).toFixed(0)}{s.priceNote ? <span className="text-xs text-gray-400 font-medium"> {s.priceNote}</span> : null}</span>
                <span className="text-xs font-bold text-white bg-teal-600 px-3 py-1.5 rounded-lg">Book</span>
              </div>
            </div>
          </Link>
        ))}
      </Section>

      {/* ===== BEST SELLERS ===== */}
      <Section title="Best Sellers" href="/shop?sort=popular" empty={!data?.bestSellers?.length}>
        {data?.bestSellers?.map((p) => <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} added={addedId === p.id} />)}
      </Section>

      {/* ===== WHY US ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Why Pet Parents Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Real shop, real accountability", desc: "We're a physical pet store — visit us, call us, or walk in with your pet. We stand behind every listing and product." },
            { icon: BadgeCheck, title: "Verified, always distinguished", desc: "Business pets are verified by us. Community listings are clearly labelled and manually reviewed before going live." },
            { icon: Heart, title: "Care beyond the sale", desc: "Pet profiles, grooming history, reminders and expert guides — we're with you for your pet's whole life." },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <f.icon className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      {data?.testimonials && data.testimonials.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Loved by Pet Parents</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {data.testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < t.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">"{t.comment}"</p>
                  <p className="text-xs font-bold text-gray-900">{t.userName}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PET CARE ARTICLES ===== */}
      <Section title="Pet Care Guides" href="/pet-care" empty={!data?.articles?.length} accent="amber">
        {data?.articles?.map((a) => (
          <Link key={a.slug} href={`/pet-care/${a.slug}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[16/10] bg-gradient-to-br from-amber-100 to-orange-100 relative">
              {a.thumbnailUrl && <Image src={a.thumbnailUrl} alt={a.title} fill className="object-cover" sizes="350px" />}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-sm leading-snug">{a.title}</h3>
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{a.excerpt}</p>
              <p className="text-xs text-gray-400 mt-2">{a.readMinutes} min read</p>
            </div>
          </Link>
        ))}
      </Section>

      {/* ===== FAQ ===== */}
      {data?.faqs && data.faqs.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {data.faqs.map((f) => (
              <div key={f.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} className="w-full flex items-center justify-between px-5 py-3.5 text-left font-semibold text-gray-800 text-sm">
                  {f.question}
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === f.id ? "rotate-90" : ""}`} />
                </button>
                {openFaq === f.id && <p className="px-5 pb-4 text-sm text-gray-500">{f.answer}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== VISIT US ===== */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl p-8 md:p-12 text-white grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black mb-3">Visit Our Store</h2>
            <p className="text-teal-100 mb-6">Meet the pets in person, get expert advice, and let your pet play while you shop.</p>
            <div className="space-y-2.5 text-sm">
              <p className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-orange-400" /> {data?.settings.storeAddress}</p>
              <p className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-orange-400" /> {data?.settings.storeHours}</p>
              <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-orange-400" /> {data?.settings.storePhone}</p>
            </div>
          </div>
          <div className="flex md:justify-end gap-3">
            <a href={`tel:${data?.settings.storePhone}`} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl">Call the Shop</a>
            <a href={`https://wa.me/${data?.settings.whatsappNumber}`} target="_blank" rel="noopener" className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl border border-white/20">WhatsApp Us</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, href, children, empty, accent = "orange" }: { title: string; href: string; children: React.ReactNode; empty: boolean; accent?: string }) {
  if (empty) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
        <Link href={href} className={`text-sm font-semibold hover:underline flex items-center gap-1 ${accent === "teal" ? "text-teal-700" : "text-orange-600"}`}>
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

function ProductCard({ p, onAdd, added }: { p: Product; onAdd: () => void; added: boolean }) {
  const price = parseFloat(p.price);
  const mrp = p.mrp ? parseFloat(p.mrp) : null;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <Link href={`/shop/${p.slug}`} className="block aspect-square bg-gray-50 relative">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="300px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Store className="w-8 h-8 text-gray-300" /></div>
        )}
        {off > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">{off}% OFF</span>}
        {p.stock === 0 && <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-bold text-gray-500">Out of stock</span>}
      </Link>
      <div className="p-3">
        <Link href={`/shop/${p.slug}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-orange-600 min-h-[40px]">{p.name}</Link>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-extrabold text-gray-900">₹{price.toFixed(0)}</span>
          {mrp && mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toFixed(0)}</span>}
        </div>
        <button
          onClick={onAdd}
          disabled={p.stock === 0}
          className={`w-full mt-2 py-2 rounded-lg text-xs font-bold transition-colors ${p.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : added ? "bg-teal-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
        >
          {p.stock === 0 ? "Out of stock" : added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

function PetCardMini({ pet }: { pet: PetCard }) {
  const isBusiness = pet.listingType === "business";
  const isAdoption = (pet.intent ?? (pet.priceType === "free" || pet.priceType === "adoption_fee" ? "adoption" : "sale")) === "adoption";
  return (
    <Link href={`/pets/${pet.slug}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="aspect-[4/3] bg-gradient-to-br from-teal-50 to-orange-50 relative">
        {pet.primaryImage ? (
          <Image src={pet.primaryImage} alt={pet.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="300px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><PawPrint className="w-8 h-8 text-gray-300" /></div>
        )}
        {isBusiness && (
          <span className="absolute top-2 left-2 bg-teal-600 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" /> VERIFIED BY US
          </span>
        )}
        {!isBusiness && isAdoption && (
          <span className="absolute top-2 left-2 bg-pink-500 text-white text-[9px] font-bold px-2 py-1 rounded-md">
            FOR ADOPTION
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">{pet.name}</h3>
          <span className="text-xs text-gray-400">{pet.species}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{[pet.breed, pet.ageText].filter(Boolean).join(" · ")}</p>
        <p className="text-sm font-extrabold text-teal-700 mt-1.5">
          {isAdoption && !pet.price
            ? "Free to good home"
            : isAdoption && pet.price
              ? `Adoption fee ₹${parseFloat(pet.price).toFixed(0)}`
              : pet.price
                ? `₹${parseFloat(pet.price).toFixed(0)}`
                : "Enquire"}
          <span className="text-xs text-gray-400 font-medium"> {pet.city ? `· ${pet.city}` : ""}</span>
        </p>
      </div>
    </Link>
  );
}
