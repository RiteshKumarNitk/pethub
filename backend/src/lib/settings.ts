import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SiteSettings = {
  storeName: string;
  tagline: string;
  storeEmail: string;
  storePhone: string;
  whatsappNumber: string;
  storeAddress: string;
  storeHours: string;
  instagramUrl: string;
  facebookUrl: string;
  currency: string;
  shippingFee: number;
  freeShippingAbove: number;
  taxPercent: number;
  storePickupEnabled: boolean;
  bookingSlotMinutes: number;
  bookingOpenDays: number[];
  bookingOpenTime: string; // "09:00"
  bookingCloseTime: string; // "19:00"
  bookingMinLeadHours: number;
  bookingMaxAdvanceDays: number;
  listingModerationNotice: string;
  // Loyalty program (Sprint 3) — earn 1 pt per ₹N spent on paid orders; 1 pt = ₹1 redeemable value
  loyaltyEarnPerRupee: number;
  loyaltyMinRedeemPoints: number;
  loyaltyMaxRedeemPercent: number; // cap redemption at this % of order subtotal
  // Subscriptions (Sprint 3) — per-cycle discount on auto-ship orders
  subscriptionDiscountPercent: number;
  // Referral rewards (Sprint 3) — points granted when a new user signs up with a code
  referralRefereePoints: number;
  referralReferrerPoints: number;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  storeName: "PawStore",
  tagline: "Everything your pet needs in one place",
  storeEmail: "hello@pawstore.in",
  storePhone: "+91 98765 43210",
  whatsappNumber: "919876543210",
  storeAddress: "123 Pet Street, Mumbai, Maharashtra 400001",
  storeHours: "Mon–Sun, 9:00 AM – 8:00 PM",
  instagramUrl: "",
  facebookUrl: "",
  currency: "INR",
  shippingFee: 50,
  freeShippingAbove: 499,
  taxPercent: 0,
  storePickupEnabled: true,
  bookingSlotMinutes: 60,
  bookingOpenDays: [1, 2, 3, 4, 5, 6, 0],
  bookingOpenTime: "09:00",
  bookingCloseTime: "19:00",
  bookingMinLeadHours: 3,
  bookingMaxAdvanceDays: 30,
  listingModerationNotice:
    "All listings are reviewed by our team before they go live. Listings that appear unsafe, misleading, or related to prohibited species will be rejected.",
  loyaltyEarnPerRupee: 100, // 1 point per ₹100 paid
  loyaltyMinRedeemPoints: 50, // must redeem at least 50 pts
  loyaltyMaxRedeemPercent: 30, // points can cover at most 30% of subtotal
  subscriptionDiscountPercent: 5, // auto-ship cycles get 5% off
  referralRefereePoints: 50, // new customer bonus
  referralReferrerPoints: 100, // referrer bonus
};

// Cache settings for the duration of a serverless invocation
let cached: { data: SiteSettings; at: number } | null = null;
const CACHE_MS = 30_000;

export async function getSettings(): Promise<SiteSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  try {
    const rows = await db.select().from(siteSettings);
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<SiteSettings>;
    const data = { ...DEFAULT_SETTINGS, ...stored };
    cached = { data, at: Date.now() };
    return data;
  } catch (e) {
    console.error("getSettings failed, using defaults:", e);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  for (const [key, value] of entries) {
    await db
      .insert(siteSettings)
      .values({ key, value: value as never })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: value as never, updatedAt: new Date() } });
  }
  cached = null;
  return getSettings();
}

export function invalidateSettingsCache() {
  cached = null;
}
