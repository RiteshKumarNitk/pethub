import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { getBalance, getHistory, ensureReferralCode, applyReferral } from "@/lib/loyalty";

async function requireUserId(request: NextRequest): Promise<number | null> {
  return parseInt(request.headers.get("x-user-id") || "0") || null;
}

/**
 * GET /api/rewards — balance, history, settings-driven rules, referral info.
 */
export async function GET(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const [settings, balance, history] = await Promise.all([
    getSettings(),
    getBalance(userId),
    getHistory(userId, 30),
  ]);

  const referralCode = await ensureReferralCode(userId);
  const [referredCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(eq(users.referredBy, referralCode));

  return NextResponse.json({
    balance,
    history,
    referral: {
      code: referralCode,
      friendsReferred: referredCount?.count ?? 0,
    },
    rules: {
      earnPerRupee: settings.loyaltyEarnPerRupee,
      redeemValue: 1, // 1 point = ₹1
      maxRedeemPercent: settings.loyaltyMaxRedeemPercent,
      minRedeemPoints: settings.loyaltyMinRedeemPoints,
      referralReferrerPoints: settings.referralReferrerPoints,
      referralRefereePoints: settings.referralRefereePoints,
    },
  });
}

/**
 * POST /api/rewards — apply a referral code (new users attach at signup/first visit).
 * body: { code }
 */
export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    const body = await request.json();
    const result = await applyReferral(userId, String(body?.code || ""));
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not apply code" }, { status: 400 });
    }
    const balance = await getBalance(userId);
    return NextResponse.json({ ok: true, balance });
  } catch (e) {
    console.error("Apply referral failed:", e);
    return NextResponse.json({ error: "Could not apply referral code" }, { status: 500 });
  }
}
