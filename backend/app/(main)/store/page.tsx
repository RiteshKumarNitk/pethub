import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { products, services } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import {
  MapPin, Phone, Clock, MessageCircle, Navigation, Store as StoreIcon,
  PackageCheck, Scissors, PawPrint, BadgeCheck, ArrowRight, Dog, Cat, Bird,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { whatsappLink, whatsappNumber } from "@/lib/contact";

export const metadata: Metadata = {
  // Layout adds the "| PawStore" suffix via its title template
  title: "Visit Our Store",
  description:
    "Visit our pet shop in Mumbai — meet the pets, shop supplies in person, book grooming, and get expert advice from people who know pets.",
  alternates: { canonical: "/store" },
  openGraph: {
    title: "Visit Our Store | PawStore",
    description:
      "Meet the pets, shop supplies in person, book grooming, and get expert advice at our Mumbai store.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const settings = await getSettings();
  const phoneHref = `tel:${settings.storePhone.replace(/\s/g, "")}`;
  const waNumber = settings.whatsappNumber || whatsappNumber;

  // In-store highlights: products physically on our shelves right now
  const [inStoreProducts, storeServices] = await Promise.all([
    db
      .select({ id: products.id, slug: products.slug, name: products.name, imageUrl: products.imageUrl, petType: products.petType })
      .from(products)
      .where(and(eq(products.active, true), gt(products.storeStock, 0)))
      .orderBy(desc(products.storeStock))
      .limit(8),
    db
      .select({ id: services.id, name: services.name, description: services.description })
      .from(services)
      .where(eq(services.active, true))
      .limit(6),
  ]);

  const mapsQuery = encodeURIComponent(settings.storeAddress);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">A real shop, online</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Visit Our Store</h1>
        <p className="text-gray-500 mt-3">
          Meet the pets in person, see products before you buy, and let our team help you choose what's right for your
          animal. Walk in any day — no appointment needed for shopping.
        </p>
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="font-bold text-gray-900 mb-1">Where we are</h2>
          <p className="text-sm text-gray-600">{settings.storeAddress}</p>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:underline"
          >
            <Navigation className="w-4 h-4" /> Get directions
          </a>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="font-bold text-gray-900 mb-1">Opening hours</h2>
          <p className="text-sm text-gray-600">{settings.storeHours}</p>
          <p className="text-xs text-gray-400 mt-2">Grooming appointments run during store hours — book ahead online.</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
            <Phone className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="font-bold text-gray-900 mb-1">Talk to us</h2>
          <div className="flex flex-col gap-1.5 mt-0.5">
            <a href={phoneHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-orange-600">
              <Phone className="w-3.5 h-3.5 text-teal-600" /> {settings.storePhone}
            </a>
            <a
              href={whatsappLink(waNumber, "Hi! I have a question about your store.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-orange-600"
            >
              <MessageCircle className="w-3.5 h-3.5 text-teal-600" /> WhatsApp us
            </a>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-orange-600">
              <ArrowRight className="w-3.5 h-3.5 text-teal-600" /> Send a message
            </Link>
          </div>
        </div>
      </div>

      {/* Map + what you can do here */}
      <div className="grid lg:grid-cols-2 gap-6 mb-12">
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 min-h-[280px]">
          <iframe
            title="PawStore location map"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="w-full h-full min-h-[280px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-black text-gray-900 text-lg mb-4">What you can do here</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-4.5 h-4.5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Meet our pets</p>
                <p className="text-sm text-gray-500">
                  Pets listed as "verified by our shop" are here, in the store. Spend time with them before deciding.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <PackageCheck className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Shop in person — or reserve online</p>
                <p className="text-sm text-gray-500">
                  Products marked <span className="font-semibold text-teal-700">In stock at our store</span> are on our
                  shelves. Order online with store pickup and collect the same day.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Grooming & care services</p>
                <p className="text-sm text-gray-500">
                  Full grooming, baths, nail trims and more — done by our team while you wait or shop.
                </p>
              </div>
            </li>
          </ul>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link href="/pets?type=business" className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl">
              See Our Pets
            </Link>
            <Link href="/services" className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl">
              Book a Service
            </Link>
            <Link href="/shop?inStore=true" className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl">
              Shop In-Store Items
            </Link>
          </div>
        </div>
      </div>

      {/* Store pickup explainer */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 mb-12">
        <div className="flex items-start gap-3 mb-3">
          <StoreIcon className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-black text-teal-900">Order online, pick up at the store</h2>
            <p className="text-sm text-teal-800/80 mt-1">
              Choose <strong>Store Pickup</strong> at checkout on any item that's in stock at our store. We'll keep it
              ready at the counter — usually within a few hours during opening times. You pay online, no queueing.
            </p>
          </div>
        </div>
      </div>

      {/* On our shelves */}
      {inStoreProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">On our shelves right now</h2>
              <p className="text-sm text-gray-500 mt-0.5">A live look at what's in the store — come see it in person.</p>
            </div>
            <Link href="/shop?inStore=true" className="text-sm font-bold text-orange-600 hover:underline whitespace-nowrap">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inStoreProducts.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-square bg-gray-50 relative">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {p.petType === "cat" ? <Cat className="w-8 h-8 text-gray-300" /> : p.petType === "small_pet" ? <Bird className="w-8 h-8 text-gray-300" /> : <Dog className="w-8 h-8 text-gray-300" />}
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-teal-600 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> IN STORE
                  </span>
                </div>
                <p className="p-3 text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600">{p.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Services at the store */}
      {storeServices.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900">Services at the store</h2>
            <Link href="/services" className="text-sm font-bold text-orange-600 hover:underline">Book an appointment</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {storeServices.map((s) => (
              <Link
                key={s.id}
                href="/services"
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 hover:border-teal-200 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scissors className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-400 truncate">{s.description.slice(0, 60)}</p>}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PetStore",
            name: settings.storeName,
            description: "Pet shop offering pet supplies, pets from our shop, and grooming services.",
            address: { "@type": "PostalAddress", streetAddress: settings.storeAddress },
            telephone: settings.storePhone,
            openingHours: settings.storeHours,
          }),
        }}
      />
    </div>
  );
}
