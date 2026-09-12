"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dog, Plus, Edit3, Trash2, X, Loader2, Cat, Bird, PawPrint, Upload, Check, Syringe,
} from "lucide-react";

interface Pet {
  id: number; name: string; species: string; breed: string | null;
  gender: string | null; birthDate: string | null; ageYears: number | null;
  weightKg: string | null; imageUrl: string | null;
  vaccinations: { name: string; date: string; nextDue?: string }[] | null;
  medicalNotes: string | null; groomerNotes: string | null;
}

const emptyForm = {
  name: "", species: "Dog", breed: "", gender: "", birthDate: "", weightKg: "",
  imageUrl: "", medicalNotes: "", groomerNotes: "",
};

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<typeof emptyForm & { vaccinations: { name: string; date: string }[] }>({ ...emptyForm, vaccinations: [] });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pets")
      .then((r) => r.json())
      .then((d) => setPets(d.pets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openModal = (pet?: Pet) => {
    setEditing(pet || null);
    setForm(pet ? {
      name: pet.name, species: pet.species, breed: pet.breed || "", gender: pet.gender || "",
      birthDate: pet.birthDate || "", weightKg: pet.weightKg || "", imageUrl: pet.imageUrl || "",
      medicalNotes: pet.medicalNotes || "", groomerNotes: pet.groomerNotes || "",
      vaccinations: pet.vaccinations || [],
    } : { ...emptyForm, vaccinations: [] });
    setShowModal(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, vaccinations: form.vaccinations.filter((v) => v.name) };
      if (editing) {
        const res = await fetch(`/api/pets/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
          const d = await res.json();
          setPets((prev) => prev.map((p) => (p.id === editing.id ? d.pet : p)));
        }
      } else {
        const res = await fetch("/api/pets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
          const d = await res.json();
          setPets((prev) => [d.pet, ...prev]);
        }
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this pet profile?")) return;
    const res = await fetch(`/api/pets/${id}`, { method: "DELETE" });
    if (res.ok) setPets((prev) => prev.filter((p) => p.id !== id));
  };

  const speciesIcon = (s: string) => {
    if (s === "Dog") return <Dog className="w-6 h-6" />;
    if (s === "Cat") return <Cat className="w-6 h-6" />;
    if (s === "Bird") return <Bird className="w-6 h-6" />;
    return <PawPrint className="w-6 h-6" />;
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-black text-gray-900 text-lg">My Pets</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pet profiles speed up bookings and help us care better.</p>
        </div>
        <button onClick={() => openModal()} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Dog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No pets added yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Create a profile for each of your pets — book services in one tap and keep vaccination records handy.</p>
          <button onClick={() => openModal()} className="mt-5 bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl">Add Your First Pet</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0 text-orange-500">
                {pet.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  speciesIcon(pet.species)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">{pet.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(pet)} className="p-1.5 text-gray-400 hover:text-orange-500" aria-label="Edit"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => remove(pet.id)} className="p-1.5 text-gray-400 hover:text-red-500" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{[pet.breed, pet.species, pet.gender].filter(Boolean).join(" · ")}</p>
                <div className="flex gap-3 mt-1.5 text-[11px] text-gray-400">
                  {pet.weightKg && <span>{pet.weightKg} kg</span>}
                  {pet.ageYears && <span>{pet.ageYears} yr{pet.ageYears > 1 ? "s" : ""}</span>}
                  {(pet.vaccinations?.length ?? 0) > 0 && (
                    <span className="text-teal-600 font-semibold flex items-center gap-0.5"><Syringe className="w-3 h-3" /> {pet.vaccinations!.length} vax</span>
                  )}
                </div>
                {pet.groomerNotes && <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">📝 {pet.groomerNotes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? `Edit ${editing.name}` : "Add a Pet"}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Pet name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className={inputCls}>
                  {["Dog", "Cat", "Bird", "Small Pet", "Other"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <input placeholder="Breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className={inputCls} />
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
                  <option value="">Gender…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <label className="text-xs text-gray-400">
                  Birth date
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">
                  Weight (kg)
                  <input type="number" step="0.1" min="0" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} className={inputCls} />
                </label>
              </div>

              {/* Photo */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-orange-50 overflow-hidden flex items-center justify-center text-orange-400 flex-shrink-0">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-6 h-6" />
                  )}
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm font-semibold text-teal-700 border border-gray-200 rounded-xl px-4 py-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload photo</>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>

              {/* Vaccinations */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Vaccinations</span>
                  <button type="button" onClick={() => setForm({ ...form, vaccinations: [...form.vaccinations, { name: "", date: "" }] })} className="text-xs font-bold text-teal-700">
                    + Add
                  </button>
                </div>
                {form.vaccinations.map((v, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input placeholder="Vaccine name" value={v.name} onChange={(e) => {
                      const next = [...form.vaccinations]; next[i] = { ...v, name: e.target.value };
                      setForm({ ...form, vaccinations: next });
                    }} className={inputCls} />
                    <input type="date" value={v.date} onChange={(e) => {
                      const next = [...form.vaccinations]; next[i] = { ...v, date: e.target.value };
                      setForm({ ...form, vaccinations: next });
                    }} className={inputCls} />
                    <button type="button" onClick={() => setForm({ ...form, vaccinations: form.vaccinations.filter((_, j) => j !== i) })} className="text-red-400 px-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <textarea placeholder="Medical notes (allergies, conditions…)" value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} rows={2} className={inputCls} />
              <textarea placeholder="Grooming notes (coat type, sensitivities…)" value={form.groomerNotes} onChange={(e) => setForm({ ...form, groomerNotes: e.target.value })} rows={2} className={inputCls} />

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {editing ? "Save Changes" : "Add Pet"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300";
