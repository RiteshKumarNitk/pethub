"use client";

import { useEffect, useState } from "react";
import {
  Settings, Save, Loader2, CheckCircle2, Store, Phone, MapPin, Clock,
  Truck, Calendar, ShieldCheck, IndianRupee,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          shippingFee: parseFloat(settings.shippingFee) || 0,
          freeShippingAbove: parseFloat(settings.freeShippingAbove) || 0,
          taxPercent: parseFloat(settings.taxPercent) || 0,
          bookingSlotMinutes: parseInt(settings.bookingSlotMinutes) || 60,
          bookingMinLeadHours: parseInt(settings.bookingMinLeadHours) || 3,
          bookingMaxAdvanceDays: parseInt(settings.bookingMaxAdvanceDays) || 30,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string | number | number[]) => setSettings((s: any) => ({ ...s, [key]: value }));

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  if (!settings) return <p className="text-gray-500">Failed to load settings.</p>;

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Business info, shipping and booking rules — used across the storefront.</p>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Business */}
        <Section icon={Store} title="Business Information">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Store name"><input value={settings.storeName} onChange={(e) => set("storeName", e.target.value)} className={inputCls} /></Field>
            <Field label="Tagline"><input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} /></Field>
            <Field label="Phone"><input value={settings.storePhone} onChange={(e) => set("storePhone", e.target.value)} className={inputCls} /></Field>
            <Field label="WhatsApp number (with country code)"><input value={settings.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} className={inputCls} /></Field>
            <Field label="Email"><input value={settings.storeEmail} onChange={(e) => set("storeEmail", e.target.value)} className={inputCls} /></Field>
            <Field label="Store hours"><input value={settings.storeHours} onChange={(e) => set("storeHours", e.target.value)} className={inputCls} /></Field>
            <Field label="Address" full><input value={settings.storeAddress} onChange={(e) => set("storeAddress", e.target.value)} className={inputCls} /></Field>
          </div>
        </Section>

        {/* Shipping */}
        <Section icon={Truck} title="Shipping & Tax">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Shipping fee (₹)"><input type="number" min="0" value={settings.shippingFee} onChange={(e) => set("shippingFee", e.target.value)} className={inputCls} /></Field>
            <Field label="Free shipping above (₹)"><input type="number" min="0" value={settings.freeShippingAbove} onChange={(e) => set("freeShippingAbove", e.target.value)} className={inputCls} /></Field>
            <Field label="Tax (%)"><input type="number" min="0" max="28" value={settings.taxPercent} onChange={(e) => set("taxPercent", e.target.value)} className={inputCls} /></Field>
          </div>
        </Section>

        {/* Bookings */}
        <Section icon={Calendar} title="Booking Rules">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Slot length (minutes)"><input type="number" min="15" step="15" value={settings.bookingSlotMinutes} onChange={(e) => set("bookingSlotMinutes", e.target.value)} className={inputCls} /></Field>
            <Field label="Open time"><input type="time" value={settings.bookingOpenTime} onChange={(e) => set("bookingOpenTime", e.target.value)} className={inputCls} /></Field>
            <Field label="Close time"><input type="time" value={settings.bookingCloseTime} onChange={(e) => set("bookingCloseTime", e.target.value)} className={inputCls} /></Field>
            <Field label="Min lead time (hours)"><input type="number" min="0" value={settings.bookingMinLeadHours} onChange={(e) => set("bookingMinLeadHours", e.target.value)} className={inputCls} /></Field>
            <Field label="Max advance (days)"><input type="number" min="1" value={settings.bookingMaxAdvanceDays} onChange={(e) => set("bookingMaxAdvanceDays", e.target.value)} className={inputCls} /></Field>
          </div>
        </Section>

        {/* Trust */}
        <Section icon={ShieldCheck} title="Listing Moderation">
          <Field label="Notice shown on the Sell/Rehome form" full>
            <textarea value={settings.listingModerationNotice} onChange={(e) => set("listingModerationNotice", e.target.value)} rows={3} className={inputCls} />
          </Field>
        </Section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
          {saved && <span className="text-teal-600 text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        </div>
      </form>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Store; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Icon className="w-4.5 h-4.5 text-teal-700" /> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400";
