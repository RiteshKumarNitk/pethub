"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, User, Mail, Phone, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: number; name?: string | null; phone?: string; email?: string | null } | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mobile/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setUser(d.user);
          setForm({ name: d.user.name || "", email: d.user.email || "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/mobile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-lg">
      <h2 className="font-black text-gray-900 text-lg mb-5">Profile Settings</h2>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-4">
          <div className="w-11 h-11 bg-teal-50 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Phone verified</p>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {user?.phone}</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Display name</span>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-300" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Email</span>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-300" />
            </div>
          </label>
          <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-xs text-gray-500">
        <p className="font-bold text-gray-700 mb-1">Your data & privacy</p>
        We store only what's needed to serve you: contact details, orders, bookings and pet profiles you create.
        Contact us anytime to request deletion of your account data.
      </div>
    </div>
  );
}
