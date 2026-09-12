"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Loader2, X, Check, Pencil, Trash2 } from "lucide-react";

const emptyForm = { label: "Home", fullName: "", phone: "", street: "", landmark: "", city: "", state: "", zip: "", isDefault: false };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const d = await res.json();
          setAddresses((prev) => prev.map((a) => (a.id === editingId ? d.address : a)));
        }
      } else {
        const res = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const d = await res.json();
          setAddresses((prev) => [...prev, d.address]);
        }
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const edit = (a: any) => {
    setEditingId(a.id);
    setForm({
      label: a.label, fullName: a.fullName || "", phone: a.phone || "", street: a.street,
      landmark: a.landmark || "", city: a.city, state: a.state, zip: a.zip, isDefault: a.isDefault,
    });
    setShowForm(true);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-gray-900 text-lg">Saved Addresses</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No saved addresses</h3>
          <p className="text-sm text-gray-500 mt-1">Save an address for faster checkout.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={`bg-white border rounded-2xl p-4 ${a.isDefault ? "border-orange-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-orange-600">{a.label}</span>
                {a.isDefault && <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">DEFAULT</span>}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{a.fullName || ""}</p>
              <p className="text-sm text-gray-600 mt-0.5">{a.street}{a.landmark ? `, ${a.landmark}` : ""}</p>
              <p className="text-sm text-gray-600">{a.city}, {a.state} {a.zip}</p>
              {a.phone && <p className="text-xs text-gray-400 mt-1">{a.phone}</p>}
              <div className="flex gap-3 mt-3">
                <button onClick={() => edit(a)} className="text-xs font-bold text-teal-700 flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => remove(a.id)} className="text-xs font-bold text-red-500 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{editingId ? "Edit address" : "Add address"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls}>
                  {["Home", "Work", "Other"].map((l) => <option key={l}>{l}</option>)}
                </select>
                <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
              </div>
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              <input required placeholder="Street address *" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className={inputCls} />
              <input placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-3 gap-3">
                <input required placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
                <input required placeholder="State *" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} />
                <input required placeholder="ZIP *" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-orange-500" />
                Set as default address
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
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

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300";
