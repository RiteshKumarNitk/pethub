"use client";

import { useEffect, useState } from "react";
import { Tag, Loader2, Plus, X, Power, Check } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "", description: "", discountPercent: "", discountFlat: "",
    maxDiscount: "", minOrderAmount: "", maxUses: "", expiresAt: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d) => setCoupons(d.coupons || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Failed to create");
      else {
        setShowForm(false);
        setForm({ code: "", description: "", discountPercent: "", discountFlat: "", maxDiscount: "", minOrderAmount: "", maxUses: "", expiresAt: "" });
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: any) => {
    await fetch("/api/admin/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Discount codes applied at checkout.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className={`bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 ${!c.active ? "opacity-50" : ""}`}>
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 font-mono">{c.code}</p>
              <p className="text-xs text-gray-500">
                {c.discountPercent > 0 ? `${c.discountPercent}% off` : `₹${parseFloat(c.discountFlat).toFixed(0)} off`}
                {c.maxDiscount && parseFloat(c.maxDiscount) > 0 && ` (max ₹${parseFloat(c.maxDiscount).toFixed(0)})`}
                {parseFloat(c.minOrderAmount) > 0 && ` · min order ₹${parseFloat(c.minOrderAmount).toFixed(0)}`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Used {c.usedCount}{c.maxUses > 0 ? `/${c.maxUses}` : ""} times
                {c.expiresAt && ` · expires ${new Date(c.expiresAt).toLocaleDateString()}`}
              </p>
            </div>
            <button onClick={() => toggle(c)} className={`p-2 ${c.active ? "text-teal-600" : "text-gray-300"}`} aria-label="Toggle">
              <Power className="w-4 h-4" />
            </button>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700">No coupons yet</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">New coupon</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <input required placeholder="CODE (e.g. WELCOME10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inputCls} font-mono uppercase`} />
              <input placeholder="Description (internal)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-400">Percent off
                  <input type="number" min="0" max="100" placeholder="e.g. 10" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Flat ₹ off
                  <input type="number" min="0" placeholder="e.g. 100" value={form.discountFlat} onChange={(e) => setForm({ ...form, discountFlat: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Max discount ₹ (for %)
                  <input type="number" min="0" placeholder="optional" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Min order ₹
                  <input type="number" min="0" placeholder="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Max uses (0 = ∞)
                  <input type="number" min="0" placeholder="0" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-gray-400">Expires on
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
                </label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-teal-700 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Create</>}
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
