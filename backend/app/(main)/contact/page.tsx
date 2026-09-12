"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader2, Check, MessageCircle } from "lucide-react";

const TYPES = [
  { value: "general", label: "General enquiry" },
  { value: "product", label: "Product question" },
  { value: "service", label: "Service question" },
  { value: "booking", label: "Booking help" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    type: "general", subject: "", message: "",
    contactName: "", contactPhone: "", contactEmail: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message");
      } else {
        setSent(true);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Contact Us</h1>
        <p className="text-gray-500 mt-3">
          A real person reads every message. We reply within 24 hours — or just call the shop.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Info */}
        <div className="md:col-span-2 space-y-4">
          {[
            { icon: Phone, label: "Call us", value: "+91 98765 43210", href: "tel:+919876543210" },
            { icon: MessageCircle, label: "WhatsApp", value: "+91 98765 43210", href: "https://wa.me/919876543210" },
            { icon: Mail, label: "Email", value: "hello@pawstore.in", href: "mailto:hello@pawstore.in" },
            { icon: MapPin, label: "Visit", value: "123 Pet Street, Mumbai 400001", href: null },
            { icon: Clock, label: "Hours", value: "Mon–Sun, 9 AM – 8 PM", href: null },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <c.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="text-sm font-semibold text-gray-900 hover:text-orange-600">{c.value}</a>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{c.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="md:col-span-3">
          {sent ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-teal-600" />
              </div>
              <h2 className="font-black text-gray-900 text-xl">Message sent!</h2>
              <p className="text-sm text-gray-500 mt-2">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3.5">
              <div className="grid md:grid-cols-2 gap-3.5">
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">What's this about?</span>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Subject *</span>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Grooming for my Seniors" className={inputCls} />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">Message *</span>
                <textarea required rows={5} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you need…" className={inputCls} />
              </label>
              <div className="grid md:grid-cols-3 gap-3.5">
                <input required placeholder="Your name *" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
                <input required placeholder="Phone *" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
                <input type="email" placeholder="Email (optional)" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputCls} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={sending} className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400";
