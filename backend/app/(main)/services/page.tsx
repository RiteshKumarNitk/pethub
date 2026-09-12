"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Scissors, Clock, Loader2, PawPrint, CalendarCheck, ShieldCheck } from "lucide-react";

interface Service {
  id: number; slug: string; name: string; description: string | null;
  imageUrl: string | null; durationMinutes: number; price: string; priceNote: string | null;
  petTypes: string[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          <CalendarCheck className="w-3.5 h-3.5" /> BOOK AT OUR STORE
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Pet-Care Services</h1>
        <p className="text-gray-500 mt-3">
          Professional grooming and care at our shop — experienced hands, gentle handling, and full transparency while
          you wait or shop.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">Services coming soon</h3>
          <p className="text-sm text-gray-500 mt-1">Call us to book grooming in the meantime.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <Link key={s.id} href={`/services/${s.slug}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 to-blue-100 relative">
                {s.imageUrl ? (
                  <Image src={s.imageUrl} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="400px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Scissors className="w-10 h-10 text-white" /></div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg">{s.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{s.durationMinutes} min</span>
                  <span className="flex items-center gap-1 capitalize">
                    <PawPrint className="w-3.5 h-3.5" /> {(s.petTypes || []).join(", ").replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-lg font-black text-teal-700">
                    ₹{parseFloat(s.price).toFixed(0)}
                    {s.priceNote && <span className="text-xs text-gray-400 font-medium"> {s.priceNote}</span>}
                  </p>
                  <span className="bg-teal-700 group-hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Book Now</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 bg-teal-50 border border-teal-100 rounded-2xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-7 h-7 text-teal-700 flex-shrink-0" />
        <div className="text-sm text-teal-900">
          <p className="font-bold">Why book with us?</p>
          <p className="text-teal-800/80 mt-1">
            We're a physical store — your pet is never out of sight for long, you can watch the session, and our groomers
            know every pet by name. Create a pet profile so we keep grooming notes across visits.
          </p>
        </div>
      </div>
    </div>
  );
}
