import { db } from "@/db";
import { loyaltyLedger, users, orders } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/utils";

/**
 * Loyalty ledger rules:
 * - balance = SUM(points); negative rows are redemptions
 * - redeemPoints() is called only inside order creation (pre-payment): the order
 *   stores loyaltyPointsRedeemed and a `redeem_order` row is written atomically.
 * - If payment never completes, cancel-order cleanup reverses the redemption.
 * - earnForOrder() runs on payment capture (verify/webhook) — never before money moves.
 */

export async function getBalance(userId: number): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${loyaltyLedger.points}), 0)` })
    .from(loyaltyLedger)
    .where(eq(loyaltyLedger.userId, userId));
  return Math.max(0, row?.total ?? 0);
}

export async function getHistory(userId: number, limit = 25) {
  return db
    .select()
    .from(loyaltyLedger)
    .where(eq(loyaltyLedger.userId, userId))
    .orderBy(sql`${loyaltyLedger.createdAt} DESC`)
    .limit(limit);
}

/** Redeem value: 1 point = ₹1, capped at loyaltyMaxRedeemPercent of subtotal. */
export function maxRedeemValue(subtotal: number, settings: Awaited<ReturnType<typeof getSettings>>): number {
  return Math.floor((subtotal * settings.loyaltyMaxRedeemPercent) / 100);
}

export function validateRedemption(
  points: number,
  balance: number,
  subtotal: number,
  settings: Awaited<ReturnType<typeof getSettings>>
): { ok: true; value: number } | { ok: false; error: string } {
  const p = Math.floor(points);
  if (!p || p <= 0) return { ok: false, error: "Invalid points amount" };
  if (p < settings.loyaltyMinRedeemPoints) {
    return { ok: false, error: `Minimum redemption is ${settings.loyaltyMinRedeemPoints} points` };
  }
  if (p > balance) return { ok: false, error: "Not enough points" };
  const cap = maxRedeemValue(subtotal, settings);
  if (p > cap) {
    return { ok: false, error: `You can use at most ${cap} points on this order (${settings.loyaltyMaxRedeemPercent}% of subtotal)` };
  }
  return { ok: true, value: p };
}

/**
 * Record a redemption against an order. Caller must persist order.loyaltyPointsRedeemed
 * inside the same transaction to keep the books consistent.
 */
export async function recordRedemption(userId: number, points: number, orderId: number): Promise<void> {
  await db.insert(loyaltyLedger).values({
    userId,
    points: -points,
    kind: "redeem_order",
    orderId,
    note: `Redeemed on order #${orderId}`,
  });
}

/** Award order points on payment capture. Idempotent per order via the orders.loyaltyPointsEarned marker. */
export async function earnForOrder(orderId: number): Promise<number> {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || !order.userId) return 0;
    if (order.loyaltyPointsEarned > 0) return order.loyaltyPointsEarned; // already awarded

    const settings = await getSettings();
    const payable = parseFloat(order.total) + order.loyaltyPointsRedeemed; // earn on what they actually paid for
    const points = Math.floor(payable / settings.loyaltyEarnPerRupee);
    if (points <= 0) return 0;

    await db.insert(loyaltyLedger).values({
      userId: order.userId,
      points,
      kind: "earn_order",
      orderId,
      note: `Earned on order ${order.orderNumber}`,
    });
    await db.update(orders).set({ loyaltyPointsEarned: points, updatedAt: new Date() }).where(eq(orders.id, orderId));

    await createNotification({
      userId: order.userId,
      type: "loyalty",
      title: `+${points} points earned 🎉`,
      body: `You earned ${points} points from order ${order.orderNumber}. Balance: use them at checkout.`,
      link: "/account/rewards",
    });
    return points;
  } catch (e) {
    // Never fail payment capture because of loyalty
    console.error("earnForOrder failed (non-fatal):", e);
    return 0;
  }
}

