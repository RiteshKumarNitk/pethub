"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  Store,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Shield,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Globe,
  Smartphone,
  CreditCard,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    storeName: "PawStore",
    storeEmail: "hello@pawstore.in",
    storePhone: "+91 9876543210",
    storeAddress: "123 Pet Street, Mumbai, Maharashtra 400001",
    currency: "INR",
    taxRate: "18",
    shippingFee: "50",
    freeShippingAbove: "500",
    whatsappNumber: "919876543210",
    orderStatusEmail: true,
    smsNotifications: false,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    // Simulate save (in production, save to DB/env)
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tighter">Settings</h1>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Configure your store</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Store Information */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Store className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight">Store Information</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Basic business details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Store Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Store Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Store Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Store Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Shipping */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight">Pricing & Shipping</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Taxes, fees and thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Currency</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tax Rate (%)</label>
              <input
                type="number"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shipping Fee (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                value={settings.shippingFee}
                onChange={(e) => setSettings({ ...settings, shippingFee: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Free Shipping Above (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                value={settings.freeShippingAbove}
                onChange={(e) => setSettings({ ...settings, freeShippingAbove: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp Business Number</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight">Notifications</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order and system alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <div>
                <p className="font-black text-[hsl(var(--secondary))] text-sm">Order Status Emails</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Send email updates on order status changes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.orderStatusEmail}
                onChange={(e) => setSettings({ ...settings, orderStatusEmail: e.target.checked })}
                className="w-5 h-5 accent-orange-500"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <div>
                <p className="font-black text-[hsl(var(--secondary))] text-sm">SMS Notifications</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Send SMS alerts for new orders</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="w-5 h-5 accent-orange-500"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Settings
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest"
            >
              <CheckCircle2 className="w-4 h-4" /> Settings saved
            </motion.span>
          )}
        </div>
      </form>
    </div>
  );
}
