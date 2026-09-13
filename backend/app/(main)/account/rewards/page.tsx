"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Gift, Copy, Check, Loader2, Coins, Users, Ticket, Sparkles } from "lucide-react";

interface LedgerEntry {
  id: number;
  points: number;
  kind: string;
  note: string | null;
  createdAt: string;
}

interface RewardsData {
  balance: number;
  history: LedgerEntry[];
  referral: { code: string; friendsReferred: number };
  rules: {
    earnPerRupee: number;
    redeemValue: number;
    maxRedeemPercent: number;
    minRedeemPoints: number;
    referralReferrerPoints: number;
    referralRefereePoints: number;
  };
}

const KIND_LABELS: Record<string, string> = {
  earn_order: "Order reward",
  redeem_order: "Redeemed on order",
  referral_bonus: "Referral bonus",
  adjustment: "Adjustment",
};

export default function AccountRewardsPage() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [applyMsg, setApplyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/rewards");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyCode = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referral.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — code is visible anyway
    }
  };

  const applyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setApplyMsg({ ok: true, text: `Code applied — ${d.balance} points available!` });
        setCodeInput("");
        await load();
      } else {
        setApplyMsg({ ok: false, text: d.error || "Could not apply code" });
      }
    } catch {
      setApplyMsg({ ok: false, text: "Network error — please try again" });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
        <p className="text-gray-500">Could not load rewards. Please refresh.</p>
      </div>
    );
  }

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/login?ref=${data.referral.code}`;

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Rewards</h1>
      <p className="text-sm text-gray-500 mb-6">Earn points on every order — redeem them like cash at checkout.</p>

      {/* Balance hero */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-3">
          <Coins className="w-8 h-8 opacity-90" />
          <div>
            <p className="text-sm font-semibold opacity-90">Point balance</p>
            <p className="text-4xl font-black">{data.balance} <span className="text-lg font-bold opacity-90">points = ₹{data.balance}</span></p>
          </div>
        </div>
        <p className="text-xs opacity-90 mt-3">
          1 point = ₹1 · redeem up to {data.rules.maxRedeemPercent}% of any order's value · min {data.rules.minRedeemPoints} points
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Earn rules */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-orange-500" /> How to earn
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex justify-between"><span>Place an order</span><span className="font-bold text-gray-900">1 pt per ₹{data.rules.earnPerRupee}</span></li>
            <li className="flex justify-between"><span>Friend joins with your code</span><span className="font-bold text-gray-900">+{data.rules.referralReferrerPoints} pts</span></li>
            <li className="flex justify-between"><span>You join via a friend's code</span><span className="font-bold text-gray-900">+{data.rules.referralRefereePoints} pts</span></li>
          </ul>
          <Link href="/shop" className="inline-block mt-4 text-xs font-bold text-orange-600 hover:text-orange-700">Start earning →</Link>
        </div>

        {/* Referral */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-teal-600" /> Refer a friend
          </h2>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
            <code className="flex-1 font-black tracking-widest text-gray-900">{data.referral.code}</code>
            <button onClick={copyCode} className="text-gray-400 hover:text-orange-600" aria-label="Copy referral code">
              {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Share <code className="text-gray-500">{referralLink}</code> — you get {data.rules.referralReferrerPoints} pts, they get {data.rules.referralRefereePoints} pts.
          </p>
          <p className="text-xs font-semibold text-teal-700 mt-2">{data.referral.friendsReferred} friend{data.referral.friendsReferred === 1 ? "" : "s"} joined with your code</p>
        </div>
      </div>

      {/* Apply a code */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Ticket className="w-4 h-4 text-amber-500" /> Have a referral code?
        </h2>
        <form onSubmit={applyCode} className="flex gap-2">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:border-orange-300"
          />
          <button type="submit" disabled={applying || !codeInput.trim()} className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-xs font-bold px-5 rounded-lg">
            {applying ? "…" : "Apply"}
          </button>
        </form>
        {applyMsg && <p className={`text-xs mt-2 font-semibold ${applyMsg.ok ? "text-teal-600" : "text-red-500"}`}>{applyMsg.text}</p>}
      </div>

      {/* History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Gift className="w-4 h-4 text-orange-500" /> History
        </h2>
        {data.history.length === 0 ? (
          <p className="text-sm text-gray-400">No points activity yet — place your first order to start earning.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{KIND_LABELS[h.kind] || h.kind}</p>
                  <p className="text-xs text-gray-400">{h.note || ""} · {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <p className={`font-black text-sm ${h.points > 0 ? "text-teal-600" : "text-amber-600"}`}>
                  {h.points > 0 ? "+" : ""}{h.points}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