/** Reverse a redemption when an unpaid order is cancelled. */
export async function reverseRedemption(orderId: number): Promise<void> {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || !order.userId || order.loyaltyPointsRedeemed <= 0) return;
    // Only reverse while nothing was earned/fulfilled on the order
    if (order.loyaltyPointsEarned > 0) return;
    const [existing] = await db
      .select({ id: loyaltyLedger.id })
      .from(loyaltyLedger)
      .where(sql`${loyaltyLedger.kind} = 'adjustment' AND ${loyaltyLedger.orderId} = ${orderId}`)
      .limit(1);
    if (existing) return; // already reversed
    await db.insert(loyaltyLedger).values({
      userId: order.userId,
      points: order.loyaltyPointsRedeemed,
      kind: "adjustment",
      orderId,
      note: `Points returned — order ${order.orderNumber} cancelled`,
    });
    await createNotification({
      userId: order.userId,
      type: "loyalty",
      title: "Points returned",
      body: `${order.loyaltyPointsRedeemed} points from order ${order.orderNumber} are back in your balance.`,
      link: "/account/rewards",
    });
  } catch (e) {
    console.error("reverseRedemption failed (non-fatal):", e);
  }
}

// ---------- Referrals ----------

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1 — no lookalike confusion

export function generateReferralCode(userId: number): string {
  let hash = userId;
  for (let i = 0; i < 5; i++) {
    hash = (hash * 31 + 17) % 999983;
  }
  let code = "";
  let h = hash;
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[h % CODE_ALPHABET.length];
    h = Math.floor(h / CODE_ALPHABET.length) + userId * (i + 3);
  }
  return code;
}

/** Lazily assign a unique referral code. Safe to call on every request. */
export async function ensureReferralCode(userId: number): Promise<string> {
  const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode(userId + attempt * 7919);
    try {
      const [updated] = await db.update(users).set({ referralCode: code }).where(sql`${users.id} = ${userId} AND ${users.referralCode} IS NULL`).returning();
      if (updated?.referralCode) return updated.referralCode;
    } catch {
      // unique collision — retry with a different seed
    }
  }
  const [fallback] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  return fallback?.referralCode ?? `P${userId}X`;
}

/**
 * Attach a referral at signup and pay both bonuses.
 * Idempotent: a user who already has referredBy set is skipped.
 */
export async function applyReferral(newUserId: number, rawCode: string): Promise<{ ok: boolean; error?: string }> {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "No code" };

  const [referrer] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.referralCode, code)).limit(1);
  if (!referrer) return { ok: false, error: "Invalid referral code" };
  if (referrer.id === newUserId) return { ok: false, error: "You cannot refer yourself" };

  // Set once — first code wins, no re-binding
  const [claimed] = await db
    .update(users)
    .set({ referredBy: code })
    .where(sql`${users.id} = ${newUserId} AND ${users.referredBy} IS NULL`)
    .returning();
  if (!claimed) return { ok: false, error: "Referral already applied" };

  const settings = await getSettings();
  try {
    await db.insert(loyaltyLedger).values([
      {
        userId: newUserId,
        points: settings.referralRefereePoints,
        kind: "referral_bonus",
        note: "Welcome bonus — referred by a friend",
      },
      {
        userId: referrer.id,
        points: settings.referralReferrerPoints,
        kind: "referral_bonus",
        note: "Referral bonus — a friend joined with your code",
      },
    ]);
  } catch (e) {
    console.error("Referral bonus insert failed:", e);
  }

  await createNotification({
    userId: referrer.id,
    type: "loyalty",
    title: "Referral bonus earned 🎉",
    body: `${settings.referralReferrerPoints} points added — a friend joined PawStore with your code.`,
    link: "/account/rewards",
  });
  await createNotification({
    userId: newUserId,
    type: "loyalty",
    title: `Welcome! ${settings.referralRefereePoints} points added 🎉`,
    body: "Your referral bonus is ready to use at checkout.",
    link: "/account/rewards",
  });
  await logAudit(newUserId, "referral.applied", "user", newUserId, { referrerId: referrer.id, code });
  return { ok: true };
}
