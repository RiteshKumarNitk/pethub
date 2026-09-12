"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, User, ArrowRight, CheckCircle2, Loader2, PawPrint } from "lucide-react";
import Link from "next/link";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    otp: "",
  });

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setStep(1);
    setError("");
    setSuccess("");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({
          phone: formData.phone,
          name: formData.name,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`OTP sent to ${formData.phone}`);
        setStep(2);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
        const isAdmin = data.user?.role === "admin";
        router.push(isAdmin ? "/admin" : "/account");
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-orange-50 via-white to-teal-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-orange-500/10 p-10 border border-white relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform">
              <PawPrint className="text-white w-8 h-8" />
            </div>
          </Link>
          <h2 className="text-3xl font-black text-[hsl(var(--secondary))] mb-1 tracking-tight">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            {isSignUp ? "Join the PawStore family" : "Sign in to your account"}
          </p>
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div className="flex bg-gray-50 p-1 rounded-2xl mb-8">
          <button
            onClick={() => { setIsSignUp(false); setStep(1); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              !isSignUp ? "bg-white text-[hsl(var(--secondary))] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setStep(1); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isSignUp ? "bg-white text-[hsl(var(--secondary))] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOTP}
              className="space-y-5"
            >
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number (with +)"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all text-sm font-medium"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-600 text-sm font-medium text-center bg-green-50 p-3 rounded-xl border border-green-100"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  {success}
                </motion.p>
              )}
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOTP}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-orange-50 to-teal-50 p-4 rounded-2xl flex items-center gap-3 border border-orange-100">
                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm text-orange-800 font-bold">Verification code sent</p>
                  <p className="text-xs text-gray-500">{formData.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-center text-2xl font-bold tracking-[1em] focus:bg-white transition-all"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <button
                type="button"
                className="w-full text-center text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
                onClick={() => setStep(1)}
              >
                Change Phone Number
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-xs font-medium text-gray-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={toggleMode}
              className="text-orange-500 font-black hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
          <Link
            href="/admin/login"
            className="inline-block mt-3 text-xs font-bold text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-widest"
          >
            Admin Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
