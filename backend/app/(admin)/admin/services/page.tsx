"use client";

import { useEffect, useState } from "react";
import {
  Scissors, Loader2, Plus, Pencil, X, Check, Clock, Power,
} from "lucide-react";

const emptyForm = {
  name: "", description: "", longDescription: "", imageUrl: "", durationMinutes: "60",
  price: "", priceNote: "", petTypes: ["dog", "cat"] as string[],
  depositAmount: "0", requiresDeposit: false, active: true, sortOrder: "0",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name, description: s.description || "", longDescription: s.longDescription || "",
      imageUrl: s.imageUrl || "", durationMinutes: String(s.durationMinutes), price: s.price,
      priceNote: s.priceNote || "", petTypes: s.petTypes || ["dog", "cat"],
      depositAmount: s.depositAmount || "0", requiresDeposit: s.requiresDeposit,
      active: s.active, sortOrder: String(s.sortOrder),
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: any) => {
    await fetch("/api/admin/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">Grooming and care services customers can book.</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 ${s.active ? "border-gray-100" : "border-gray-100 opacity-50"}`}>
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scissors className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{s.name} {!s.active && <span className="text-xs text-gray-400 font-medium">(inactive)</span>}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{s.description}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.durationMinutes} min</span>
                <span className="capitalize">{(s.petTypes || []).join(", ").replace("_", " ")}</span>
                {s.requiresDeposit && <span className="text-amber-600 font-semibold">Deposit ₹{parseFloat(s.depositAmount).toFixed(0)}</span>}
              </p>
            </div>
            <p className="font-black text-teal-700 flex-shrink-0">₹{parseFloat(s.price).toFixed(0)}</p>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-teal-700" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => toggleActive(s)} className="p-2 text-gray-400 hover:text-amber-600" aria-label="Toggle active"><Power className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700">No services yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first service — grooming, bath, nail trim…</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{editingId ? "Edit service" : "New service"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <input required placeholder="Service name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <textarea required placeholder="Short description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} />
              <textarea placeholder="Full description (shown on service page)" value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} rows={3} className={inputCls} />
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs text-gray-400">Duration (min)
                  <input required type="number" min="15" step="15" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Price ₹*
                  <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Sort order
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={inputCls} />
                </label>
              </div>
              <input placeholder="Price note (e.g. 'starting at, by size')" value={form.priceNote} onChange={(e) => setForm({ ...form, priceNote: e.target.value })} className={inputCls} />
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Pet types</p>
                <div className="flex gap-4">
                  {[["dog", "Dog"], ["cat", "Cat"], ["small_pet", "Small Pet"], ["bird", "Bird"]].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-1.5 text-sm text-gray-700 capitalize">
                      <input
                        type="checkbox"
                        checked={form.petTypes.includes(value)}
                        onChange={(e) => setForm({
                          ...form,
                          petTypes: e.target.checked ? [...form.petTypes, value] : form.petTypes.filter((t) => t !== value),
                        })}
                        className="accent-teal-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.requiresDeposit} onChange={(e) => setForm({ ...form, requiresDeposit: e.target.checked })} className="accent-amber-500" />
                  Requires deposit
                </label>
                {form.requiresDeposit && (
                  <input type="number" min="0" placeholder="Deposit ₹" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-teal-700 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400";
