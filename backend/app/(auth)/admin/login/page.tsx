"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Phone, ArrowRight, CheckCircle2, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
  });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phone: formData.phone,
          otp: formData.otp,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          setError("Access denied. Admin credentials required.");
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,146,60,0.05),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/10 relative z-10"
      >
        {/* Admin Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-orange-500/20 border border-orange-400/20">
            <Shield className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-1 tracking-tight">Admin Panel</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Authorized Personnel Only</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-8 bg-slate-700" />
            <Lock className="w-3 h-3 text-slate-600" />
            <div className="h-px w-8 bg-slate-700" />
          </div>
        </div>

        {step === 1 ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSendOTP}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Admin Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="tel"
                  required
                  placeholder="+911234567890"
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all text-white text-sm font-medium placeholder:text-slate-600"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleVerifyOTP}
            className="space-y-6"
          >
            <div className="bg-orange-500/10 p-4 rounded-2xl flex items-center gap-3 border border-orange-500/20">
              <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm text-orange-300 font-bold">OTP sent</p>
                <p className="text-xs text-slate-500">{formData.phone}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 text-center text-2xl font-bold tracking-[1em] text-white transition-all placeholder:text-slate-600"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify & Access Panel"
              )}
            </button>

            <button
              type="button"
              className="w-full text-center text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setStep(1)}
            >
              Change Phone Number
            </button>
          </motion.form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-3">
          <Link
            href="/login"
            className="inline-block text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest"
          >
            Customer Login
          </Link>
          <p className="text-[10px] text-slate-700 font-medium">
            PawStore v2.0 &middot; Admin Console
          </p>
        </div>
      </motion.div>
    </div>
  );
}
