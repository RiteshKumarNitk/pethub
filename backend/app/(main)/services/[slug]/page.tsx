"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors, Clock, Loader2, PawPrint, CalendarCheck, ChevronLeft, ChevronRight,
  Check, Plus, ShieldCheck, Info,
} from "lucide-react";

interface Service {
  id: number; slug: string; name: string; description: string | null; longDescription: string | null;
  imageUrl: string | null; durationMinutes: number; price: string; priceNote: string | null;
  petTypes: string[]; requiresDeposit: boolean; depositAmount: string;
}
interface MyPet { id: number; name: string; species: string; breed: string | null }

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [otherServices, setOtherServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking wizard state
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0 = not started
  const [myPets, setMyPets] = useState<MyPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [manualPet, setManualPet] = useState({ name: "", species: "Dog", breed: "" });
  const [useManualPet, setUseManualPet] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ time: string; available: boolean; reason: string | null }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotTime, setSlotTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{ bookingRef: string; date: string; slotTime: string } | null>(null);

  useEffect(() => {
    fetch(`/api/services/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setService(d.service);
        setOtherServices(d.otherServices || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // Load pets + user if signed in
    fetch("/api/pets")
      .then(async (r) => {
        if (!r.ok) return { pets: [] };
        return r.json();
      })
      .then((d) => setMyPets(d.pets || []))
      .catch(() => {});
    fetch("/api/mobile/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user.name) {
          setCustomerName(d.user.name);
          setCustomerPhone(d.user.phone);
        }
      })
      .catch(() => {});
  }, [slug]);

  const loadSlots = (d: string) => {
    setSlotsLoading(true);
    setSlotTime("");
    fetch(`/api/bookings/slots?date=${d}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  };

  const startBooking = () => {
    setStep(1);
    // Default date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    setDate(iso);
    loadSlots(iso);
  };

  const submitBooking = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service!.id,
          date,
          slotTime,
          petId: !useManualPet ? selectedPetId : undefined,
          petName: useManualPet ? manualPet.name : myPets.find((p) => p.id === selectedPetId)?.name,
          petSpecies: useManualPet ? manualPet.species : myPets.find((p) => p.id === selectedPetId)?.species,
          petBreed: useManualPet ? manualPet.breed : myPets.find((p) => p.id === selectedPetId)?.breed,
          notes,
          customerName,
          customerPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed. Please try again.");
      } else {
        setConfirmed({ bookingRef: data.booking.bookingRef, date, slotTime });
        setStep(3);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  if (notFound || !service) {
    return (
      <div className="max-w-md mx-auto text-center py-32 px-4">
        <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Service not found</h1>
        <Link href="/services" className="mt-5 inline-block bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl">All Services</Link>
      </div>
    );
  }

  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-teal-700">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/services" className="hover:text-teal-700">Services</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">{service.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[16/10] bg-gradient-to-br from-teal-100 to-blue-100 rounded-3xl overflow-hidden relative">
            {service.imageUrl ? (
              <Image src={service.imageUrl} alt={service.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Scissors className="w-14 h-14 text-white" /></div>
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-6">{service.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> ~{service.durationMinutes} minutes</span>
            <span className="flex items-center gap-1.5 capitalize"><PawPrint className="w-4 h-4" /> {(service.petTypes || []).join(", ").replace("_", " ")}</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">₹{parseFloat(service.price).toFixed(0)}</span>
            {service.priceNote && <span className="text-sm text-gray-400">{service.priceNote}</span>}
          </div>
          <div className="prose prose-sm mt-5 text-gray-600">
            <p className="whitespace-pre-line">{service.longDescription || service.description}</p>
          </div>
          {service.requiresDeposit && (
            <p className="mt-4 text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-2.5">
              A refundable deposit of ₹{parseFloat(service.depositAmount).toFixed(0)} is required to confirm this booking.
            </p>
          )}
        </div>

        {/* Booking panel */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 h-fit lg:sticky lg:top-24">
          {step === 0 && (
            <div className="text-center py-6">
              <CalendarCheck className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h2 className="font-black text-gray-900 text-xl">Book this service</h2>
              <p className="text-sm text-gray-500 mt-2 mb-6">Pick a pet, choose a time, done in under a minute.</p>
              <button onClick={startBooking} className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl transition-colors">
                Start Booking
              </button>
              <p className="text-xs text-gray-400 mt-3">No payment needed to request a booking{service.requiresDeposit ? " (deposit added after confirmation)" : ""}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Which pet?</h2>
                <span className="text-xs font-bold text-teal-700">Step 1 of 2</span>
              </div>
              {myPets.length > 0 && (
                <div className="space-y-2 mb-4">
                  {myPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => { setSelectedPetId(pet.id); setUseManualPet(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        !useManualPet && selectedPetId === pet.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                      }`}
                    >
                      <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <PawPrint className="w-4.5 h-4.5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{pet.name}</p>
                        <p className="text-xs text-gray-500">{[pet.breed, pet.species].filter(Boolean).join(" · ")}</p>
                      </div>
                      {!useManualPet && selectedPetId === pet.id && <Check className="w-4 h-4 text-teal-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setUseManualPet(true)}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold ${
                  useManualPet ? "border-teal-500 bg-teal-50 text-teal-700" : "border-dashed border-gray-300 text-gray-500"
                }`}
              >
                <Plus className="w-4 h-4" /> {myPets.length ? "Use a different pet" : "Add pet details"}
              </button>
              {useManualPet && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <input placeholder="Pet name" value={manualPet.name} onChange={(e) => setManualPet({ ...manualPet, name: e.target.value })} className="col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  <select value={manualPet.species} onChange={(e) => setManualPet({ ...manualPet, species: e.target.value })} className="border border-gray-200 rounded-xl px-2 py-2 text-sm">
                    {["Dog", "Cat", "Bird", "Small Pet", "Other"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <input placeholder="Breed (optional)" value={manualPet.breed} onChange={(e) => setManualPet({ ...manualPet, breed: e.target.value })} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              )}
              <button
                onClick={() => {
                  if (useManualPet ? manualPet.name : selectedPetId) setStep(2);
                  else setError("Please choose a pet first");
                }}
                className="w-full mt-5 bg-teal-700 text-white font-bold py-3 rounded-xl"
              >
                Continue
              </button>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Pick date & time</h2>
                <span className="text-xs font-bold text-teal-700">Step 2 of 2</span>
              </div>
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => { setDate(e.target.value); if (e.target.value) loadSlots(e.target.value); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 mb-3"
              />
              {slotsLoading ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" /></div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No slots available on this date. Try another day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setSlotTime(s.time)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        slotTime === s.time
                          ? "bg-teal-700 text-white"
                          : s.available
                            ? "border border-gray-200 text-gray-700 hover:border-teal-400"
                            : "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-2.5">
                <input required placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                <input required placeholder="Your phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                <textarea placeholder="Anything we should know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">{service.name} · {date} {slotTime && `at ${slotTime}`}</p>
                  <p className="font-black text-teal-700">₹{parseFloat(service.price).toFixed(0)}</p>
                </div>
                <button
                  onClick={submitBooking}
                  disabled={submitting || !slotTime || !customerName || !customerPhone}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-teal-700 mt-3">← Change pet</button>
            </div>
          )}

          {step === 3 && confirmed && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-teal-600" />
              </div>
              <h2 className="font-black text-gray-900 text-xl">Booking requested!</h2>
              <p className="text-sm text-gray-500 mt-2">
                Reference <strong className="text-gray-800">{confirmed.bookingRef}</strong> · {confirmed.date} at {confirmed.slotTime}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                We'll confirm your appointment shortly. You'll get a notification once confirmed.
              </p>
              <div className="flex gap-2 mt-6">
                <Link href="/account/bookings" className="flex-1 bg-teal-700 text-white font-bold py-3 rounded-xl text-sm">My Bookings</Link>
                <Link href="/services" className="flex-1 border border-gray-200 font-bold py-3 rounded-xl text-sm text-gray-700">Book Another</Link>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 pt-4 border-t border-gray-100">
            <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-gray-400">
              Free cancellation up to 3 hours before your appointment. Slots update live — no double bookings.
            </p>
          </div>
        </div>
      </div>

      {/* Other services */}
      {otherServices.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-black text-gray-900 mb-5">Other Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherServices.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
                <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">~{s.durationMinutes} min</p>
                <p className="font-black text-teal-700 mt-2">₹{parseFloat(s.price).toFixed(0)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
