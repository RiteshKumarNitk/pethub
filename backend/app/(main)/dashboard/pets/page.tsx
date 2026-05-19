"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dog,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  Cat,
  Bird,
  Weight,
  Calendar,
  PawPrint,
} from "lucide-react";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  age: number | null;
  weight: string | null;
  imageUrl: string | null;
  createdAt: string;
}

const speciesOptions = ["Dog", "Cat", "Bird", "Other"];

const speciesIcon = (species: string) => {
  switch (species) {
    case "Dog": return <Dog className="w-6 h-6" />;
    case "Cat": return <Cat className="w-6 h-6" />;
    case "Bird": return <Bird className="w-6 h-6" />;
    default: return <PawPrint className="w-6 h-6" />;
  }
};

const speciesColor = (species: string) => {
  switch (species) {
    case "Dog": return "bg-orange-50 text-orange-500";
    case "Cat": return "bg-purple-50 text-purple-500";
    case "Bird": return "bg-blue-50 text-blue-500";
    default: return "bg-green-50 text-green-500";
  }
};

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    age: "",
    weight: "",
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pets");
      const data = await res.json();
      if (data.pets) setPets(data.pets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPet(null);
    setForm({ name: "", species: "Dog", breed: "", age: "", weight: "" });
    setShowModal(true);
  };

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      age: pet.age?.toString() || "",
      weight: pet.weight?.toString() || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPet) {
        const res = await fetch(`/api/pets/${editingPet.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          await fetchPets();
          setShowModal(false);
        }
      } else {
        const res = await fetch("/api/pets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          await fetchPets();
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this pet?")) return;
    try {
      const res = await fetch(`/api/pets/${id}`, { method: "DELETE" });
      if (res.ok) await fetchPets();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-3 tracking-tight flex items-center gap-3">
            <Dog className="w-8 h-8 text-orange-500" />
            My Pets
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            {pets.length} pet{pets.length !== 1 ? "s" : ""} in your family
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-3 px-6 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-16 border border-gray-50 shadow-sm text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Dog className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No pets added yet</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Add your furry friend to get started</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Your First Pet
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet, i) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${speciesColor(pet.species)}`}>
                  {speciesIcon(pet.species)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-[hsl(var(--secondary))] truncate">{pet.name}</h3>
                  <span className="inline-block px-2.5 py-1 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {pet.age !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-[hsl(var(--secondary))]">{pet.age} years old</span>
                  </div>
                )}
                {pet.weight !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Weight className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-[hsl(var(--secondary))]">{pet.weight} kg</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                <button
                  onClick={() => openEdit(pet)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-xs font-black uppercase tracking-widest"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(pet.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all text-xs font-black uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">
                  {editingPet ? "Edit Pet" : "Add New Pet"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pet Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Max"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Species</label>
                  <select
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value })}
                  >
                    {speciesOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Breed (optional)</label>
                  <input
                    type="text"
                    placeholder="Golden Retriever"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Age (years)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="2"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="12.5"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    className="flex-1 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingPet ? "Update Pet" : "Add Pet"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
